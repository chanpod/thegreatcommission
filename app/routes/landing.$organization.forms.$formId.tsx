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

	const handleSubmit = async (formData): Promise<boolean> => {
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

	return (
		<main className="container mx-auto px-4 py-8 max-w-3xl">
			{!isSuccess ? (
				<>
					<div className="mb-6">
						<h1 className="text-3xl font-bold mb-2">{form.name}</h1>
						{form.description && (
							<p className="text-gray-600">{form.description}</p>
						)}
					</div>

					<div className="bg-white p-6 rounded-lg shadow-sm border">
						<DynamicForm
							formConfig={form}
							onSubmit={handleSubmit}
							isSubmitting={isSubmitting}
							submitButtonText="Submit Form"
						/>
					</div>
				</>
			) : (
				<div className="text-center py-12">
					<h2 className="text-2xl font-bold mb-4">Thank You!</h2>
					<p className="mb-6">
						{form.confirmationMessage ||
							"Your form has been submitted successfully."}
					</p>
					<button
						type="button"
						onClick={() => navigate(`/landing/${organization.id}`)}
						className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
					>
						Return to Homepage
					</button>
				</div>
			)}
		</main>
	);
}
