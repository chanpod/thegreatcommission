import { Outlet, useLoaderData } from "react-router";
import { db } from "@/server/db/dbConnection";
import {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import type { Route } from "./+types";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
import { LiveStreamService } from "~/services/LiveStreamService";

export const loader = async ({ request, context }: Route.LoaderArgs) => {
	// Check if we already have custom domain info from the Express middleware
	if (context?.customDomain && context?.organization) {
		const org = context.organization;

		// Get landing page config for this organization
		const config = await db
			.select()
			.from(landingPageConfig)
			.where(eq(landingPageConfig.churchOrganizationId, org.id))
			.then((res) => res[0] || null);

		// Get recurring service times
		const serviceTimes = await db
			.select()
			.from(events)
			.where(
				and(
					eq(events.churchOrganizationId, org.id),
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
					eq(events.churchOrganizationId, org.id),
					gte(events.startDate, now),
					// Exclude recurring service events
					eq(events.type, "local"),
				),
			)
			.orderBy(events.startDate)
			.limit(4);

		let isLive = false;
		if (org.liveStreamUrl) {
			const liveStreamService = new LiveStreamService(
				process.env.YOUTUBE_API_KEY,
			);
			isLive = await liveStreamService.isStreamLive(org.liveStreamUrl);
		}

		return {
			customDomain: true,
			organization: org,
			config,
			serviceTimes,
			upcomingEvents,
			isLive,
		};
	}

	// Get the hostname from the request for fallback
	const url = new URL(request.url);
	const hostname = url.hostname;

	// Skip custom domain check for localhost or vercel preview URLs
	if (
		hostname === "localhost" ||
		hostname.includes("vercel.app") ||
		hostname.includes("127.0.0.1") ||
		hostname === "thegreatcommission.org"
	) {
		return { customDomain: false };
	}

	// Fallback check if this is a custom domain (should rarely be needed with Express middleware)
	const org = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.customDomain, hostname))
		.then((res) => res[0] || null);

	// If no organization found with this domain, continue with normal routing
	if (!org) {
		return { customDomain: false };
	}

	// Get landing page config for this organization
	const config = await db
		.select()
		.from(landingPageConfig)
		.where(eq(landingPageConfig.churchOrganizationId, org.id))
		.then((res) => res[0] || null);

	// Get recurring service times
	const serviceTimes = await db
		.select()
		.from(events)
		.where(
			and(
				eq(events.churchOrganizationId, org.id),
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
				eq(events.churchOrganizationId, org.id),
				gte(events.startDate, now),
				// Exclude recurring service events
				eq(events.type, "local"),
			),
		)
		.orderBy(events.startDate)
		.limit(4);

	let isLive = false;
	if (org.liveStreamUrl) {
		const liveStreamService = new LiveStreamService(
			process.env.YOUTUBE_API_KEY,
		);
		isLive = await liveStreamService.isStreamLive(org.liveStreamUrl);
	}

	return {
		customDomain: true,
		organization: org,
		config,
		serviceTimes,
		upcomingEvents,
		isLive,
	};
};

export default function Layout() {
	const {
		customDomain,
		organization,
		config,
		serviceTimes,
		upcomingEvents,
		isLive,
	} = useLoaderData<typeof loader>();

	// If this is a custom domain request, render the church's landing page
	if (customDomain && organization) {
		return (
			<div className="min-h-screen">
				<LandingPage
					organization={organization}
					config={config}
					serviceTimes={serviceTimes}
					upcomingEvents={upcomingEvents}
					isLive={isLive}
				/>
			</div>
		);
	}

	// Otherwise, render the normal app
	return <Outlet />;
}
