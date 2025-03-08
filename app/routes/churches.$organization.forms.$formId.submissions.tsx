import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useState, useEffect } from "react";
import { createAuthLoader } from "~/server/auth/authLoader";
import { FormService } from "~/services/FormService";
import { db } from "@/server/db";
import { Button } from "~/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
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
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Badge } from "~/components/ui/badge";
import { ArrowLeft, Eye, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "~/hooks/use-toast";
import { eq } from "drizzle-orm";
import { churchOrganization } from "@/server/db/schema";
import { Switch } from "~/components/ui/switch";
import { Label } from "~/components/ui/label";

// Define types for the form submission data
interface FormSubmission {
	id: string;
	formConfigId: string;
	churchOrganizationId: string;
	submissionData: string;
	submitterEmail: string | null;
	submitterName: string | null;
	viewed: boolean;
	archived: boolean;
	notes: string | null;
	createdAt: string;
	updatedAt?: string;
	data: Record<string, unknown>; // Parsed submission data
}

// Define types for the form config
interface FormConfig {
	id: string;
	name: string;
	formFields: string;
	formType: string;
	churchOrganizationId: string;
	// Add other fields as needed
}

// Define types for the organization
interface Organization {
	id: string;
	name: string;
	slug: string;
	// Add other fields as needed
}

// Define the loader data type
interface LoaderData {
	formConfig: FormConfig;
	submissions: FormSubmission[];
	organization: Organization;
}

export const loader = createAuthLoader(
	async ({ params, request, userContext }) => {
		const { formId, organization } = params;

		if (!formId || !organization) {
			throw new Response("Not Found", { status: 404 });
		}

		// Get the form config to verify it belongs to the church
		const formConfig = await FormService.getFormConfigById(formId);

		if (!formConfig) {
			throw new Response("Form not found", { status: 404 });
		}

		// Verify the form belongs to the organization
		const org = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, organization))
			.then((res) => res[0]);

		// Get form submissions
		const submissions = await FormService.getFormSubmissions(db, formId);

		// Parse the submission data for each submission
		const parsedSubmissions = submissions.map((submission) => {
			try {
				// Check if submissionData is a string and not empty
				if (
					typeof submission.submissionData !== "string" ||
					submission.submissionData.trim() === ""
				) {
					console.warn(
						`Empty or invalid submission data for submission ID: ${submission.id}`,
					);
					return {
						...submission,
						data: {},
					};
				}

				const data = JSON.parse(submission.submissionData);
				return {
					...submission,
					data,
				};
			} catch (error) {
				console.error(
					`Error parsing submission data for submission ID: ${submission.id}`,
					error,
				);
				return {
					...submission,
					data: {},
				};
			}
		});

		return {
			formConfig,
			submissions: parsedSubmissions,
			organization: org,
		};
	},
);

export default function FormSubmissionsPage() {
	const { formConfig, submissions, organization } = useLoaderData<
		typeof loader
	>() as LoaderData;
	const navigate = useNavigate();
	const fetcher = useFetcher();
	const { toast } = useToast();

	const [selectedSubmission, setSelectedSubmission] =
		useState<FormSubmission | null>(null);
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);
	const [showArchived, setShowArchived] = useState(false);

	// Filter submissions based on archived status
	const filteredSubmissions = submissions.filter(
		(submission) => showArchived === submission.archived,
	);

	// Monitor fetcher state to handle responses
	useEffect(() => {
		if (fetcher.state === "idle" && fetcher.data) {
			// The fetcher has completed a submission
			const { success, error } = fetcher.data as {
				success: boolean;
				error?: string;
			};

			if (!success && error) {
				// Show error toast if the action failed
				toast({
					title: "Error",
					description: error,
					variant: "destructive",
				});
			}
		}
	}, [fetcher.state, fetcher.data, toast]);

	const handleViewSubmission = (submission: FormSubmission) => {
		setSelectedSubmission(submission);
		setViewDialogOpen(true);

		// If submission is not viewed, mark it as viewed
		if (!submission.viewed) {
			try {
				const formData = new FormData();
				formData.append("action", "markAsViewed");
				formData.append("submissionId", submission.id);

				// Use fetcher.submit to mark as viewed
				fetcher.submit(formData, {
					method: "post",
					action: `/churches/${organization.id}/forms/${formConfig.id}/submissions/action`,
				});

				// Update the submission in the UI immediately
				// This is a local UI update, the server-side update happens via the fetcher
				const submissionIndex = submissions.findIndex(
					(s) => s.id === submission.id,
				);
				if (submissionIndex !== -1) {
					submissions[submissionIndex].viewed = true;
				}

				// Also update the selected submission
				submission.viewed = true;

				// Show a toast to confirm
				toast({
					title: "Submission viewed",
					description: "The submission has been marked as viewed.",
				});
			} catch (error) {
				console.error("Error marking submission as viewed:", error);
				toast({
					title: "Error",
					description: "Failed to mark submission as viewed",
					variant: "destructive",
				});
			}
		}
	};

	const handleArchiveSubmission = () => {
		if (!selectedSubmission) return;

		try {
			const formData = new FormData();
			formData.append("action", "archive");
			formData.append("submissionId", selectedSubmission.id);
			formData.append("archived", "true"); // Explicitly set to archive

			// Close the dialog first
			setArchiveDialogOpen(false);

			// Show a loading toast
			const loadingToast = toast({
				title: "Archiving submission...",
				description: "Please wait while the submission is being archived.",
			});

			// Submit the form data
			fetcher.submit(formData, {
				method: "post",
				action: `/churches/${organization.id}/forms/${formConfig.id}/submissions/action`,
			});

			// Wait a moment to ensure the request has time to process
			setTimeout(() => {
				// Show success toast
				toast({
					title: "Submission archived",
					description: "The submission has been archived successfully.",
				});

				// Refresh the page to update the list
				navigate(".", { replace: true });
			}, 500);
		} catch (error) {
			console.error("Error archiving submission:", error);
			toast({
				title: "Error",
				description: "Failed to archive submission",
				variant: "destructive",
			});
		}
	};

	const handleDeleteSubmission = () => {
		if (!selectedSubmission) return;

		try {
			const formData = new FormData();
			formData.append("action", "delete");
			formData.append("submissionId", selectedSubmission.id);

			// Close the dialog first
			setDeleteDialogOpen(false);

			// Show a loading toast
			const loadingToast = toast({
				title: "Deleting submission...",
				description: "Please wait while the submission is being deleted.",
			});

			// Submit the form data
			fetcher.submit(formData, {
				method: "post",
				action: `/churches/${organization.id}/forms/${formConfig.id}/submissions/action`,
			});

			// Wait a moment to ensure the request has time to process
			setTimeout(() => {
				// Show success toast
				toast({
					title: "Submission deleted",
					description: "The submission has been deleted successfully.",
				});

				// Refresh the page to update the list
				navigate(".", { replace: true });
			}, 500);
		} catch (error) {
			console.error("Error deleting submission:", error);
			toast({
				title: "Error",
				description: "Failed to delete submission",
				variant: "destructive",
			});
		}
	};

	// Add a handler for unarchiving submissions
	const handleUnarchiveSubmission = (submission: FormSubmission) => {
		try {
			const formData = new FormData();
			formData.append("action", "archive");
			formData.append("submissionId", submission.id);
			formData.append("archived", "false"); // Add parameter to indicate unarchiving

			// Show a loading toast
			const loadingToast = toast({
				title: "Unarchiving submission...",
				description: "Please wait while the submission is being restored.",
			});

			// Submit the form data
			fetcher.submit(formData, {
				method: "post",
				action: `/churches/${organization.id}/forms/${formConfig.id}/submissions/action`,
			});

			// Wait a moment to ensure the request has time to process
			setTimeout(() => {
				// Show success toast
				toast({
					title: "Submission restored",
					description: "The submission has been unarchived successfully.",
				});

				// Refresh the page to update the list
				navigate(".", { replace: true });
			}, 500);
		} catch (error) {
			console.error("Error unarchiving submission:", error);
			toast({
				title: "Error",
				description: "Failed to unarchive submission",
				variant: "destructive",
			});
		}
	};

	return (
		<div className="container py-8">
			<div className="flex items-center justify-between mb-6">
				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={() => navigate(`/churches/${organization.id}/forms`)}
					>
						<ArrowLeft className="h-4 w-4 mr-2" />
						Back to Forms
					</Button>
					<h1 className="text-2xl font-bold">{formConfig.name} Submissions</h1>
				</div>
			</div>

			<Card>
				<CardHeader className="flex flex-row items-center justify-between">
					<div>
						<CardTitle>Form Submissions</CardTitle>
						<CardDescription>
							View and manage submissions for {formConfig.name}
						</CardDescription>
					</div>
					<div className="flex items-center space-x-2">
						<Switch
							id="show-archived"
							checked={showArchived}
							onCheckedChange={setShowArchived}
						/>
						<Label htmlFor="show-archived" className="flex items-center">
							{showArchived ? "Showing Archived" : "Showing Active"}
							{!showArchived &&
								submissions.filter((s) => s.archived).length > 0 && (
									<Badge variant="secondary" className="ml-2">
										{submissions.filter((s) => s.archived).length} archived
									</Badge>
								)}
							{showArchived &&
								submissions.filter((s) => !s.archived).length > 0 && (
									<Badge variant="secondary" className="ml-2">
										{submissions.filter((s) => !s.archived).length} active
									</Badge>
								)}
						</Label>
					</div>
				</CardHeader>
				<CardContent>
					{filteredSubmissions.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							{showArchived
								? "No archived submissions yet."
								: "No active submissions yet."}
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Submitter</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{filteredSubmissions.map((submission) => (
									<TableRow key={submission.id}>
										<TableCell>
											{formatDistanceToNow(new Date(submission.createdAt), {
												addSuffix: true,
											})}
										</TableCell>
										<TableCell>
											{submission.submitterName ||
												submission.submitterEmail ||
												"Anonymous"}
										</TableCell>
										<TableCell>
											{showArchived ? (
												<Badge variant="outline">Archived</Badge>
											) : submission.viewed ? (
												<Badge variant="outline">Viewed</Badge>
											) : (
												<Badge>New</Badge>
											)}
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end gap-2">
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleViewSubmission(submission)}
												>
													<Eye className="h-4 w-4" />
													<span className="sr-only">View</span>
												</Button>

												{showArchived ? (
													<Button
														variant="ghost"
														size="sm"
														onClick={() =>
															handleUnarchiveSubmission(submission)
														}
													>
														<ArchiveRestore className="h-4 w-4" />
														<span className="sr-only">Unarchive</span>
													</Button>
												) : (
													<Button
														variant="ghost"
														size="sm"
														onClick={() => {
															setSelectedSubmission(submission);
															setArchiveDialogOpen(true);
														}}
													>
														<Archive className="h-4 w-4" />
														<span className="sr-only">Archive</span>
													</Button>
												)}

												<Button
													variant="ghost"
													size="sm"
													onClick={() => {
														setSelectedSubmission(submission);
														setDeleteDialogOpen(true);
													}}
												>
													<Trash2 className="h-4 w-4" />
													<span className="sr-only">Delete</span>
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
				<DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Submission Details</DialogTitle>
						<DialogDescription>
							Submitted{" "}
							{selectedSubmission &&
								formatDistanceToNow(new Date(selectedSubmission.createdAt), {
									addSuffix: true,
								})}
						</DialogDescription>
					</DialogHeader>

					{selectedSubmission && (
						<div className="space-y-4">
							<div>
								<h3 className="font-medium">Submitter</h3>
								<p>
									{selectedSubmission.submitterName || "Not provided"}
									{selectedSubmission.submitterEmail &&
										` (${selectedSubmission.submitterEmail})`}
								</p>
							</div>

							<div>
								<h3 className="font-medium">Form Data</h3>
								<div className="border rounded-md p-4 mt-2 space-y-3">
									{selectedSubmission.data &&
									Object.keys(selectedSubmission.data).length > 0 ? (
										Object.entries(selectedSubmission.data).map(
											([key, value]) => (
												<div
													key={key}
													className="border-b pb-2 last:border-0 last:pb-0"
												>
													<span className="text-sm font-medium text-muted-foreground">
														{key}:
													</span>
													{typeof value === "object" ? (
														Array.isArray(value) ? (
															<p className="mt-1">{value.join(", ")}</p>
														) : (
															<pre className="mt-1 text-sm bg-muted p-2 rounded overflow-x-auto">
																{JSON.stringify(value, null, 2)}
															</pre>
														)
													) : (
														<p className="mt-1">{String(value)}</p>
													)}
												</div>
											),
										)
									) : (
										<p className="text-muted-foreground">
											No form data available
										</p>
									)}
								</div>
							</div>

							<div className="flex justify-end gap-2 pt-4">
								<Button
									variant="outline"
									onClick={() => setViewDialogOpen(false)}
								>
									Close
								</Button>
								<Button
									variant="outline"
									onClick={() => {
										setViewDialogOpen(false);
										setArchiveDialogOpen(true);
									}}
								>
									Archive
								</Button>
								<Button
									variant="destructive"
									onClick={() => {
										setViewDialogOpen(false);
										setDeleteDialogOpen(true);
									}}
								>
									Delete
								</Button>
							</div>
						</div>
					)}
				</DialogContent>
			</Dialog>

			<AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Archive Submission</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to archive this submission? Archived
							submissions will be moved to the archive section.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleArchiveSubmission}>
							Archive
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Submission</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete this submission? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDeleteSubmission}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
