import { createAuthLoader } from "~/server/auth/authLoader";
import { churchOrganization, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/dbConnection";
import {
	MessagingService,
	type MessageRecipient,
} from "@/server/services/MessagingService";
import { getUser } from "@/server/dataServices/UserDataService";
import { getUserPreferences } from "@/server/dataServices/UserPreferences";

export const action = createAuthLoader(
	async ({ request, auth, params, userContext }) => {
		console.log("message action");
		const formData = await request.formData();
		const message = formData.get("message") as string;
		const messageType = formData.get("type") as string;
		const subject = formData.get("subject") as string;
		const templateId = formData.get("templateId") as string;
		const format = formData.get("format")
			? JSON.parse(formData.get("format") as string)
			: undefined;

		// Get all recipientIds entries and extract the type and ID
		const recipientEntries = formData.getAll("recipientIds[]").map((id) => {
			// Extract the type and ID
			const [type, actualId] = (id as string).split(":");
			return { type, id: actualId };
		});

		// Prepare recipients array
		const recipients: MessageRecipient[] = [];

		for (const entry of recipientEntries) {
			if (entry.type === "user") {
				// Handle users
				const user = (await getUser({ userId: entry.id })).users;
				const userPreferences = await getUserPreferences(entry.id);

				if (!user) continue;

				recipients.push({
					userId: entry.id,
					email: user.email,
					phone: user.phone,
					firstName: user.firstName,
					lastName: user.lastName,
					preferences: userPreferences,
				});
			}
		}

		// Prepare message data
		const messageData = {
			churchOrganizationId: params.organization,
			messageType: messageType as "email" | "sms" | "phone",
			message,
			subject,
			templateId,
			format,
			senderUserId: String(userContext.user.id),
		};

		// Send the message
		const result = await MessagingService.sendBulkMessage(
			messageData,
			recipients,
		);

		return {
			success: true,
			message: `Messages sent: ${result.summary.success} successful, ${result.summary.failed} failed, ${result.summary.skipped} skipped`,
			details: result,
		};
	},
);
