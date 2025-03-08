import { createAuthLoader } from "~/server/auth/authLoader";
import { FormService } from "~/services/FormService";
import { db } from "@/server/db";
import { data } from "react-router";
import { eq } from "drizzle-orm";
import { churchOrganization } from "@/server/db/schema";

export const action = createAuthLoader(
	async ({ params, request, userContext }) => {
		const { formId, organization } = params;
		console.log("Action route called with params:", { formId, organization });

		if (!formId || !organization) {
			console.error("Missing required params:", { formId, organization });
			return data(
				{ success: false, error: "Invalid parameters" },
				{ status: 400 },
			);
		}

		// Get the form config to verify it belongs to the church
		const formConfig = await FormService.getFormConfigById(formId);
		console.log("Form config retrieved:", formConfig ? "Found" : "Not found");

		if (!formConfig) {
			console.error("Form config not found for ID:", formId);
			return data({ success: false, error: "Form not found" }, { status: 404 });
		}

		// Verify the form belongs to the organization
		const org = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, organization))
			.then((res) => res[0]);

		console.log("Organization retrieved:", org ? "Found" : "Not found");

		if (!org || formConfig.churchOrganizationId !== org.id) {
			console.error("Authorization failed:", {
				orgFound: !!org,
				formChurchId: formConfig.churchOrganizationId,
				orgId: org?.id,
			});
			return data({ success: false, error: "Not authorized" }, { status: 403 });
		}

		try {
			const formData = await request.formData();
			const action = formData.get("action") as string;
			const submissionId = formData.get("submissionId") as string;
			console.log("Processing action:", { action, submissionId });

			if (!action || !submissionId) {
				console.error("Missing required fields:", { action, submissionId });
				return data(
					{ success: false, error: "Missing required fields" },
					{ status: 400 },
				);
			}

			switch (action) {
				case "markAsViewed":
					console.log("Marking submission as viewed:", submissionId);
					await FormService.markSubmissionViewed(submissionId);
					console.log("Successfully marked as viewed");
					return data({ success: true });

				case "archive": {
					// Check if we're archiving or unarchiving
					const archivedValue = formData.get("archived");
					const shouldArchive = archivedValue !== "false";

					console.log(
						`${shouldArchive ? "Archiving" : "Unarchiving"} submission:`,
						submissionId,
					);
					await FormService.archiveSubmission(submissionId, shouldArchive);
					console.log(
						`Successfully ${shouldArchive ? "archived" : "unarchived"}`,
					);
					return data({ success: true });
				}

				case "delete":
					console.log("Deleting submission:", submissionId);
					await FormService.deleteSubmission(submissionId);
					console.log("Successfully deleted");
					return data({ success: true });

				default:
					console.error("Invalid action:", action);
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
