import { data } from "react-router";
import { FormService } from "~/services/FormService";
import { MessagingService } from "@/server/services/MessagingService";

export async function action({ request, params }) {
	try {
		const { organization: churchId, formId } = params;

		// Check if the form exists and is active
		const form = await FormService.getFormConfigById(formId);

		if (!form || !form.active) {
			return Response.json(
				{ success: false, error: "Form not found or inactive" },
				{ status: 404 },
			);
		}

		// Check if form belongs to the correct church
		if (form.churchOrganizationId !== churchId) {
			return Response.json(
				{ success: false, error: "Invalid form" },
				{ status: 400 },
			);
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
			formData.formData.formData,
			submitterEmail,
			submitterName,
		);

		// Send email notifications if enabled
		if (form.emailNotifications && form.notificationEmails) {
			const notificationEmails = form.notificationEmails
				.split(",")
				.map((email) => email.trim());

			// Format form data in a user-friendly way
			const formatFormData = () => {
				// Try to get form fields from the form configuration
				let formFields = [];
				try {
					formFields = JSON.parse(form.formFields);
				} catch (e) {
					// If parsing fails, continue with default formatting
				}

				// Create a map of field IDs to their labels if available
				const fieldLabels = {};
				if (Array.isArray(formFields)) {
					// Using for...of instead of forEach to satisfy linter
					for (const field of formFields) {
						if (field.id && field.label) {
							fieldLabels[field.id] = field.label;
						}
					}
				}

				// Format each form field on its own line
				return Object.entries(formData.formData.formData)
					.map(([key, value]) => {
						// Use the field label if available, otherwise use the key with first letter capitalized
						const fieldName =
							fieldLabels[key] ||
							key.charAt(0).toUpperCase() +
								key.slice(1).replace(/([A-Z])/g, " $1");

						// Format the value based on its type
						let formattedValue;

						if (typeof value === "object" && value !== null) {
							if (Array.isArray(value)) {
								formattedValue = value.join(", ");
								return `${fieldName}: ${formattedValue}`;
							}

							// Extract values from object
							const objValues = Object.values(value).filter(
								(v) => v !== null && v !== undefined,
							);
							formattedValue =
								objValues.length > 0
									? objValues.join(", ")
									: "No details provided";
							return `${fieldName}: ${formattedValue}`;
						}

						if (value === true) {
							formattedValue = "Yes";
							return `${fieldName}: ${formattedValue}`;
						}

						if (value === false) {
							formattedValue = "No";
							return `${fieldName}: ${formattedValue}`;
						}

						if (value === null || value === undefined || value === "") {
							formattedValue = "Not provided";
							return `${fieldName}: ${formattedValue}`;
						}

						formattedValue = String(value);
						return `${fieldName}: ${formattedValue}`;
					})
					.join("\n");
			};

			// Create email content
			const emailSubject = `New Form Submission: ${form.name}`;
			const emailMessage = `
				A new submission has been received for the form "${form.name}".

				Submission Details:
				${formatFormData()}



				Submission ID: ${submissionId}
				Date: ${new Date().toLocaleString()}
			`;

			// Send email to each notification recipient
			for (const email of notificationEmails) {
				if (email) {
					try {
						await MessagingService.sendEmail(
							{
								churchOrganizationId: churchId,
								messageType: "email",
								subject: emailSubject,
								message: emailMessage,
							},
							{ email },
						);
					} catch (emailError) {
						console.error(
							`Failed to send notification email to ${email}:`,
							emailError,
						);
						// Continue with other emails even if one fails
					}
				}
			}
		}

		return Response.json({ success: true, submissionId });
	} catch (error) {
		console.error("Form submission error:", error);
		return Response.json(
			{
				success: false,
				error: "An error occurred processing your submission",
			},
			{ status: 500 },
		);
	}
}

// No loader needed as this is just an API endpoint for form submissions
