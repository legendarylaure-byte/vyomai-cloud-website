import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema.js";

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;

if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
  db = drizzle(pool, { schema });
} else {
  console.log("⚠️ Database connection string (DATABASE_URL/POSTGRES_URL) not set - using in-memory storage");
}

export { pool, db };
