import { db } from "../dbConnection";
import { eq } from "drizzle-orm";
import { churchOrganization } from "@/server/db/schema";

interface GetChurchOrganizationParams {
	id: string;
}

/**
 * Retrieves a church organization by its ID
 * Returns null if the organization doesn't exist
 */
export async function getChurchOrganization({
	id,
}: GetChurchOrganizationParams) {
	if (!id) {
		return null;
	}

	try {
		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, id))
			.then((res) => res[0]);

		return organization || null;
	} catch (error) {
		console.error("Error fetching church organization:", error);
		return null;
	}
}
