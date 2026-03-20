import { defineHandler } from "nitro";
import { playgroundLabel } from "../utils/label";

export default defineHandler(() => {
  return {
    ok: true,
    source: "routes/index.ts",
    label: playgroundLabel,
  };
});
