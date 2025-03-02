import { useLoaderData } from "react-router";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
import { db } from "@/server/db/dbConnection";
import {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import type { Route } from "./+types";
import { LiveStreamService } from "~/services/LiveStreamService";

export const loader = async ({ params }: Route.LoaderArgs) => {
	const organization = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.then((res) => res[0]);

	if (!organization) {
		throw new Error("Organization not found");
	}

	const config = await db
		.select()
		.from(landingPageConfig)
		.where(eq(landingPageConfig.churchOrganizationId, params.organization))
		.then((res) => res[0]);

	// Debug logging to check what config data is being loaded
	console.log(
		"Landing page loader - organization:",
		organization.id,
		organization.name,
	);
	console.log("Landing page loader - config found:", !!config);

	if (config) {
		// Log specific fields that might be causing issues
		console.log("Landing page loader - config details:", {
			aboutSection: config.aboutSection
				? config.aboutSection.substring(0, 100) + "..."
				: null,
			aboutButtons: config.aboutButtons
				? config.aboutButtons.substring(0, 100) + "..."
				: null,
			customSections: config.customSections
				? config.customSections.substring(0, 100) + "..."
				: null,
			socialLinks: config.socialLinks
				? config.socialLinks.substring(0, 100) + "..."
				: null,
		});
	}

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
	};
};

export default function PublicLanding() {
	const { organization, config, serviceTimes, upcomingEvents, isLive } =
		useLoaderData<typeof loader>();

	return (
		<LandingPage
			organization={organization}
			config={config}
			serviceTimes={serviceTimes}
			upcomingEvents={upcomingEvents}
			isLive={isLive}
		/>
	);
}
