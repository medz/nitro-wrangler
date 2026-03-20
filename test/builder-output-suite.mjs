import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

const rootDir = process.cwd();
const fixtureDir = resolve(rootDir, "test/fixtures/app");

export function defineBuilderOutputTests(builder, options) {
  const outputServerDir = resolve(fixtureDir, `.output/${builder}/server`);
  const { requiredRuntimeChunkPatterns } = options;

  test(`${builder} output externalizes user code`, async () => {
    const indexSource = await readFile(resolve(outputServerDir, "index.mjs"), "utf8");

    assert.match(indexSource, /from ["'](?:\.\.\/)+server\.ts["']/);
    assert.doesNotMatch(indexSource, /pg\+\[\.\.\.\]\.mjs/);
  });

  test(`${builder} output does not emit user dependency chunks`, async () => {
    const libs = await readdir(resolve(outputServerDir, "_libs"));

    assert.ok(
      requiredRuntimeChunkPatterns.every((pattern) =>
        libs.some((chunk) => pattern.test(chunk)),
      ),
      `missing expected runtime chunks for ${builder}: ${libs.join(", ")}`,
    );
    assert.ok(
      libs.every((chunk) => !chunk.includes("pg")),
      `unexpected user dependency chunk emitted for ${builder}: ${libs.join(", ")}`,
    );
  });

  test(`${builder} wrangler config enables downstream bundling`, async () => {
    const wranglerConfig = JSON.parse(
      await readFile(resolve(outputServerDir, "wrangler.json"), "utf8"),
    );

    assert.equal(wranglerConfig.main, "index.mjs");
    assert.equal(wranglerConfig.no_bundle, false);
  });
}
