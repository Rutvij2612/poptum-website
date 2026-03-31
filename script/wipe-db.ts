import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Dropping tables...");
  try {
    await db.execute(sql`DROP SCHEMA public CASCADE;`);
    await db.execute(sql`CREATE SCHEMA public;`);
    console.log("Database wiped clean.");
  } catch (e) {
    console.error("Error wiping database:", e);
  }
  process.exit(0);
}

run();
