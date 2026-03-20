import { defineBuilderOutputTests } from "./builder-output-suite.mjs";

defineBuilderOutputTests("vite", {
  requiredRuntimeChunkPatterns: [/^hookable\.mjs$/, /^h3(?:\+rou3\+srvx)?\.mjs$/],
});
