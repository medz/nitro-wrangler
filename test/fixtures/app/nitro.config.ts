import { defineConfig } from "nitro/config";
import nitroWrangler from "nitro-wrangler";

const builder = process.env.NITRO_BUILDER || "rolldown";

export default defineConfig({
  serverDir: "./",
  builder,
  preset: "cloudflare-module",
  compatibilityDate: "latest",
  buildDir: `.nitro/${builder}`,
  output: {
    dir: `.output/${builder}`,
  },
  modules: [nitroWrangler],
});
