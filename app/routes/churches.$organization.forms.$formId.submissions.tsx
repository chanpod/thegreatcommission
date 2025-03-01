import { useLoaderData, useNavigate, Link, useFetcher } from "react-router";
import { useState } from "react";
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
import { ArrowLeft, Eye, Archive, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "~/hooks/use-toast";
import { eq } from "drizzle-orm";
import { churchOrganization } from "@/server/db/schema";

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

		// if (!org || formConfig.churchId !== org.id) {
		// 	throw new Response("Not Found", { status: 404 });
		// }

		// Get form submissions
		const submissions = await FormService.getFormSubmissions(db, formId);

		return {
			formConfig,
			submissions,
			organization: org,
		};
	},
);

export default function FormSubmissionsPage() {
	const { formConfig, submissions, organization } =
		useLoaderData<typeof loader>();
	const navigate = useNavigate();
	const fetcher = useFetcher();
	const { toast } = useToast();

	const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
	const [viewDialogOpen, setViewDialogOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [archiveDialogOpen, setArchiveDialogOpen] = useState(false);

	const handleViewSubmission = (submission: any) => {
		setSelectedSubmission(submission);
		setViewDialogOpen(true);

		// If submission is not viewed, mark it as viewed
		if (!submission.viewed) {
			const formData = new FormData();
			formData.append("action", "markAsViewed");
			formData.append("submissionId", submission.id);

			fetcher.submit(formData, {
				method: "post",
				action: `/churches/${organization.slug}/forms/${formConfig.id}/submissions/action`,
			});
		}
	};

	const handleArchiveSubmission = () => {
		if (!selectedSubmission) return;

		const formData = new FormData();
		formData.append("action", "archive");
		formData.append("submissionId", selectedSubmission.id);

		fetcher.submit(formData, {
			method: "post",
			action: `/churches/${organization.slug}/forms/${formConfig.id}/submissions/action`,
		});

		setArchiveDialogOpen(false);
		toast({
			title: "Submission archived",
			description: "The submission has been archived successfully.",
		});

		// Refresh the page to update the list
		navigate(".", { replace: true });
	};

	const handleDeleteSubmission = () => {
		if (!selectedSubmission) return;

		const formData = new FormData();
		formData.append("action", "delete");
		formData.append("submissionId", selectedSubmission.id);

		fetcher.submit(formData, {
			method: "post",
			action: `/churches/${organization.slug}/forms/${formConfig.id}/submissions/action`,
		});

		setDeleteDialogOpen(false);
		toast({
			title: "Submission deleted",
			description: "The submission has been deleted successfully.",
		});

		// Refresh the page to update the list
		navigate(".", { replace: true });
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
				<CardHeader>
					<CardTitle>Form Submissions</CardTitle>
					<CardDescription>
						View and manage submissions for {formConfig.name}
					</CardDescription>
				</CardHeader>
				<CardContent>
					{submissions.length === 0 ? (
						<div className="text-center py-8 text-muted-foreground">
							No submissions yet.
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
								{submissions.map((submission) => (
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
											{submission.viewed ? (
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
				<DialogContent className="sm:max-w-[600px]">
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
									{Object.entries(selectedSubmission.data).map(
										([key, value]) => (
											<div key={key}>
												<span className="text-sm font-medium text-muted-foreground">
													{key}:
												</span>
												<p className="mt-1">{String(value)}</p>
											</div>
										),
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
