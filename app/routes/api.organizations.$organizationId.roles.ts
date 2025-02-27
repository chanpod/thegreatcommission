import { eq } from "drizzle-orm";
import { organizationRoles, usersToOrganizationRoles } from "server/db/schema";
import { createAuthLoader } from "~/server/auth/authLoader";
import { db } from "~/server/dbConnection";

export const loader = createAuthLoader(async ({ request, params }) => {
	// Get all roles for the organization
	const roles = await db
		.select()
		.from(organizationRoles)
		.where(eq(organizationRoles.churchOrganizationId, params.organizationId));

	// Get user's role assignments for this organization
	const userToRoles = await db
		.select()
		.from(usersToOrganizationRoles)
		.where(
			eq(usersToOrganizationRoles.churchOrganizationId, params.organizationId),
		);

	return new Response(
		JSON.stringify({
			roles,
			userToRoles,
		}),
		{
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
}, true);
