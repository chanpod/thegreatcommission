import { createAuthLoader } from "~/server/auth/authLoader";
import { churchOrganization, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/dbConnection";
import {
	MessagingService,
	MessageRecipient,
} from "@/server/services/MessagingService";

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

		// Get all recipientIds entries and extract just the IDs
		const recipientIds = formData.getAll("recipientIds[]").map((id) => {
			// Extract just the ID portion after "user:" or "team:"
			const [type, actualId] = (id as string).split(":");
			return actualId;
		});

		// Prepare recipients array
		const recipients: MessageRecipient[] = [];
		for (const userId of recipientIds) {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.then((res) => res[0]);

			if (!user) continue;

			recipients.push({
				userId,
				email: user.email,
				phone: user.phone,
				firstName: user.firstName,
				lastName: user.lastName,
			});
		}

		// Prepare message data
		const messageData = {
			churchOrganizationId: params.organization,
			messageType: messageType as "email" | "sms" | "phone",
			message,
			subject,
			templateId,
			format,
			senderUserId: userContext.user.id,
		};

		// Send the message
		const result = await MessagingService.sendBulkMessage(
			messageData,
			recipients,
		);

		return {
			success: true,
			message: `Messages sent: ${result.summary.success} successful, ${result.summary.failed} failed`,
			details: result,
		};
	},
);
