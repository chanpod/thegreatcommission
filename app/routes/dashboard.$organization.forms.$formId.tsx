import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { data } from "react-router";
import { FormBuilder } from "~/components/FormBuilder";
import { Button } from "~/components/ui/button";
import { FormService } from "~/services/FormService";
import { ArrowLeftIcon, TrashIcon } from "lucide-react";
import { Spinner } from "~/components/ui/spinner";
import { Alert } from "~/components/ui/alert";
import type { FormConfig, FormField } from "~/components/FormFieldTypes";
import { createAuthLoader } from "~/server/auth/authLoader";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext.user;
		const organizationId = params.organization;
		const formId = params.formId;

		if (!organizationId || !formId) {
			throw new Response("Invalid parameters", { status: 400 });
		}

		const form = await FormService.getFormConfigById(formId);

		if (!form) {
			throw new Response("Form not found", { status: 404 });
		}

		if (form.churchOrganizationId !== organizationId) {
			throw new Response("Not authorized", { status: 403 });
		}

		// Parse form fields JSON
		const formFields = form.formFields ? JSON.parse(form.formFields) : [];

		// Parse notification emails if present
		const notificationEmails = form.notificationEmails
			? form.notificationEmails.split(",")
			: [];

		const formConfig: FormConfig = {
			id: form.id,
			churchOrganizationId: form.churchOrganizationId,
			name: form.name,
			formType: form.formType,
			fields: formFields,
			active: form.active,
			emailNotifications: form.emailNotifications,
			notificationEmails: notificationEmails,
			redirectUrl: form.redirectUrl || undefined,
			confirmationMessage: form.confirmationMessage || undefined,
			createdAt: form.createdAt,
			updatedAt: form.updatedAt,
		};

		return data({ form: formConfig });
	},
	true,
);

export const action = createAuthLoader(
	async ({ request, params, userContext }) => {
		const organizationId = params.organization;
		const formId = params.formId;

		if (!organizationId || !formId) {
			throw new Response("Invalid parameters", { status: 400 });
		}

		const form = await FormService.getFormConfigById(formId);

		if (!form) {
			throw new Response("Form not found", { status: 404 });
		}

		if (form.churchOrganizationId !== organizationId) {
			throw new Response("Not authorized", { status: 403 });
		}

		const method = request.method;

		if (method === "DELETE") {
			await FormService.deleteFormConfig(formId);
			return data({ success: true, action: "delete" });
		}

		if (method === "PUT") {
			const formData = await request.json();
			await FormService.updateFormConfig(formId, formData);
			return data({ success: true, action: "update" });
		}

		return data({ success: false, message: "Invalid method" }, { status: 400 });
	},
	true,
);

export default function FormDetailPage() {
	const params = useParams();
	const navigate = useNavigate();
	const organizationId = params.organization;
	const formId = params.formId;

	const [form, setForm] = useState<FormConfig | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [deleting, setDeleting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	useEffect(() => {
		const fetchForm = async () => {
			if (!organizationId || !formId) return;

			try {
				const formData = await FormService.getFormConfigById(formId);

				if (!formData) {
					throw new Error("Form not found");
				}

				if (formData.churchOrganizationId !== organizationId) {
					throw new Error("Not authorized to view this form");
				}

				// Parse form fields JSON
				const formFields = formData.formFields
					? JSON.parse(formData.formFields)
					: [];

				// Parse notification emails if present
				const notificationEmails = formData.notificationEmails
					? formData.notificationEmails.split(",")
					: [];

				const formConfig: FormConfig = {
					id: formData.id,
					churchOrganizationId: formData.churchOrganizationId,
					name: formData.name,
					formType: formData.formType,
					fields: formFields,
					active: formData.active,
					emailNotifications: formData.emailNotifications,
					notificationEmails: notificationEmails,
					redirectUrl: formData.redirectUrl || undefined,
					confirmationMessage: formData.confirmationMessage || undefined,
					createdAt: formData.createdAt,
					updatedAt: formData.updatedAt,
				};

				setForm(formConfig);
			} catch (err) {
				setError(err instanceof Error ? err.message : "An error occurred");
			} finally {
				setIsLoading(false);
			}
		};

		fetchForm();
	}, [organizationId, formId]);

	const handleSave = async (formConfig: FormConfig) => {
		try {
			setSaving(true);
			setError(null);
			setSuccess(null);

			await FormService.updateFormConfig(formId, formConfig);

			setSuccess("Form updated successfully");

			// Refresh form data
			const updatedForm = await FormService.getFormConfigById(formId);
			if (updatedForm) {
				// Parse form fields JSON
				const formFields = updatedForm.formFields
					? JSON.parse(updatedForm.formFields)
					: [];

				// Parse notification emails if present
				const notificationEmails = updatedForm.notificationEmails
					? updatedForm.notificationEmails.split(",")
					: [];

				const formConfig: FormConfig = {
					id: updatedForm.id,
					churchOrganizationId: updatedForm.churchOrganizationId,
					name: updatedForm.name,
					formType: updatedForm.formType,
					fields: formFields,
					active: updatedForm.active,
					emailNotifications: updatedForm.emailNotifications,
					notificationEmails: notificationEmails,
					redirectUrl: updatedForm.redirectUrl || undefined,
					confirmationMessage: updatedForm.confirmationMessage || undefined,
					createdAt: updatedForm.createdAt,
					updatedAt: updatedForm.updatedAt,
				};

				setForm(formConfig);
			}
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setSaving(false);
		}
	};

	const handleDelete = async () => {
		if (
			!window.confirm(
				"Are you sure you want to delete this form? This action cannot be undone.",
			)
		) {
			return;
		}

		try {
			setDeleting(true);
			setError(null);

			await FormService.deleteFormConfig(formId);

			// Navigate back to forms list
			navigate(`/dashboard/${organizationId}/forms`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
			setDeleting(false);
		}
	};

	if (!organizationId || !formId) {
		throw new Error("Invalid parameters");
	}

	if (isLoading) {
		return (
			<div className="bg-white rounded-lg shadow p-6 flex justify-center">
				<Spinner size="lg" />
			</div>
		);
	}

	if (!form) {
		return (
			<div className="bg-white rounded-lg shadow p-6">
				<Alert variant="destructive">Form not found</Alert>
				<div className="mt-4">
					<Link to={`/dashboard/${organizationId}/forms`}>
						<Button variant="secondary">Back to Forms</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow">
			<div className="p-4 border-b flex justify-between items-center">
				<div className="flex items-center">
					<Link to={`/dashboard/${organizationId}/forms`} className="mr-4">
						<Button variant="ghost" size="sm">
							<ArrowLeftIcon className="h-5 w-5 mr-1" />
							Back to Forms
						</Button>
					</Link>
					<h2 className="text-lg font-medium">Edit Form: {form.name}</h2>
				</div>
				<Button
					variant="destructive"
					size="sm"
					onClick={handleDelete}
					disabled={deleting}
				>
					{deleting ? (
						<Spinner size="sm" />
					) : (
						<>
							<TrashIcon className="h-5 w-5 mr-1" />
							Delete Form
						</>
					)}
				</Button>
			</div>

			<div className="p-6">
				{error && (
					<Alert variant="destructive" className="mb-4">
						{error}
					</Alert>
				)}

				{success && (
					<Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
						{success}
					</Alert>
				)}

				<FormBuilder
					initialFormConfig={form}
					onSave={handleSave}
					isSubmitting={saving}
				/>
			</div>
		</div>
	);
}
