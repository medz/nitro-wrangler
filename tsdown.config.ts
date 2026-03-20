import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: "esm",
  dts: true,
  clean: true,
  deps: {
    neverBundle: ["nitro", "rollup"],
  },
  outDir: "dist",
  platform: "node",
  unbundle: true,
  exports: true,
});
