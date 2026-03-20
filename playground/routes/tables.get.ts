import { defineHandler } from "nitro";
import { listTables } from "../utils/pg";

export default defineHandler(async () => {
  const result = await listTables();

  return {
    ok: true,
    source: "routes/tables.get.ts",
    ...result,
  };
});
