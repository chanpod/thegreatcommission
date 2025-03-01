import { db } from "@/server/db/dbConnection";
import { eq } from "drizzle-orm";
import {
	Edit,
	FileText,
	MessageSquare,
	Plus,
	PlusCircle,
	Trash2,
} from "lucide-react";
import { useState } from "react";
import {
	Link,
	Outlet,
	useLoaderData,
	useParams,
	useSubmit,
} from "react-router";
import { churchOrganization, type formConfig } from "@/server/db/schema";
import { toast } from "sonner";
import { FormBuilder } from "~/components/FormBuilder";
import type { FormConfig } from "~/components/FormFieldTypes";
import {
	DEFAULT_CONTACT_FORM,
	DEFAULT_FIRST_TIME_VISITOR_FORM,
	DEFAULT_PRAYER_REQUEST_FORM,
} from "~/components/FormFieldTypes";
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
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Switch } from "~/components/ui/switch";
import { createAuthLoader } from "~/server/auth/authLoader";
import { FormService } from "~/services/FormService";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const churchId = params.organization as string;
		const forms = await FormService.getFormConfigs(db, { churchId });

		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, churchId))
			.then((res) => res[0]);

		return { forms, organization };
	},
	true,
);

export const action = createAuthLoader(async ({ request, params }) => {
	const formData = await request.formData();
	const churchId = params.organization as string;
	const action = formData.get("action") as string;

	if (action === "create" || action === "update") {
		const formConfig = JSON.parse(formData.get("formConfig") as string);
		const formId = formData.get("formId") as string | null;

		if (action === "create") {
			const newFormId = await FormService.createFormConfig(
				churchId,
				formConfig,
			);
			return { success: true, formId: newFormId };
		} else if (action === "update" && formId) {
			await FormService.updateFormConfig(formId, formConfig);
			return { success: true, formId };
		}
	} else if (action === "toggle-active") {
		const formId = formData.get("formId") as string;
		const active = formData.get("active") === "true";

		const form = await FormService.getFormConfigById(formId);
		if (form) {
			const updatedForm = {
				name: form.name,
				formType: form.formType as FormConfig["formType"],
				fields: JSON.parse(form.formFields),
				redirectUrl: form.redirectUrl || "",
				emailNotifications: form.emailNotifications,
				notificationEmails: form.notificationEmails
					? form.notificationEmails.split(",")
					: [],
				confirmationMessage: form.confirmationMessage || "",
				active: active,
			};

			await FormService.updateFormConfig(formId, updatedForm);
			return { success: true };
		}
	} else if (action === "delete") {
		const formId = formData.get("formId") as string;
		await FormService.deleteFormConfig(formId);
		return { success: true };
	}

	return { success: false };
}, true);

export default function FormsPage() {
	const { forms, organization } = useLoaderData<typeof loader>();
	const params = useParams();
	const submit = useSubmit();
	const [showFormBuilder, setShowFormBuilder] = useState(false);
	const [editingForm, setEditingForm] = useState<
		typeof formConfig.$inferSelect | null
	>(null);
	const [showTemplateDialog, setShowTemplateDialog] = useState(false);
	const [deleteFormId, setDeleteFormId] = useState<string | null>(null);

	// Handle toggling a form's active status
	const handleToggleActive = (formId: string, active: boolean) => {
		const formData = new FormData();
		formData.append("action", "toggle-active");
		formData.append("formId", formId);
		formData.append("active", active.toString());

		submit(formData, { method: "post" });
		toast.success(`Form ${active ? "activated" : "deactivated"} successfully`);
	};

	// Handle deleting a form
	const handleDeleteForm = (formId: string) => {
		const formData = new FormData();
		formData.append("action", "delete");
		formData.append("formId", formId);

		submit(formData, { method: "post" });
		setDeleteFormId(null);
		toast.success("Form deleted successfully");
	};

	// Handle saving a form from the form builder
	const handleSaveForm = (
		formData: Omit<FormConfig, "id" | "churchOrganizationId">,
	) => {
		const submitData = new FormData();

		if (editingForm) {
			submitData.append("action", "update");
			submitData.append("formId", editingForm.id);
		} else {
			submitData.append("action", "create");
		}

		submitData.append("formConfig", JSON.stringify(formData));

		submit(submitData, { method: "post" });
		setShowFormBuilder(false);
		setEditingForm(null);
		toast.success(`Form ${editingForm ? "updated" : "created"} successfully`);
	};

	// Open form builder to edit a form
	const handleEditForm = (form: typeof formConfig.$inferSelect) => {
		setEditingForm(form);
		setShowFormBuilder(true);
	};

	// Create a new form from a template
	const createFromTemplate = (
		template: Omit<FormConfig, "id" | "churchOrganizationId">,
	) => {
		setEditingForm(null);
		setShowFormBuilder(true);
		setShowTemplateDialog(false);

		// We'll use the template as a starting point in the form builder
		// The actual creation happens when they click Save in the form builder
	};

	// Helper to format timestamps
	const formatDate = (dateString: Date | string) => {
		const date =
			typeof dateString === "string" ? new Date(dateString) : dateString;
		return date.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	// Convert DB form to FormConfig for form builder
	const dbFormToFormConfig = (
		form: typeof formConfig.$inferSelect,
	): FormConfig => {
		return {
			id: form.id,
			name: form.name,
			formType: form.formType as FormConfig["formType"],
			fields: JSON.parse(form.formFields),
			redirectUrl: form.redirectUrl || "",
			emailNotifications: form.emailNotifications,
			notificationEmails: form.notificationEmails
				? form.notificationEmails.split(",")
				: [],
			confirmationMessage: form.confirmationMessage || "",
			active: form.active,
			churchOrganizationId: form.churchOrganizationId,
		};
	};

	return (
		<div className="container py-6">
			<div className="flex justify-between items-center mb-6">
				<div>
					<h1 className="text-3xl font-bold">Forms</h1>
					<p className="text-muted-foreground">
						Create and manage forms for your church website
					</p>
				</div>
				<div className="flex gap-3">
					<Button onClick={() => setShowTemplateDialog(true)}>
						<PlusCircle className="h-4 w-4 mr-2" />
						Create from Template
					</Button>
					<Button
						onClick={() => {
							setEditingForm(null);
							setShowFormBuilder(true);
						}}
					>
						<Plus className="h-4 w-4 mr-2" />
						Create New Form
					</Button>
				</div>
			</div>

			{forms.length === 0 ? (
				<Card>
					<CardContent className="py-12">
						<div className="text-center">
							<FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
							<h3 className="text-xl font-medium mb-2">No Forms Created Yet</h3>
							<p className="text-muted-foreground mb-6 max-w-md mx-auto">
								Create forms for contact requests, prayer requests, first-time
								visitors, and more. Forms will be available on your church
								website.
							</p>
							<div className="flex justify-center gap-3">
								<Button onClick={() => setShowTemplateDialog(true)}>
									<PlusCircle className="h-4 w-4 mr-2" />
									Create from Template
								</Button>
								<Button
									onClick={() => {
										setEditingForm(null);
										setShowFormBuilder(true);
									}}
								>
									<Plus className="h-4 w-4 mr-2" />
									Create New Form
								</Button>
							</div>
						</div>
					</CardContent>
				</Card>
			) : (
				<Card>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Form Name</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Last Updated</TableHead>
								<TableHead>Actions</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{forms.map((form) => (
								<TableRow key={form.id}>
									<TableCell className="font-medium">{form.name}</TableCell>
									<TableCell>
										<Badge variant="outline">
											{form.formType.charAt(0).toUpperCase() +
												form.formType.slice(1)}
										</Badge>
									</TableCell>
									<TableCell>
										<div className="flex items-center space-x-2">
											<Switch
												checked={form.active}
												onCheckedChange={(checked) =>
													handleToggleActive(form.id, checked)
												}
											/>
											<span>{form.active ? "Active" : "Inactive"}</span>
										</div>
									</TableCell>
									<TableCell>{formatDate(form.updatedAt)}</TableCell>
									<TableCell>
										<div className="flex items-center gap-2">
											<Button
												variant="ghost"
												size="icon"
												onClick={() => handleEditForm(form)}
												title="Edit form"
											>
												<Edit className="h-4 w-4" />
											</Button>
											<Link
												to={`/churches/${params.organization}/forms/${form.id}`}
											>
												<Button
													variant="ghost"
													size="icon"
													title="View submissions"
												>
													<MessageSquare className="h-4 w-4" />
												</Button>
											</Link>
											<Button
												variant="ghost"
												size="icon"
												onClick={() => setDeleteFormId(form.id)}
												title="Delete form"
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</Card>
			)}

			{/* Template Selection Dialog */}
			<Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
				<DialogContent className="sm:max-w-[550px]">
					<DialogHeader>
						<DialogTitle>Choose a Template</DialogTitle>
						<DialogDescription>
							Start with a pre-configured template or create from scratch
						</DialogDescription>
					</DialogHeader>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 py-4">
						<Card
							className="cursor-pointer hover:bg-secondary/10"
							onClick={() => createFromTemplate(DEFAULT_CONTACT_FORM)}
						>
							<CardHeader className="p-4">
								<CardTitle className="text-base">Contact Form</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<p className="text-sm text-muted-foreground">
									Basic contact form with name, email, and message fields
								</p>
							</CardContent>
						</Card>

						<Card
							className="cursor-pointer hover:bg-secondary/10"
							onClick={() => createFromTemplate(DEFAULT_PRAYER_REQUEST_FORM)}
						>
							<CardHeader className="p-4">
								<CardTitle className="text-base">Prayer Request</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<p className="text-sm text-muted-foreground">
									Form for collecting prayer requests from your congregation
								</p>
							</CardContent>
						</Card>

						<Card
							className="cursor-pointer hover:bg-secondary/10"
							onClick={() =>
								createFromTemplate(DEFAULT_FIRST_TIME_VISITOR_FORM)
							}
						>
							<CardHeader className="p-4">
								<CardTitle className="text-base">First-Time Visitor</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<p className="text-sm text-muted-foreground">
									Collect information from visitors to your church
								</p>
							</CardContent>
						</Card>

						<Card
							className="cursor-pointer hover:bg-secondary/10"
							onClick={() => {
								setShowFormBuilder(true);
								setShowTemplateDialog(false);
							}}
						>
							<CardHeader className="p-4">
								<CardTitle className="text-base">Blank Form</CardTitle>
							</CardHeader>
							<CardContent className="p-4 pt-0">
								<p className="text-sm text-muted-foreground">
									Start from scratch with a completely blank form
								</p>
							</CardContent>
						</Card>
					</div>

					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setShowTemplateDialog(false)}
						>
							Cancel
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Form Builder Dialog */}
			<Dialog open={showFormBuilder} onOpenChange={setShowFormBuilder}>
				<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>
							{editingForm
								? `Edit Form: ${editingForm.name}`
								: "Create New Form"}
						</DialogTitle>
						<DialogDescription>
							{editingForm
								? "Make changes to your form below"
								: "Configure your form fields and settings"}
						</DialogDescription>
					</DialogHeader>

					<FormBuilder
						initialForm={
							editingForm ? dbFormToFormConfig(editingForm) : undefined
						}
						onSave={handleSaveForm}
						onCancel={() => {
							setShowFormBuilder(false);
							setEditingForm(null);
						}}
					/>
				</DialogContent>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<AlertDialog
				open={!!deleteFormId}
				onOpenChange={(open) => !open && setDeleteFormId(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This will permanently delete this form and all its submissions.
							This action cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => deleteFormId && handleDeleteForm(deleteFormId)}
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
