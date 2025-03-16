import { createAuthLoader } from "~/server/auth/authLoader";
import { OrganizationDataService } from "@/server/dataServices/OrganizationDataService";
import { db } from "@/server/db/dbConnection";
import { teams, events, usersToTeams } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { Outlet, redirect, useLoaderData } from "react-router";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { OrgDescription } from "~/src/components/organizations/OrgDescription";
import { childCheckinService } from "~/services/ChildCheckinService";

export const loader = createAuthLoader(async ({ params, userContext }) => {
	const user = userContext?.user;

	if (user === undefined || user === null) {
		throw redirect(`/landing/${params.organization}`);
	}
	const organizationDataService = new OrganizationDataService();
	const organization = await organizationDataService.getOrganization(
		params.organization,
	);
	const members = await organizationDataService.getOrganizationMembers(
		params.organization,
	);

	// Get teams count
	const orgTeams = await db
		.select()
		.from(teams)
		.where(eq(teams.churchOrganizationId, params.organization));

	// Get active events count
	const activeEvents = await db
		.select()
		.from(events)
		.where(eq(events.churchOrganizationId, params.organization));

	// Get team membership distribution for this organization's teams
	const teamMemberships = await db
		.select()
		.from(usersToTeams)
		.innerJoin(teams, eq(teams.id, usersToTeams.teamId))
		.where(eq(teams.churchOrganizationId, params.organization));

	// Get total active check-ins for this organization
	const checkedInChildren =
		await childCheckinService.getTotalActiveCheckinsForOrganization(
			params.organization,
		);

	// Get total unique children checked in this week
	const weeklyChildrenCount = await childCheckinService.getWeeklyChildrenCount(
		params.organization,
	);

	const analytics = {
		totalMembers: members.length,
		totalTeams: orgTeams.length,
		activeEvents: activeEvents.length,
		averageTeamSize: teamMemberships.length / orgTeams.length || 0,
		membersInTeams: new Set(
			teamMemberships.map((tm) => tm.users_to_teams.userId),
		).size,
		checkedInChildren,
		weeklyChildrenCount,
	};

	return {
		organization,
		analytics,
	};
});

export default function OrganizationDetails() {
	const { organization, analytics } = useLoaderData<typeof loader>();

	return (
		<PageLayout title="Organization Overview">
			<OrgDescription org={organization} analytics={analytics} />
			<Outlet />
		</PageLayout>
	);
}
