import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

async function hashAdminPassword() {
  try {
    const adminUsername = "admin";
    const newPassword = "admin123";

    // 1. Find the admin user
    const [adminUser] = await db
      .select()
      .from(users)
      .where(eq(users.username, adminUsername));

    if (!adminUser) {
      console.log(`User '${adminUsername}' not found. Cannot update password.`);
      process.exit(1);
    }

    // 2. Hash the new password
    console.log(`Hashing new password for '${adminUsername}'...`);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 3. Update the user record
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.username, adminUsername));

    console.log(`Successfully updated password for '${adminUsername}'.`);
    console.log(`New temporary password: ${newPassword}`);
    process.exit(0);

  } catch (error) {
    console.error("Error updating admin password:", error);
    process.exit(1);
  }
}

hashAdminPassword();
