import { messageUsageReports } from "@/server/db/schema";
import { MessageTrackerService } from "@/server/services/MessageTrackerService";
import { format } from "date-fns";
import {
	BookmarkIcon,
	FileDownIcon,
	Mail,
	MessageSquare,
	PhoneCall,
} from "lucide-react";
import { useState } from "react";
import {
	type ActionFunctionArgs,
	data,
	Form,
	Link,
	Outlet,
	useLoaderData,
	useLocation,
} from "react-router";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { createAuthLoader } from "~/server/auth/authLoader";
import { verifyUserAccess } from "~/server/auth/verifyUserAccess";
import { getChurchOrganization } from "@/server/dataServices/churchOrganization";
import { db } from "@/server/db/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		// Verify the user has admin access to view message usage
		const organizationId = params.organization;
		const organization = await getChurchOrganization({ id: organizationId });

		if (!organization) {
			throw new Response("Organization not found", { status: 404 });
		}

		// Check if user has admin access to the organization
		const { isAdmin } = await verifyUserAccess({
			userId: userContext.user.id,
			churchOrganizationId: organizationId,
		});

		if (!isAdmin) {
			throw new Response("You don't have permission to access this page", {
				status: 403,
			});
		}

		// Get date range parameters for filtering
		const url = new URL(request.url);
		const period = url.searchParams.get("period") || "month";

		// Calculate start date based on period
		const endDate = new Date();
		const startDate = new Date();

		switch (period) {
			case "week":
				startDate.setDate(startDate.getDate() - 7);
				break;
			case "month":
				startDate.setDate(startDate.getDate() - 30);
				break;
			case "year":
				startDate.setFullYear(startDate.getFullYear() - 1);
				break;
			default:
				startDate.setDate(startDate.getDate() - 30); // Default to 30 days
		}

		// Get usage statistics
		const stats = await MessageTrackerService.getUsageStats(
			params.organization,
			startDate,
			endDate,
		);

		// Get recent messages history (first page)
		const history = await MessageTrackerService.getMessageHistory(
			params.organization,
			50, // Limit to 50 records
			0, // First page
		);

		return {
			stats,
			history,
			period,
			dateRange: {
				start: startDate.toISOString(),
				end: endDate.toISOString(),
			},
			organization,
		};
	},
);

export const action = async ({ request, params }: ActionFunctionArgs) => {
	const formData = await request.formData();
	const reportName = formData.get("reportName") as string;
	const startDate = formData.get("startDate") as string;
	const endDate = formData.get("endDate") as string;
	const period = formData.get("period") as string;
	const organizationId = params.organization as string;
	const emailCount = parseInt(formData.get("emailCount") as string, 10);
	const smsCount = parseInt(formData.get("smsCount") as string, 10);
	const phoneCount = parseInt(formData.get("phoneCount") as string, 10);
	const totalCost = parseFloat(formData.get("totalCost") as string);

	// Save the report to the database
	try {
		await db.insert(messageUsageReports).values({
			name: reportName,
			churchOrganizationId: organizationId,
			startDate: new Date(startDate),
			endDate: new Date(endDate),
			period,
			emailCount,
			smsCount,
			phoneCount,
			totalCost: Math.round(totalCost * 100), // Store in cents
		});

		return data({ success: true, message: "Report saved successfully" });
	} catch (error) {
		console.error("Error saving report:", error);
		return data(
			{ success: false, message: "Failed to save report" },
			{ status: 500 },
		);
	}
};

export default function MessageUsage() {
	const { stats, history, period, dateRange, organization } =
		useLoaderData<typeof loader>();
	const [activeTab, setActiveTab] = useState("overview");
	const [saveDialogOpen, setSaveDialogOpen] = useState(false);
	const location = useLocation();

	// Check if we're on the reports page
	const isReportsPage = location.pathname.endsWith("/reports");

	// Format statistics for display
	const emailStats = stats.messageTypes.find(
		(type) => type.messageType === "email",
	) || { count: 0, totalCost: 0 };
	const smsStats = stats.messageTypes.find(
		(type) => type.messageType === "sms",
	) || { count: 0, totalCost: 0 };
	const phoneStats = stats.messageTypes.find(
		(type) => type.messageType === "phone",
	) || { count: 0, totalCost: 0 };

	// Format date ranges for display
	const formattedStartDate = format(new Date(dateRange.start), "MMM d, yyyy");
	const formattedEndDate = format(new Date(dateRange.end), "MMM d, yyyy");

	// Handle CSV export of message history
	const exportToCsv = () => {
		// Format data
		const csvRows = [
			// Header row
			["Date", "Type", "Recipient", "Status", "Cost", "Message ID"].join(","),
			// Data rows
			...history.messages.map((msg) =>
				[
					format(new Date(msg.sentAt), "yyyy-MM-dd HH:mm:ss"),
					msg.messageType,
					msg.recipientEmail || msg.recipientPhone || msg.recipientId,
					msg.status,
					(msg.cost / 100).toFixed(2),
					msg.providerMessageId || "",
				].join(","),
			),
		];

		// Create blob and download
		const csvContent = csvRows.join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute(
			"download",
			`message-history-${format(new Date(), "yyyy-MM-dd")}.csv`,
		);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	return (
		<PageLayout title="Message Usage">
			<div className="space-y-4">
				{isReportsPage ? (
					<Outlet />
				) : (
					<>
						<div className="flex justify-between items-center">
							<div>
								<h2 className="text-2xl text-gray-700 font-bold tracking-tight">
									Usage Statistics
								</h2>
								<p className="text-gray-400">
									{formattedStartDate} - {formattedEndDate}
								</p>
							</div>

							<div className="flex items-center gap-2">
								<div className="flex items-center mr-4 bg-muted rounded-md p-1">
									<Link
										to={`/churches/${organization.id}/message-usage?period=week`}
										className={`px-3 py-1.5 text-sm font-medium rounded-sm ${
											period === "week" ? "bg-white shadow text-gray-700" : ""
										}`}
									>
										Week
									</Link>
									<Link
										to={`/churches/${organization.id}/message-usage?period=month`}
										className={`px-3 py-1.5 text-sm font-medium rounded-sm ${
											period === "month" ? "bg-white shadow text-gray-700" : ""
										}`}
									>
										Month
									</Link>
									<Link
										to={`/churches/${organization.id}/message-usage?period=year`}
										className={`px-3 py-1.5 text-sm font-medium rounded-sm ${
											period === "year" ? "bg-white shadow text-gray-700" : ""
										}`}
									>
										Year
									</Link>
								</div>

								<Button variant="outline" size="sm" asChild>
									<Link
										to={`/churches/${organization.id}/message-usage/reports`}
									>
										View Saved Reports
									</Link>
								</Button>

								<Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
									<DialogTrigger asChild>
										<Button variant="outline" size="sm">
											<BookmarkIcon className="mr-2 h-4 w-4" />
											Save Report
										</Button>
									</DialogTrigger>
									<DialogContent>
										<DialogHeader>
											<DialogTitle>Save Usage Report</DialogTitle>
											<DialogDescription className="text-gray-700">
												Save this report for future reference and billing
												purposes.
											</DialogDescription>
										</DialogHeader>

										<Form method="post">
											<div className="space-y-4 py-4">
												<div className="space-y-2">
													<Label htmlFor="reportName">Report Name</Label>
													<Input
														id="reportName"
														name="reportName"
														placeholder="Monthly Usage - June 2023"
														defaultValue={`${period.charAt(0).toUpperCase() + period.slice(1)}ly Usage - ${format(new Date(dateRange.end), "MMMM yyyy")}`}
														required
													/>
												</div>

												<input
													type="hidden"
													name="startDate"
													value={dateRange.start}
												/>
												<input
													type="hidden"
													name="endDate"
													value={dateRange.end}
												/>
												<input type="hidden" name="period" value={period} />
												<input
													type="hidden"
													name="emailCount"
													value={emailStats.count}
												/>
												<input
													type="hidden"
													name="smsCount"
													value={smsStats.count}
												/>
												<input
													type="hidden"
													name="phoneCount"
													value={phoneStats.count}
												/>
												<input
													type="hidden"
													name="totalCost"
													value={stats.totalCost.toFixed(2)}
												/>

												<div className="space-y-1">
													<p className="text-sm font-medium">Report Summary</p>
													<p className="text-sm text-gray-700">
														Period: {formattedStartDate} - {formattedEndDate}
													</p>
													<p className="text-sm text-gray-700">
														Total Messages: {stats.totalMessages}
													</p>
													<p className="text-sm text-gray-700">
														Total Cost: ${stats.totalCost.toFixed(2)}
													</p>
												</div>
											</div>

											<DialogFooter>
												<Button
													type="button"
													variant="outline"
													onClick={() => setSaveDialogOpen(false)}
												>
													Cancel
												</Button>
												<Button type="submit">Save Report</Button>
											</DialogFooter>
										</Form>
									</DialogContent>
								</Dialog>

								<Button
									className="text-gray-700 hover:text-gray-200"
									variant="outline"
									size="sm"
									onClick={exportToCsv}
								>
									<FileDownIcon className="mr-2 h-4 w-4" />
									Export CSV
								</Button>
							</div>
						</div>

						<div className="grid gap-4 md:grid-cols-3 dark">
							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Email Messages
									</CardTitle>
									<Mail className="h-4 w-4 text-gray-600" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{emailStats.count}</div>
									<p className="text-xs text-gray-400">
										${(emailStats.totalCost / 100).toFixed(2)} total cost
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										SMS Messages
									</CardTitle>
									<MessageSquare className="h-4 w-4 text-gray-600" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{smsStats.count}</div>
									<p className="text-xs text-gray-400">
										${(smsStats.totalCost / 100).toFixed(2)} total cost
									</p>
								</CardContent>
							</Card>

							<Card>
								<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
									<CardTitle className="text-sm font-medium">
										Phone Calls
									</CardTitle>
									<PhoneCall className="h-4 w-4 text-gray-600" />
								</CardHeader>
								<CardContent>
									<div className="text-2xl font-bold">{phoneStats.count}</div>
									<p className="text-xs text-gray-400">
										${(phoneStats.totalCost / 100).toFixed(2)} total cost
									</p>
								</CardContent>
							</Card>

							<Card className="md:col-span-3">
								<CardHeader>
									<CardTitle>Total Usage</CardTitle>
									<CardDescription className="text-gray-400">
										Total messages sent and costs for all channels
									</CardDescription>
								</CardHeader>
								<CardContent>
									<div className="grid grid-cols-2 gap-4">
										<div>
											<p className="text-sm font-medium">Total Messages</p>
											<p className="text-2xl font-bold">
												{stats.totalMessages}
											</p>
										</div>
										<div>
											<p className="text-sm font-medium">Total Cost</p>
											<p className="text-2xl font-bold">
												${stats.totalCost.toFixed(2)}
											</p>
										</div>
									</div>
								</CardContent>
							</Card>
						</div>

						<Tabs
							value={activeTab}
							onValueChange={setActiveTab}
							className="mt-8"
						>
							<TabsList className="text-gray-900">
								<TabsTrigger value="overview" className="text-gray-900">
									Overview
								</TabsTrigger>
								<TabsTrigger value="details" className="text-gray-900">
									Message Details
								</TabsTrigger>
							</TabsList>

							<TabsContent
								value="overview"
								className="space-y-4 dark rounded-lg"
							>
								<Card>
									<CardHeader>
										<CardTitle>Usage by Message Type</CardTitle>
										<CardDescription className="text-gray-400">
											Breakdown of message usage by type
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Message Type</TableHead>
													<TableHead>Count</TableHead>
													<TableHead>Cost per Message</TableHead>
													<TableHead>Total Cost</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												<TableRow>
													<TableCell className="font-medium">Email</TableCell>
													<TableCell>{emailStats.count}</TableCell>
													<TableCell>$0.005</TableCell>
													<TableCell>
														${(emailStats.totalCost / 100).toFixed(2)}
													</TableCell>
												</TableRow>
												<TableRow>
													<TableCell className="font-medium">SMS</TableCell>
													<TableCell>{smsStats.count}</TableCell>
													<TableCell>$0.01 per segment</TableCell>
													<TableCell>
														${(smsStats.totalCost / 100).toFixed(2)}
													</TableCell>
												</TableRow>
												<TableRow>
													<TableCell className="font-medium">Phone</TableCell>
													<TableCell>{phoneStats.count}</TableCell>
													<TableCell>$0.10 per minute</TableCell>
													<TableCell>
														${(phoneStats.totalCost / 100).toFixed(2)}
													</TableCell>
												</TableRow>
												<TableRow className="font-bold">
													<TableCell>Total</TableCell>
													<TableCell>{stats.totalMessages}</TableCell>
													<TableCell>-</TableCell>
													<TableCell>${stats.totalCost.toFixed(2)}</TableCell>
												</TableRow>
											</TableBody>
										</Table>
									</CardContent>
								</Card>
							</TabsContent>

							<TabsContent value="details">
								<Card>
									<CardHeader>
										<CardTitle>Recent Messages</CardTitle>
										<CardDescription className="text-gray-700">
											Most recent {history.messages.length} messages sent
										</CardDescription>
									</CardHeader>
									<CardContent>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Date</TableHead>
													<TableHead>Type</TableHead>
													<TableHead>Recipient</TableHead>
													<TableHead>Status</TableHead>
													<TableHead>Cost</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{history.messages.map((msg) => (
													<TableRow key={msg.id}>
														<TableCell>
															{format(new Date(msg.sentAt), "MMM d, h:mm a")}
														</TableCell>
														<TableCell>
															{msg.messageType.charAt(0).toUpperCase() +
																msg.messageType.slice(1)}
														</TableCell>
														<TableCell>
															{msg.recipientEmail ||
																msg.recipientPhone ||
																msg.recipientId}
														</TableCell>
														<TableCell>
															<span
																className={`px-2 py-1 rounded-full text-xs ${
																	msg.status === "sent" ||
																	msg.status === "delivered"
																		? "bg-green-100 text-green-800"
																		: "bg-red-100 text-red-800"
																}`}
															>
																{msg.status}
															</span>
														</TableCell>
														<TableCell>
															${(msg.cost / 100).toFixed(2)}
														</TableCell>
													</TableRow>
												))}

												{history.messages.length === 0 && (
													<TableRow>
														<TableCell colSpan={5} className="text-center py-4">
															No messages found in this time period
														</TableCell>
													</TableRow>
												)}
											</TableBody>
										</Table>

										{history.totalCount > history.messages.length && (
											<div className="flex justify-center mt-4">
												<p className="text-sm text-gray-700">
													Showing {history.messages.length} of{" "}
													{history.totalCount} messages
												</p>
											</div>
										)}
									</CardContent>
								</Card>
							</TabsContent>
						</Tabs>
					</>
				)}
			</div>
		</PageLayout>
	);
}
