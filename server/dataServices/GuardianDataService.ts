import { eq } from "drizzle-orm";
import { db } from "../db";
import { guardiansTable } from "../db/schema";


export async function getGuardian(guardianId: string) {
	const guardian = await db.select().from(guardiansTable).where(eq(guardiansTable.id, guardianId));
	return guardian[0] as typeof guardiansTable.$inferSelect;
}



