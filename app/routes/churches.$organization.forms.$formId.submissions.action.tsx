import { createAuthLoader } from "~/server/auth/authLoader";
import { FormService } from "~/services/FormService";
import { db } from "@/server/db";
import { data } from "react-router";

export const action = createAuthLoader(
	async ({ params, request, userContext }) => {
		const { formId, organization } = params;

		if (!formId || !organization) {
			return data(
				{ success: false, error: "Invalid parameters" },
				{ status: 400 },
			);
		}

		// Get the form config to verify it belongs to the church
		const formConfig = await FormService.getFormConfigById(formId);

		if (!formConfig) {
			return data({ success: false, error: "Form not found" }, { status: 404 });
		}

		// Verify the form belongs to the organization
		const org = await db.organization.findUnique({
			where: { slug: organization },
			select: { id: true },
		});

		if (!org || formConfig.churchId !== org.id) {
			return data({ success: false, error: "Not authorized" }, { status: 403 });
		}

		try {
			const formData = await request.formData();
			const action = formData.get("action") as string;
			const submissionId = formData.get("submissionId") as string;

			if (!action || !submissionId) {
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			switch (action) {
				case "markAsViewed":
					// await FormService.markSubmissionAsViewed(db, submissionId);
					return data({ success: true });

				case "archive":
					await FormService.archiveSubmission(submissionId);
					return data({ success: true });

				case "delete":
					await FormService.deleteSubmission(submissionId);
					return data({ success: true });

				default:
					return data(
						{ success: false, error: "Invalid action" },
						{ status: 400 },
					);
			}
		} catch (error) {
			console.error("Error processing form submission action:", error);
			return data(
				{ success: false, error: "Failed to process action" },
				{ status: 500 },
			);
		}
	},
);
