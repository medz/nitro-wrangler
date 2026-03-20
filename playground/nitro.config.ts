import { defineConfig } from "nitro/config";
import nitroWrangler from "nitro-wrangler";

export default defineConfig({
  serverDir: "./",
  preset: "cloudflare-module",
  compatibilityDate: "latest",
  modules: [nitroWrangler],
});
