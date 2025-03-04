import { createAuthLoader } from "~/server/auth/authLoader";
import { churchOrganization, users, guardiansTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "@/server/db/dbConnection";
import {
	MessagingService,
	type MessageRecipient,
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

		// Get all recipientIds entries and extract the type and ID
		const recipientEntries = formData.getAll("recipientIds[]").map((id) => {
			// Extract the type (user/guardian) and ID
			const [type, actualId] = (id as string).split(":");
			return { type, id: actualId };
		});

		// Prepare recipients array
		const recipients: MessageRecipient[] = [];

		for (const entry of recipientEntries) {
			if (entry.type === "user") {
				// Handle users
				const user = await db
					.select()
					.from(users)
					.where(eq(users.id, entry.id))
					.then((res) => res[0]);

				if (!user) continue;

				recipients.push({
					userId: entry.id,
					email: user.email,
					phone: user.phone,
					firstName: user.firstName,
					lastName: user.lastName,
				});
			} else if (entry.type === "guardian") {
				// Handle guardians
				const guardian = await db
					.select()
					.from(guardiansTable)
					.where(eq(guardiansTable.id, entry.id))
					.then((res) => res[0]);

				if (!guardian) continue;

				recipients.push({
					guardianId: guardian.userId,
					email: guardian.email,
					phone: guardian.phone,
					firstName: guardian.firstName,
					lastName: guardian.lastName,
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
			message: `Messages sent: ${result.summary.success} successful, ${result.summary.failed} failed`,
			details: result,
		};
	},
);
