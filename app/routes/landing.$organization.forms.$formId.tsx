import { useLoaderData, useNavigate, useOutletContext } from "react-router";
import { FormService } from "~/services/FormService";
import { DynamicForm } from "~/components/DynamicForm";
import { useState } from "react";
import { toast } from "sonner";
import type {
	churchOrganization,
	landingPageConfig,
	events,
} from "server/db/schema";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { FormSubmissionData } from "~/components/DynamicForm";

type LandingPageContext = {
	organization: typeof churchOrganization.$inferSelect;
	config: typeof landingPageConfig.$inferSelect | null;
	serviceTimes: Array<typeof events.$inferSelect>;
	upcomingEvents: Array<typeof events.$inferSelect>;
	isLive: boolean;
};

export const loader = async ({ params }) => {
	const { organization: organizationId, formId } = params;

	// Get form details
	const form = await FormService.getFormConfigById(formId);

	if (!form) {
		throw new Error("Form not found");
	}

	// Check if the form belongs to this organization
	if (form.churchOrganizationId !== organizationId) {
		throw new Error("Form does not belong to this organization");
	}

	// Check if the form is active
	if (!form.active) {
		throw new Error("This form is no longer active");
	}

	return {
		form,
	};
};

export default function FormSubmissionPage() {
	const { form } = useLoaderData();
	const { organization } = useOutletContext<LandingPageContext>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isSuccess, setIsSuccess] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async (
		formData: FormSubmissionData,
	): Promise<boolean> => {
		setIsSubmitting(true);

		try {
			// Submit the form data
			const response = await fetch(`/api/forms/${organization.id}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					formId: form.id,
					data: formData,
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.error || "Failed to submit form");
			}

			setIsSuccess(true);

			// Handle redirect if specified
			if (form.redirectUrl) {
				window.location.href = form.redirectUrl;
			} else {
				toast.success(
					form.confirmationMessage || "Thank you for your submission!",
				);
			}

			return true;
		} catch (error) {
			console.error("Error submitting form:", error);
			toast.error(
				error.message ||
					"There was a problem submitting your form. Please try again.",
			);
			return false;
		} finally {
			setIsSubmitting(false);
		}
	};

	const getFormIcon = () => {
		switch (form.formType) {
			case "contact":
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 text-primary"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
						/>
					</svg>
				);
			case "prayer":
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 text-primary"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
						/>
					</svg>
				);
			case "first-time":
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 text-primary"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
						/>
					</svg>
				);
			default:
				return (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						className="h-6 w-6 text-primary"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
						/>
					</svg>
				);
		}
	};

	return (
		<main className="container mx-auto px-4 py-8 max-w-3xl">
			{!isSuccess ? (
				<Card className="overflow-hidden">
					<CardHeader className="bg-muted/50 border-b flex flex-row items-center gap-2">
						<div className="p-2 rounded-full bg-primary/10">
							{getFormIcon()}
						</div>
						<div>
							<CardTitle className="text-2xl">{form.name}</CardTitle>
							{form.description && (
								<CardDescription>{form.description}</CardDescription>
							)}
						</div>
					</CardHeader>
					<CardContent className="p-6">
						<DynamicForm
							formConfig={form}
							onSubmit={handleSubmit}
							isSubmitting={isSubmitting}
							submitButtonText="Submit Form"
							className="max-w-2xl mx-auto"
						/>
					</CardContent>
				</Card>
			) : (
				<Card className="overflow-hidden">
					<CardContent className="p-8 text-center">
						<div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
							<svg
								xmlns="http://www.w3.org/2000/svg"
								className="h-8 w-8 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<CardTitle className="text-2xl mb-4">Thank You!</CardTitle>
						<CardDescription className="text-base mb-6">
							{form.confirmationMessage ||
								"Your form has been submitted successfully."}
						</CardDescription>
						<Alert
							variant="default"
							className="bg-primary/5 border-primary/20 mb-6 max-w-md mx-auto"
						>
							<AlertDescription>
								We've received your submission and will get back to you soon.
							</AlertDescription>
						</Alert>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<button
								type="button"
								onClick={() => {
									setIsSuccess(false);
									setIsSubmitting(false);
									window.scrollTo(0, 0);
								}}
								className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted/80 transition-colors"
							>
								Submit Another Response
							</button>
							<button
								type="button"
								onClick={() => navigate(`/landing/${organization.id}`)}
								className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
							>
								Return to Homepage
							</button>
						</div>
					</CardContent>
				</Card>
			)}
		</main>
	);
}
