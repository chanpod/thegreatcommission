import { createAuthLoader } from "~/server/auth/authLoader";
import { OrganizationDataService } from "@/server/dataServices/OrganizationDataService";
import { db } from "@/server/db/dbConnection";
import { teams, usersToTeams } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const loader = createAuthLoader(async ({ request, params }) => {
	const organizationDataService = new OrganizationDataService();
	const members = await organizationDataService.getOrganizationMembers(
		params.organization,
	);

	// Get teams for the organization
	const orgTeams = await db
		.select()
		.from(teams)
		.where(eq(teams.churchOrganizationId, params.organization));

	// Transform and filter the user data
	const users = members.map((member) => ({
		id: member.user.id,
		firstName: member.user.firstName,
		lastName: member.user.lastName,
		email: member.user.email,
		phone: member.user.phone,
		preferences: member.preferences,
	}));

	return { users, teams: orgTeams };
}, true);
