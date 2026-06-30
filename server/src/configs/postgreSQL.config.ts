import pg from "pg";

const { Pool } = pg;

const dbConfig = {
  connectionString: process.env.DATABASE_URL,
  host: process.env.POSTGRES_HOST ?? "localhost",
  port: Number(process.env.POSTGRES_PORT ?? 5432),
  database: process.env.POSTGRES_DB ?? "biasgame",
  user: process.env.POSTGRES_USER ?? "biasgame",
  password: process.env.POSTGRES_PASSWORD ?? "biasgame",
  connectionTimeoutMillis: 5000,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
};

console.log("[DB] Connecting to:", dbConfig.connectionString
  ? `CONNECTION_STRING (host hidden)`
  : `${dbConfig.host}:${dbConfig.port}/${dbConfig.database} user=${dbConfig.user}`
);

export class PostgreSQLConfig {
  static readonly pool = new Pool(dbConfig);
}

PostgreSQLConfig.pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err);
});
