import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  try {
    console.log("Dropping obsoleting items column from orders...");
    await db.execute(sql`ALTER TABLE orders DROP COLUMN IF EXISTS items;`);
    console.log("Adding first_name...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name text;`);
    
    console.log("Adding last_name...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name text;`);
    
    console.log("Adding email...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;`);
    
    console.log("Adding phone...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone text;`);
    
    console.log("Renaming password -> password_hash...");
    // Only rename if password column exists
    try {
      await db.execute(sql`ALTER TABLE users RENAME COLUMN password TO password_hash;`);
    } catch (e) {
      console.log("Column might already be renamed or missing.");
    }
    
    console.log("Adding created_at...");
    await db.execute(sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();`);

    console.log("Adding unique constraints...");
    try {
      await db.execute(sql`ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);`);
    } catch(e) {}
    try {
      await db.execute(sql`ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);`);
    } catch(e) {}

    console.log("Adding orders.status and orders.issue_note...");
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Ordered';`);
    await db.execute(sql`ALTER TABLE orders ADD COLUMN IF NOT EXISTS issue_note text;`);

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

migrate();
