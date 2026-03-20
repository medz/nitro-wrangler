import { Client } from "pg";

export default {
  async fetch() {
    const client = new Client({
      connectionString: "postgresql://seven@localhost:5432/test",
    });
    try {
      await client.connect();
      const result = await client.query("SELECT * FROM pg_tables");
      return Response.json({
        success: true,
        result: result.rows,
      });
    } catch (error: any) {
      console.error("Database error:", error.message);
      return new Response("Internal error occurred", { status: 500 });
    }
  },
};
