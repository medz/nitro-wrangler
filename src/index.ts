import type { Nitro, NitroModule } from "nitro/types";
import type { Plugin } from "rollup";
import { existsSync } from "node:fs";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { presetsDir, runtimeDir } from "nitro/meta";

const USER_CODE_EXTERNAL_MARKER = "nitro-wrangler:user-code-external";

const nitroWrangler: NitroModule = {
  name: "nitro-wrangler",
  setup(nitro) {
    nitro.hooks.hook("rollup:before", (_nitro, config) => {
      if (nitro.options.dev) {
        return;
      }

      const existingPlugins = config.plugins ? [config.plugins].flat() : [];
      config.plugins = [userCodeExternal(nitro), ...existingPlugins];
    });

    nitro.hooks.hook("compiled", async () => {
      if (nitro.options.dev || nitro.options.static) {
        return;
      }

      if (!existsSync(nitro.options.output.serverDir)) {
        return;
      }

      await rewriteOutputImports(nitro, nitro.options.output.serverDir);
      await rewriteWranglerConfig(nitro, nitro.options.output.serverDir);
      nitro.logger.success(
        `nitro-wrangler rewrote \`${relative(process.cwd(), nitro.options.output.serverDir)}\``,
      );
    });
  },
};

export default nitroWrangler;

function userCodeExternal(nitro: Nitro): Plugin {
  return {
    name: USER_CODE_EXTERNAL_MARKER,
    resolveId: {
      order: "pre",
      handler(id) {
        const [path] = splitSpecifier(id);
        if (!path || !isUserCodePath(path, nitro)) {
          return null;
        }
        return {
          id,
          external: true,
          moduleSideEffects: true,
        };
      },
    },
  };
}

async function rewriteOutputImports(nitro: Nitro, serverDir: string) {
  const files = await listModuleFiles(serverDir);

  await Promise.all(
    files.map(async (file) => {
      const source = await readFile(file, "utf8");
      const rewritten = rewriteModuleImports(source, file, nitro);
      if (rewritten !== source) {
        await writeFile(file, rewritten);
      }
    }),
  );
}

function rewriteModuleImports(source: string, fromFile: string, nitro: Nitro) {
  const rewrite = (specifier: string) =>
    rewriteSpecifier(specifier, fromFile, nitro);

  return source
    .replace(
      /from\s+(['"])([^'"]+)\1/g,
      (_full, quote: string, specifier: string) => {
        return `from ${quote}${rewrite(specifier)}${quote}`;
      },
    )
    .replace(
      /\bimport\s+(['"])([^'"]+)\1/g,
      (_full, quote: string, specifier: string) => {
        return `import ${quote}${rewrite(specifier)}${quote}`;
      },
    )
    .replace(
      /import\(\s*(['"])([^'"]+)\1\s*\)/g,
      (_full, quote: string, specifier: string) => {
        return `import(${quote}${rewrite(specifier)}${quote})`;
      },
    );
}

function rewriteSpecifier(specifier: string, fromFile: string, nitro: Nitro) {
  const [path, query] = splitSpecifier(specifier);
  if (!path || !isUserCodePath(path, nitro)) {
    return specifier;
  }

  const relativePath = toPosixPath(relative(dirname(fromFile), path));
  const normalized = relativePath.startsWith(".")
    ? relativePath
    : `./${relativePath}`;
  return normalized + query;
}

function splitSpecifier(specifier: string) {
  const queryIndex = specifier.indexOf("?");
  if (queryIndex < 0) {
    return [specifier, ""] as const;
  }
  return [specifier.slice(0, queryIndex), specifier.slice(queryIndex)] as const;
}

function isUserCodePath(path: string, nitro: Nitro) {
  if (!isAbsolute(path) || isNodeModulesPath(path)) {
    return false;
  }
  if (isSubpath(path, runtimeDir) || isSubpath(path, presetsDir)) {
    return false;
  }

  const includeRoots = [
    ...new Set([nitro.options.rootDir, ...nitro.options.scanDirs]),
  ];
  const excludeRoots = [
    nitro.options.buildDir,
    nitro.options.output.dir,
    nitro.options.output.serverDir,
    nitro.options.output.publicDir,
  ];

  if (!includeRoots.some((root) => isSubpath(path, root))) {
    return false;
  }
  return !excludeRoots.some((root) => isSubpath(path, root));
}

function isNodeModulesPath(path: string) {
  return /[/\\]node_modules[/\\]/.test(path);
}

function isSubpath(path: string, parent: string) {
  const rel = relative(parent, path);
  return !rel || (!rel.startsWith("..") && !isAbsolute(rel));
}

function toPosixPath(path: string) {
  return path.replace(/\\/g, "/");
}

async function listModuleFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = resolve(dir, entry.name);
      if (entry.isDirectory()) {
        return listModuleFiles(fullPath);
      }
      if (/\.(?:mjs|js)$/.test(entry.name)) {
        return [fullPath];
      }
      return [];
    }),
  );

  return files.flat();
}

async function rewriteWranglerConfig(nitro: Nitro, serverDir: string) {
  const outputPath = resolve(serverDir, "wrangler.json");

  if (!existsSync(outputPath)) {
    nitro.logger.warn(
      "nitro-wrangler could not find Nitro wrangler.json to rewrite.",
    );
    return;
  }

  const config = JSON.parse(await readFile(outputPath, "utf8")) as Record<
    string,
    unknown
  >;
  config.main = "index.mjs";
  config.no_bundle = false;

  await writeFile(outputPath, JSON.stringify(config, null, 2));
}
