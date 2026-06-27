import "dotenv/config";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL no está definida");
    process.exit(1);
  }

  // Extract database name from URL and connect without it
  const parsed = new URL(url);
  const dbName = parsed.pathname.replace(/^\//, "");
  parsed.pathname = "/postgres";

  const pool = new pg.Pool({ connectionString: parsed.toString() });
  const client = await pool.connect();

  try {
    const result = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [dbName]
    );
    if (result.rowCount === 0) {
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Base de datos "${dbName}" creada.`);
    } else {
      console.log(`Base de datos "${dbName}" ya existe.`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("Error al crear la base de datos:", e.message);
  process.exit(1);
});
