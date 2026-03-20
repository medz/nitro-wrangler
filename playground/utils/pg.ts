import { Client } from "pg";

export async function listTables() {
  const client = new Client({
    connectionString: "postgresql://seven@localhost:5432/test",
  });

  try {
    await client.connect();
    const result = await client.query("SELECT * FROM pg_tables");
    return {
      success: true,
      result: result.rows,
    };
  } catch (error: any) {
    console.error("Database error:", error.message);
    return {
      success: false,
      message: error.message,
    };
  } finally {
    await client.end().catch(() => {});
  }
}
