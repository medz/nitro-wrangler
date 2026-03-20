import { defineBuilderOutputTests } from "./builder-output-suite.mjs";

defineBuilderOutputTests("rollup", {
  requiredRuntimeChunkPatterns: [/^hookable\.mjs$/, /^h3(?:\+rou3\+srvx)?\.mjs$/],
});
