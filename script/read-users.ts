import "dotenv/config";
import { db } from "../server/db";
import { users } from "../shared/schema";

async function main() {
  const allUsers = await db.select().from(users);
  console.log(allUsers);
  process.exit(0);
}

main().catch(console.error);

main().catch(console.error);
