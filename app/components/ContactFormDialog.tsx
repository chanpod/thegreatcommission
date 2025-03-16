import { useState, useEffect } from "react";
import { DynamicForm } from "./DynamicForm";
import type { FormConfig } from "./FormFieldTypes";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ContactFormDialogProps {
	buttonText: string;
	churchId: string;
	formType?: string;
	formId?: string;
	buttonVariant?:
		| "default"
		| "outline"
		| "ghost"
		| "link"
		| "destructive"
		| "secondary";
	buttonSize?: "default" | "sm" | "lg" | "icon";
	buttonClassName?: string;
	dialogTitle?: string;
	dialogDescription?: string;
	className?: string;
}

export function ContactFormDialog({
	buttonText,
	churchId,
	formType = "contact",
	formId,
	buttonVariant = "default",
	buttonSize = "default",
	buttonClassName = "",
	dialogTitle = "Contact Us",
	dialogDescription = "Fill out the form below and we'll get back to you as soon as possible.",
	className = "",
}: ContactFormDialogProps) {
	const [open, setOpen] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [formConfig, setFormConfig] = useState<FormConfig | null>(null);

	// Reset form when dialog is closed
	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			// Reset form state when dialog is closed
			setFormConfig(null);
			setError(null);
		}
	};

	// Fetch form configuration when dialog opens
	useEffect(() => {
		if (open && !formConfig) {
			fetchForm();
		}
	}, [open, formConfig]);

	const fetchForm = async () => {
		setLoading(true);
		setError(null);

		try {
			// If formId is provided, fetch that specific form
			if (formId) {
				const response = await fetch(`/api/forms/${churchId}/${formId}`);

				if (!response.ok) {
					throw new Error("Failed to load form");
				}

				const data = await response.json();

				// Ensure the form has the required fields property
				if (!data.form) {
					console.error("Form data is missing:", data);
					throw new Error("Invalid form configuration");
				}

				// Handle different form data formats
				const form = data.form;
				if (!form.fields) {
					// Try to parse formFields if it exists
					if (form.formFields) {
						try {
							form.fields = JSON.parse(form.formFields);
						} catch (e) {
							console.error("Error parsing form fields:", e);
							throw new Error("Invalid form configuration");
						}
					} else {
						console.error("Form is missing fields property:", form);
						throw new Error("Invalid form configuration");
					}
				}

				// Validate that fields is an array
				if (!Array.isArray(form.fields)) {
					console.error("Form fields is not an array:", form.fields);
					throw new Error("Invalid form configuration");
				}

				setFormConfig(form);
			} else {
				// Otherwise fetch by type as before
				const response = await fetch(
					`/api/forms/${churchId}?type=${formType}&active=true`,
				);

				if (!response.ok) {
					throw new Error("Failed to load form");
				}

				const data = await response.json();

				if (data.forms && data.forms.length > 0) {
					// Ensure the form has the required fields property
					const form = data.forms[0];

					// Handle different form data formats
					if (!form.fields) {
						// Try to parse formFields if it exists
						if (form.formFields) {
							try {
								form.fields = JSON.parse(form.formFields);
							} catch (e) {
								console.error("Error parsing form fields:", e);
								throw new Error("Invalid form configuration");
							}
						} else {
							console.error("Form is missing fields property:", form);
							throw new Error("Invalid form configuration");
						}
					}

					// Validate that fields is an array
					if (!Array.isArray(form.fields)) {
						console.error("Form fields is not an array:", form.fields);
						throw new Error("Invalid form configuration");
					}

					// Use the first/most recent form
					setFormConfig(form);
				} else {
					throw new Error("No form configured");
				}
			}
		} catch (error) {
			console.error("Error loading form:", error);
			setError("Unable to load the form. Please try again later.");
		} finally {
			setLoading(false);
		}
	};

	const handleSubmit = async (
		data: Record<string, string | boolean | string[]>,
	): Promise<boolean> => {
		if (!formConfig) return false;

		try {
			const response = await fetch(
				`/landing/${churchId}/forms/${formConfig.id}/submit`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						formData: data,
						submitterEmail: typeof data.email === "string" ? data.email : "",
						submitterName:
							typeof data.name === "string"
								? data.name
								: typeof data.fullName === "string"
									? data.fullName
									: "",
					}),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error("Form submission error:", errorData);
				throw new Error(errorData.error || "Form submission failed");
			}

			// Show success message
			toast.success(
				formConfig.confirmationMessage || "Thank you for your submission!",
			);

			// Close the dialog on successful submission
			setOpen(false);

			return true;
		} catch (error) {
			console.error("Form submission error:", error);
			toast.error("There was an error submitting the form. Please try again.");
			return false;
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button
					variant={buttonVariant}
					size={buttonSize}
					className={buttonClassName}
				>
					{buttonText}
				</Button>
			</DialogTrigger>
			<DialogContent
				className={`sm:max-w-[550px] max-h-[90vh] overflow-y-auto ${className}`}
			>
				<DialogHeader>
					<DialogTitle>{dialogTitle}</DialogTitle>
					<DialogDescription>{dialogDescription}</DialogDescription>
				</DialogHeader>

				{loading ? (
					<div className="flex justify-center py-8">
						<Loader2 className="h-8 w-8 animate-spin text-primary" />
						<span className="sr-only">Loading form...</span>
					</div>
				) : error ? (
					<div className="text-center py-8 text-red-500">
						<p>{error}</p>
						<Button variant="outline" onClick={fetchForm} className="mt-4">
							Try Again
						</Button>
					</div>
				) : formConfig ? (
					<div className="py-4">
						{/* Debug information - remove in production */}
						{process.env.NODE_ENV !== "production" && (
							<div className="mb-4 p-2 bg-gray-100 rounded text-xs">
								<details>
									<summary className="cursor-pointer font-medium">
										Debug Form Data
									</summary>
									<pre className="mt-2 overflow-auto max-h-40">
										{JSON.stringify(
											{
												id: formConfig.id,
												name: formConfig.name,
												fieldsCount: formConfig.fields?.length || 0,
												hasFields: Boolean(formConfig.fields),
												formFields: formConfig.formFields
													? "Present (JSON string)"
													: "Missing",
											},
											null,
											2,
										)}
									</pre>
								</details>
							</div>
						)}
						<DynamicForm formConfig={formConfig} onSubmit={handleSubmit} />
					</div>
				) : null}
			</DialogContent>
		</Dialog>
	);
}
