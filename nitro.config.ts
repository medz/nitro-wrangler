import { defineConfig } from "nitro/config";

export default defineConfig({
  serverDir: "./",
  preset: "cloudflare-module",
  compatibilityDate: "latest",
});
