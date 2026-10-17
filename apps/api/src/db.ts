import "dotenv/config";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as embeddedDrizzle } from "drizzle-orm/pglite";
import { drizzle as pgDrizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "./schema.js";
export const embedded = process.env.DATABASE_URL
  ? null
  : new PGlite(process.env.DATA_DIR || "./data");
export const db = embedded
  ? embeddedDrizzle(embedded, { schema })
  : pgDrizzle(postgres(process.env.DATABASE_URL!), { schema });
export async function initialize() {
  // Bootstrap only the embedded development DB. PostgreSQL uses committed Drizzle migrations.
  if (!embedded) return;
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS merchants (id text PRIMARY KEY, name text NOT NULL)`,
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS products (id text PRIMARY KEY, merchant_id text NOT NULL REFERENCES merchants(id), name text NOT NULL, description text NOT NULL, category text NOT NULL, price integer NOT NULL CHECK(price >= 0), stock integer NOT NULL CHECK(stock >= 0), image text NOT NULL, active boolean NOT NULL DEFAULT true)`,
  );
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS orders (id text PRIMARY KEY, merchant_id text NOT NULL REFERENCES merchants(id), customer jsonb NOT NULL, items jsonb NOT NULL, total integer NOT NULL, status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now())`,
  );
}
