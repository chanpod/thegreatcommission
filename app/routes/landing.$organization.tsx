import { useLoaderData } from "react-router";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
import { db } from "~/server/dbConnection";
import {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import type { Route } from "./+types";

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
				eq(events.type, "local"),
				gte(events.startDate, now),
			),
		)
		.limit(3);

	return {
		organization,
		config,
		serviceTimes,
		upcomingEvents,
	};
};

export default function PublicLanding() {
	const { organization, config, serviceTimes, upcomingEvents } =
		useLoaderData<typeof loader>();

	return (
		<div className="min-h-screen">
			<LandingPage
				organization={organization}
				config={config}
				serviceTimes={serviceTimes}
				upcomingEvents={upcomingEvents}
			/>
		</div>
	);
}
