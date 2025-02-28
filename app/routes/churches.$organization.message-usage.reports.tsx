import { createAuthLoader } from "~/server/auth/authLoader";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { data, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { format } from "date-fns";
import { verifyUserAccess } from "~/server/auth/verifyUserAccess";
import { getChurchOrganization } from "~/server/data/churchOrganization";
import { type ActionFunctionArgs } from "react-router";
import { db } from "~/server/dbConnection";
import { messageUsageReports } from "@/server/db/schema";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { ChevronLeft, FileDownIcon, Trash2 } from "lucide-react";
import { Link } from "react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { desc, eq } from "drizzle-orm";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		// Verify the user has admin access to view message usage reports
		const organizationId = params.organization;
		const organization = await getChurchOrganization({ id: organizationId });

		if (!organization) {
			throw new Response("Organization not found", { status: 404 });
		}

		// Check if user has admin access to the organization
		const { isAdmin } = await verifyUserAccess({
			userId: userContext.userId,
			churchOrganizationId: organizationId,
		});

		// if (!isAdmin) {
		// 	throw new Response("You don't have permission to access this page", {
		// 		status: 403,
		// 	});
		// }

		// Get all saved reports for this organization
		const reports = await db
			.select()
			.from(messageUsageReports)
			.where(eq(messageUsageReports.churchOrganizationId, organizationId))
			.orderBy((messageUsageReports) => [desc(messageUsageReports.createdAt)]);

		return {
			reports,
			organization,
		};
	},
);

export async function action({ request, params }: ActionFunctionArgs) {
	const formData = await request.formData();
	const reportId = formData.get("reportId") as string;

	if (!reportId) {
		return data(
			{ success: false, message: "Report ID is required" },
			{ status: 400 },
		);
	}

	try {
		await db
			.delete(messageUsageReports)
			.where(eq(messageUsageReports.id, reportId));

		return data({ success: true, message: "Report deleted successfully" });
	} catch (error) {
		console.error("Error deleting report:", error);
		return data(
			{ success: false, message: "Failed to delete report" },
			{ status: 500 },
		);
	}
}

export default function SavedReports() {
	const { reports, organization } = useLoaderData<typeof loader>();

	// Function to generate a CSV for a specific report
	const exportReportToCsv = (report: any) => {
		// Format data
		const csvRows = [
			// Header row
			[
				"Report Name",
				"Period",
				"Start Date",
				"End Date",
				"Email Count",
				"SMS Count",
				"Phone Count",
				"Total Cost",
			].join(","),
			// Data row
			[
				report.name,
				report.period,
				format(new Date(report.startDate), "yyyy-MM-dd"),
				format(new Date(report.endDate), "yyyy-MM-dd"),
				report.emailCount,
				report.smsCount,
				report.phoneCount,
				(report.totalCost / 100).toFixed(2),
			].join(","),
		];

		// Create blob and download
		const csvContent = csvRows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `${report.name.replace(/\s+/g, "-")}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<PageLayout title="Saved Message Usage Reports">
			<div className="space-y-4">
				<div className="flex justify-between items-center">
					<div>
						<h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
							<Link
								to={`/churches/${organization.id}/message-usage`}
								className="hover:text-primary/80"
							>
								<ChevronLeft size={20} />
							</Link>
							Saved Usage Reports
						</h2>
						<p className="text-gray-700">
							View and manage your saved message usage reports
						</p>
					</div>
				</div>

				{reports.length === 0 ? (
					<Card>
						<CardHeader>
							<CardTitle>No Saved Reports</CardTitle>
							<CardDescription className="text-gray-700">
								You haven't saved any usage reports yet. Go to the Message Usage
								dashboard to create reports.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<Button asChild>
								<Link to={`/churches/${organization.id}/message-usage`}>
									Go to Message Usage
								</Link>
							</Button>
						</CardContent>
					</Card>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Report Name</TableHead>
								<TableHead>Period</TableHead>
								<TableHead>Date Range</TableHead>
								<TableHead>Total Messages</TableHead>
								<TableHead>Total Cost</TableHead>
								<TableHead>Created On</TableHead>
								<TableHead className="text-right">Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{reports.map((report) => {
								const totalMessages =
									report.emailCount + report.smsCount + report.phoneCount;
								const formattedStartDate = format(
									new Date(report.startDate),
									"MMM d, yyyy",
								);
								const formattedEndDate = format(
									new Date(report.endDate),
									"MMM d, yyyy",
								);

								return (
									<TableRow key={report.id}>
										<TableCell className="font-medium">{report.name}</TableCell>
										<TableCell className="capitalize">
											{report.period}
										</TableCell>
										<TableCell>
											{formattedStartDate} - {formattedEndDate}
										</TableCell>
										<TableCell>{totalMessages}</TableCell>
										<TableCell>
											${(report.totalCost / 100).toFixed(2)}
										</TableCell>
										<TableCell>
											{format(new Date(report.createdAt), "MMM d, yyyy")}
										</TableCell>
										<TableCell className="text-right space-x-2">
											<Button
												variant="outline"
												size="sm"
												onClick={() => exportReportToCsv(report)}
											>
												<FileDownIcon className="h-4 w-4" />
												<span className="sr-only">Export</span>
											</Button>

											<form method="post" className="inline-block">
												<input
													type="hidden"
													name="reportId"
													value={report.id}
												/>
												<Button
													variant="outline"
													size="sm"
													type="submit"
													className="text-destructive hover:bg-destructive/10"
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete</span>
												</Button>
											</form>
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				)}
			</div>
		</PageLayout>
	);
}
