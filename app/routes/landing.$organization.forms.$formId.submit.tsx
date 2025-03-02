import { data } from "react-router";
import { FormService } from "~/services/FormService";

export async function action({ request, params }) {
	try {
		const { organization: churchId, formId } = params;

		// Check if the form exists and is active
		const form = await FormService.getFormConfigById(formId);

		if (!form || !form.active) {
			return data(
				{ success: false, error: "Form not found or inactive" },
				{ status: 404 },
			);
		}

		// Check if form belongs to the correct church
		if (form.churchOrganizationId !== churchId) {
			return data({ success: false, error: "Invalid form" }, { status: 400 });
		}

		// Parse the submission data
		const formData = await request.json();

		// Get the submitter email and name from the form data if available
		const submitterEmail = formData.submitterEmail;
		const submitterName = formData.submitterName;

		// Store the form submission
		const submissionId = await FormService.createFormSubmission(
			formId,
			churchId,
			formData.formData,
			submitterEmail,
			submitterName,
		);

		// TODO: Send email notifications if enabled
		if (form.emailNotifications && form.notificationEmails) {
			// Send email to notification recipients
			// This would typically use a service like SendGrid, Mailgun, etc.
			// For now, we'll just log this
			console.log(`Email would be sent to: ${form.notificationEmails}`);
		}

		return data({ success: true, submissionId });
	} catch (error) {
		console.error("Form submission error:", error);
		return data(
			{ success: false, error: "An error occurred processing your submission" },
			{ status: 500 },
		);
	}
}

// No loader needed as this is just an API endpoint for form submissions
