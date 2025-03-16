import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

// This service is deprecated and should be replaced with UserDataService
// Keeping it for backward compatibility
export async function getGuardian(userId: string) {
	const user = await db.select().from(users).where(eq(users.id, userId));
	return user[0];
}
