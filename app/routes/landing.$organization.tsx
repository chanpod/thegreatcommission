import { useLoaderData } from "react-router";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
import { db } from "@/server/db/dbConnection";
import {
	churchOrganization,
	events,
	landingPageConfig,
	organizationRoles,
	usersToOrganizationRoles,
	users,
} from "server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import type { Route } from "./+types";
import { LiveStreamService } from "~/services/LiveStreamService";

import { AuthorizationService } from "~/services/AuthorizationService";
import { createAuthLoader } from "~/server/auth/authLoader";

export const loader = createAuthLoader(async ({ params, userContext }) => {
	const userId = userContext?.user?.id;

	// Default permission to false
	let canViewForms = false;

	const organization = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.then((res) => res[0]);

	if (!organization) {
		throw new Error("Organization not found");
	}

	// Check permissions if user is logged in
	if (userId) {
		// Get user's organization roles
		const userOrgRoles = await db
			.select()
			.from(usersToOrganizationRoles)
			.where(
				and(
					eq(usersToOrganizationRoles.userId, userId),
					eq(
						usersToOrganizationRoles.churchOrganizationId,
						params.organization,
					),
				),
			);

		// Get all organization roles
		const orgRoles = await db
			.select()
			.from(organizationRoles)
			.where(eq(organizationRoles.churchOrganizationId, params.organization));

		// Get the user from the database
		const user = await db
			.select()
			.from(users)
			.where(eq(users.id, userId))
			.then((res) => res[0]);

		if (user) {
			// Create authorization service
			const authService = new AuthorizationService(
				user,
				[], // siteRoles - not needed for this check
				[], // userToSiteRoles - not needed for this check
				orgRoles,
				userOrgRoles,
			);

			// Check if user is an admin or has organization.view permission
			canViewForms =
				authService.isAdmin(params.organization) ||
				authService.hasPermission("organization.view", params.organization);
		}
	}

	const config = await db
		.select()
		.from(landingPageConfig)
		.where(eq(landingPageConfig.churchOrganizationId, params.organization))
		.then((res) => res[0]);

	// Get recurring service times
	const serviceTimes = await db
		.select()
		.from(events)
		.where(
			and(
				eq(events.churchOrganizationId, params.organization),
				eq(events.type, "recurring"),
			),
		);

	const now = new Date();
	// Get upcoming local events (non-recurring, non-mission)
	const upcomingEvents = await db
		.select()
		.from(events)
		.where(
			and(
				eq(events.churchOrganizationId, params.organization),
				gte(events.startDate, now),
				// Exclude recurring service events
				eq(events.type, "local"),
			),
		)
		.orderBy(events.startDate)
		.limit(4);

	let isLive = false;
	if (organization.liveStreamUrl) {
		console.log("organization.liveStreamUrl", organization.liveStreamUrl);
		const liveStreamService = new LiveStreamService(
			process.env.YOUTUBE_API_KEY,
		);
		isLive = await liveStreamService.isStreamLive(organization.liveStreamUrl);
	}

	return {
		organization,
		config,
		serviceTimes,
		upcomingEvents,
		isLive,
		canViewForms,
	};
});

export default function PublicLanding() {
	const {
		organization,
		config,
		serviceTimes,
		upcomingEvents,
		isLive,
		canViewForms,
	} = useLoaderData<typeof loader>();

	return (
		<LandingPage
			organization={organization}
			config={config}
			serviceTimes={serviceTimes}
			upcomingEvents={upcomingEvents}
			isLive={isLive}
			canViewForms={canViewForms}
		/>
	);
}
