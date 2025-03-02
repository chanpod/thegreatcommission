import { format } from "date-fns";
import {
	Activity,
	ArrowRight as ArrowTopRightOnSquareIcon,
	Calendar,
	Group,
	UserCheck,
	UserPlus,
	Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { churchOrganization } from "server/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { DataDisplay } from "../dataDisplay/data";
import { convertAddressToLocation } from "../forms/createChurch/CreateChurchForm";
import OrgLocation from "./OrgLocation";

export const OrgDescription = ({
	org,
	analytics,
}: { org: typeof churchOrganization; analytics: any }) => {
	const [location, setLocation] = useState<typeof location | undefined>(
		undefined,
	);
	useEffect(() => {
		convertAddress();
	}, []);

	async function convertAddress() {
		const location = await convertAddressToLocation(
			`${org?.street} ${org?.city}, ${org?.state} ${org?.zip}`,
		);
		setLocation(location);
	}

	const stats = [
		{
			title: "Total Members",
			value: analytics.totalMembers,
			icon: Users,
			description: "Total number of registered members",
		},
		{
			title: "Recently Active",
			value: analytics.recentlyActive,
			icon: Activity,
			description: "Members active in the last 30 days",
		},
		{
			title: "Active Teams",
			value: analytics.totalTeams,
			icon: Group,
			description: `Average team size: ${analytics.averageTeamSize.toFixed(1)} members`,
		},
		{
			title: "Team Participation",
			value: `${((analytics.membersInTeams / analytics.totalMembers) * 100).toFixed(0)}%`,
			icon: UserCheck,
			description: `${analytics.membersInTeams} members in teams`,
		},
		{
			title: "Active Events",
			value: analytics.activeEvents,
			icon: Calendar,
			description: "Currently scheduled events",
		},
		{
			title: "Growth Rate",
			value: "+12%",
			icon: UserPlus,
			description: "Member growth in last 3 months",
		},
	];

	return (
		<div className="space-y-6">
			{/* Organization Overview */}
			<div>
				<div className="text-sm text-muted-foreground mt-4">
					<p>Created on {format(new Date(org.createdAt), "MMMM d, yyyy")}</p>
					<p>Last updated {format(new Date(org.updatedAt), "MMMM d, yyyy")}</p>
				</div>
			</div>

			{/* Stats Grid */}
			<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 dark">
				{stats.map((stat) => (
					<Card key={stat.title}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<CardTitle className="text-sm font-medium">
								{stat.title}
							</CardTitle>
							<stat.icon className="h-4 w-4 text-muted-foreground" />
						</CardHeader>
						<CardContent>
							<div className="text-2xl font-bold">{stat.value}</div>
							<p className="text-xs text-muted-foreground">
								{stat.description}
							</p>
						</CardContent>
					</Card>
				))}
			</div>

			<hr className="border-gray-200" />
			<section className="flex flex-col space-y-3 mt-4">
				<DataDisplay label="Location">
					<OrgLocation org={org} />
				</DataDisplay>
				<DataDisplay label="Website">
					{org.mainChurchWebsite && (
						<a
							href={org.mainChurchWebsite}
							className="text-blue-600 hover:text-blue-800"
						>
							<div className="flex space-x-3 items-center">
								{org.mainChurchWebsite}
								<ArrowTopRightOnSquareIcon className="w-4 h-4" />
							</div>
						</a>
					)}
				</DataDisplay>
			</section>
		</div>
	);
};

export default OrgDescription;
