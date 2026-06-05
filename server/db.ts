import "dotenv/config";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

/**
 * Idempotent column migrations — must run before any Drizzle query on `orders`
 * (schema includes `state`; DB may lag until this runs).
 */
export async function ensureDatabaseSchema(): Promise<void> {
  try {
    await pool.query(`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS country TEXT NOT NULL DEFAULT 'Germany'
    `);
  } catch (e) {
    console.error("[DB] Failed to ensure users.country column", e);
  }

  try {
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS razorpay_order_id TEXT
    `);
  } catch (e) {
    console.error("[DB] Failed to ensure orders.razorpay_order_id column", e);
  }

  try {
    await pool.query(`
      ALTER TABLE orders
      ADD COLUMN IF NOT EXISTS state TEXT
    `);
    console.log("[DB] orders.state column ensured");
  } catch (e) {
    console.error("[DB] Failed to ensure orders.state column", e);
  }
}

