import { PermissionsService } from "@/server/services/PermissionsService";
import { and, eq, gte } from "drizzle-orm";
import { Settings, Video } from "lucide-react";
import { Link, useLoaderData } from "react-router";
import {
	churchOrganization,
	events,
	landingPageConfig,
} from "server/db/schema";
import { Button } from "~/components/ui/button";
import { createAuthLoader } from "~/server/auth/authLoader";
import { db } from "~/server/dbConnection";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
import { LiveStreamService } from "~/services/LiveStreamService";

export const loader = createAuthLoader(
	async ({ params, request, userContext }) => {
		const user = userContext?.user;

		const permissionsService = new PermissionsService();
		const permissions = await permissionsService.getOrganizationPermissions(
			user.id,
			params.organization,
		);

		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, params.organization))
			.then((res) => res[0]);

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
			permissions,
			isLive,
		};
	},
	true,
);

export default function Landing() {
	const {
		organization,
		config,
		serviceTimes,
		upcomingEvents,
		permissions,
		isLive,
	} = useLoaderData<typeof loader>();

	return (
		<div className="relative">
			{permissions.canEdit && (
				<div className="absolute top-0 right-4">
					<Link to="config">
						<Button variant="ghost" size="icon">
							<Settings className="h-4 w-4" />
							<span className="sr-only">Edit Landing Page</span>
						</Button>
					</Link>
				</div>
			)}

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
