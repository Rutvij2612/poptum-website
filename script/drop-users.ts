import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function run() {
  console.log("Dropping users table...");
  try {
    await db.execute(sql`DROP TABLE IF EXISTS users CASCADE;`);
    console.log("Dropped table successfully.");
  } catch (e) {
    console.error("Error dropping table:", e);
  }
  process.exit(0);
}

run();
