import { config } from "dotenv";
config(); // Load .env
import { getDb } from "../server/db";
import { users, sessions, memberships } from "../shared/schema";
import { eq, inArray } from "drizzle-orm";

async function run() {
  const db = getDb();
  const groupIds = [
    "9863683b-f6e9-4ed5-a21f-ce7da01bdadf",
    "4b0b499a-6aef-43de-a1a3-1cd088579a6c"
  ];

  console.log("Starting deletion for test users in groupIds:", groupIds);

  try {
    // 1. Get all users in these groups
    const usersToDelete = await db.select().from(users).where(inArray(users.groupId, groupIds));
    const userIds = usersToDelete.map(u => u.id);

    if (userIds.length === 0) {
      console.log("No users found for these groups.");
      process.exit(0);
    }

    console.log(`Found ${userIds.length} test users to delete.`);

    // 2. Delete associated sessions
    console.log("Deleting sessions...");
    await db.delete(sessions).where(inArray(sessions.userId, userIds));
    console.log("Sessions deleted successfully.");

    // 3. Delete memberships
    console.log("Checking for memberships...");
    await db.delete(memberships).where(inArray(memberships.userId, userIds));
    console.log("Memberships deleted (if any).");

    // 4. Finally, delete the test users
    console.log("Deleting test user records...");
    await db.delete(users).where(inArray(users.id, userIds));
    console.log("User records deleted successfully.");

    console.log("All clean! Test users have been removed.");
  } catch (error) {
    console.error("Error occurred during deletion:", error);
  } finally {
    process.exit(0);
  }
}

run();
