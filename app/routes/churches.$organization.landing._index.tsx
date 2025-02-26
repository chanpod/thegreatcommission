import { PermissionsService } from "@/server/services/PermissionsService";
import { and, eq, gte } from "drizzle-orm";
import {
	Settings,
	Video,
	Eye,
	Share2,
	Copy,
	ArrowLeft,
	Globe,
} from "lucide-react";
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
import { toast } from "sonner";

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
			permissions,
			isLive,
		};
	},
	true,
);

function LandingToolbar({
	organization,
	permissions,
	isLive,
}: {
	organization: typeof churchOrganization.$inferSelect;
	permissions: PermissionSet;
	isLive: boolean;
}) {
	const copyUrl = () => {
		const url = `${window.location.origin}/landing/${organization.id}`;
		navigator.clipboard.writeText(url);
		toast.success("URL copied to clipboard");
	};

	return (
		<div className="bg-background border-b">
			<div className="container mx-auto px-4 py-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<Button variant="secondary" size="sm" asChild>
							<Link to={`/churches/${organization.id}`}>
								<ArrowLeft className="h-4 w-4 mr-2" />
								Back to Dashboard
							</Link>
						</Button>
					</div>

					<div className="flex items-center gap-2">
						{organization.mainChurchWebsite && (
							<Button variant="secondary" size="sm" asChild>
								<a
									href={organization.mainChurchWebsite}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Globe className="h-4 w-4 mr-2" />
									Main Website
								</a>
							</Button>
						)}

						{organization.liveStreamUrl && (
							<Button
								variant={isLive ? "destructive" : "secondary"}
								size="sm"
								asChild
							>
								<a
									href={organization.liveStreamUrl}
									target="_blank"
									rel="noopener noreferrer"
								>
									<Video className="h-4 w-4 mr-2" />
									{isLive ? "Watch Live" : "Live Stream"}
								</a>
							</Button>
						)}

						<Button variant="secondary" size="sm" onClick={copyUrl}>
							<Copy className="h-4 w-4 mr-2" />
							Copy URL
						</Button>

						<Button variant="secondary" size="sm" asChild>
							<a
								href={`/landing/${organization.id}`}
								target="_blank"
								rel="noopener noreferrer"
							>
								<Eye className="h-4 w-4 mr-2" />
								Preview
							</a>
						</Button>

						{permissions.canEdit && (
							<Button variant="secondary" size="sm" asChild>
								<Link to="config">
									<Settings className="h-4 w-4 mr-2" />
									Configure
								</Link>
							</Button>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}

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
		<div className="min-h-screen flex flex-col">
			<LandingToolbar
				organization={organization}
				permissions={permissions}
				isLive={isLive}
			/>
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
