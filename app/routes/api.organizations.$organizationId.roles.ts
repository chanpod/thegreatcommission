import { eq } from "drizzle-orm";
import { organizationRoles, usersToOrganizationRoles } from "server/db/schema";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import type { Route } from "../+types/root";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		return new Response(JSON.stringify({ message: "Unauthorized" }), {
			status: 401,
		});
	}

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
};
