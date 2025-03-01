import { db } from "../../../server/db/dbConnection";
import { eq, and } from "drizzle-orm";
import { usersTochurchOrganization } from "@/server/db/schema";

interface VerifyUserAccessParams {
	userId: string;
	churchOrganizationId: string;
}

interface UserAccessResult {
	isMember: boolean;
	isAdmin: boolean;
}

/**
 * Verifies if a user has access to a specific church organization
 * and returns their membership status and admin privileges
 */
export async function verifyUserAccess({
	userId,
	churchOrganizationId,
}: VerifyUserAccessParams): Promise<UserAccessResult> {
	if (!userId || !churchOrganizationId) {
		return { isMember: false, isAdmin: false };
	}

	// Query the user's relationship with the organization
	const userOrg = await db
		.select()
		.from(usersTochurchOrganization)
		.where(
			and(
				eq(usersTochurchOrganization.userId, userId),
				eq(
					usersTochurchOrganization.churchOrganizationId,
					churchOrganizationId,
				),
			),
		)
		.then((res) => res[0]);

	if (!userOrg) {
		return { isMember: false, isAdmin: false };
	}

	return {
		isMember: true,
		isAdmin: userOrg.isAdmin,
	};
}
