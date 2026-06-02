import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? "biasgame",
  user: process.env.POSTGRES_USER ?? "biasgame",
  password: process.env.POSTGRES_PASSWORD ?? "biasgame",
});

pool.on("error", (err) => {
  console.error("Unexpected DB pool error", err);
});
