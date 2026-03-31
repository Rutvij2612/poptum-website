import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";

async function run() {
  try {
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await db.insert(users).values({
      firstName: "Admin",
      lastName: "User",
      username: "admin",
      email: "admin@poptum.local",
      phone: "00000000",
      password: hashedPassword,
      role: "admin",
    });
    console.log("Admin seeded successfully.");
  } catch (err) {
    console.error("Failed to seed admin:", err);
  }
  process.exit(0);
}

run();
