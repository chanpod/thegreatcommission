import { Copy, Eye, Globe, Video } from "lucide-react";
import { Link, redirect, useLoaderData } from "react-router";
import { churchOrganization } from "server/db/schema";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { createAuthLoader } from "~/server/auth/authLoader";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";

export const loader = createAuthLoader(
	async ({ params, request, userContext }) => {
		throw redirect("config");
	},
	true,
);

export function LandingToolbar({
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
						<Link to={`/churches/${organization.id}/forms`}>
							<Button variant="secondary" size="sm">
								<Copy className="h-4 w-4 mr-2" />
								Manage Forms
							</Button>
						</Link>

						<Button variant="secondary" size="sm" onClick={copyUrl}>
							<Copy className="h-4 w-4 mr-2" />
							Copy URL
						</Button>

						<Link
							to={`/landing/${organization.id}`}
							target="_blank"
							rel="noopener noreferrer"
						>
							<Button variant="secondary" size="sm" asChild>
								<Eye className="h-4 w-4 mr-2" />
								Preview
							</Button>
						</Link>
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
