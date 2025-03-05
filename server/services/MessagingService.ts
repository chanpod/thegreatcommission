import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { db } from "@/server/db/dbConnection";
import { users, churchOrganization, guardiansTable } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { MessageTrackerService } from "./MessageTrackerService";

// Interface for recipient data
export interface MessageRecipient {
	userId?: string;
	guardianId?: string;
	email?: string;
	phone?: string;
	firstName?: string;
	lastName?: string;
}

// Interface for message data
export interface MessageData {
	churchOrganizationId: string;
	messageType: "email" | "sms" | "phone";
	message: string;
	subject?: string;
	templateId?: string;
	format?: {
		html?: boolean;
		richText?: boolean;
	};
	senderUserId?: string;
}

// Result of a message send operation
export interface MessageResult {
	success: boolean;
	status: string;
	providerMessageId?: string;
	error?: Error | unknown;
}

/**
 * Service to handle all messaging operations
 */
export const MessagingService = {
	/**
	 * Initialize the messaging clients
	 * @returns Initialized Twilio and SendGrid clients
	 */
	initClients() {
		const accountSid = process.env.TWILIO_ACCOUNT_SID;
		const authToken = process.env.TWILIO_AUTH_TOKEN;
		const twilioClient = twilio(accountSid, authToken);

		sgMail.setApiKey(process.env.SENDGRID_API_KEY);

		return { twilioClient, sgMail };
	},

	/**
	 * Helper function to format a phone number
	 * @param phone Phone number to format
	 * @returns Formatted phone number
	 */
	formatPhoneNumber(phone: string | null | undefined): string | null {
		if (!phone) return null;

		// Remove non-digit characters
		const cleaned = phone.replace(/\D/g, "");

		// Ensure it's a US number with country code
		const withCountry = cleaned.startsWith("1") ? cleaned : `1${cleaned}`;

		// Add + prefix if not present
		return withCountry.startsWith("+") ? withCountry : `+${withCountry}`;
	},

	/**
	 * Fetch user data if only userId is provided, or guardian data if only guardianId is provided
	 * @param recipient Recipient with at least userId or guardianId
	 */
	async enrichRecipientData(
		recipient: MessageRecipient,
	): Promise<MessageRecipient> {
		if (recipient.email && recipient.phone && recipient.firstName) {
			return recipient; // Already has all needed data
		}

		// First check if we have a userId
		if (recipient.userId) {
			// Fetch user data
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, recipient.userId))
				.then((res) => res[0]);

			if (!user) {
				throw new Error(`User with ID ${recipient.userId} not found`);
			}

			return {
				userId: recipient.userId,
				email: recipient.email || user.email,
				phone: recipient.phone || user.phone,
				firstName: recipient.firstName || user.firstName,
				lastName: recipient.lastName || user.lastName,
			};
		}

		// Then check if we have a guardianId
		if (recipient.guardianId) {
			// Fetch guardian data
			const guardian = await db
				.select()
				.from(guardiansTable)
				.where(eq(guardiansTable.id, recipient.guardianId))
				.then((res) => res[0]);

			if (!guardian) {
				throw new Error(`Guardian with ID ${recipient.guardianId} not found`);
			}

			return {
				guardianId: recipient.guardianId,
				email: recipient.email || guardian.email,
				phone: recipient.phone || guardian.phone,
				firstName: recipient.firstName || guardian.firstName,
				lastName: recipient.lastName || guardian.lastName,
			};
		}

		throw new Error("Either userId or guardianId must be provided");
	},

	/**
	 * Personalize a message using template variables
	 * @param text Text to personalize
	 * @param recipient Recipient data
	 * @param organizationName Optional organization name
	 */
	personalizeMessage(
		text: string,
		recipient: MessageRecipient,
		organizationName?: string,
	): string {
		const replacements = {
			"{first_name}": recipient.firstName || "",
			"{last_name}": recipient.lastName || "",
			"{church_name}": organizationName || "",
		};

		return text.replace(
			/{first_name}|{last_name}|{church_name}/g,
			(match) => replacements[match],
		);
	},

	/**
	 * Send an email message
	 * @param data Message data
	 * @param recipient Recipient
	 * @param organizationName Optional organization name
	 */
	async sendEmail(
		data: MessageData,
		recipient: MessageRecipient,
		organizationName?: string,
	): Promise<MessageResult> {
		const { sgMail } = this.initClients();
		try {
			// Personalize message
			const personalizedSubject = data.subject
				? this.personalizeMessage(data.subject, recipient, organizationName)
				: "Church App Message";

			const personalizedMessage = this.personalizeMessage(
				data.message,
				recipient,
				organizationName,
			);

			// Create email object
			const email = {
				to: recipient.email,
				from: "gracecommunitybrunswick@gmail.com", // Should be configurable
				subject: personalizedSubject,
				text: data.format?.html
					? personalizedMessage.replace(/<[^>]*>/g, "")
					: personalizedMessage,
				...(data.format?.html && { html: personalizedMessage }),
			};

			// Send email
			const response = await sgMail.send(email);

			// We no longer track email messages
			// Just log for debugging purposes
			console.log(`Email sent to ${recipient.email} with subject: ${personalizedSubject}`);

			return {
				success: true,
				status: "sent",
				providerMessageId: response[0]?.headers?.["x-message-id"],
			};
		} catch (error) {
			console.error("Error sending email:", error);

			// We no longer track failed email messages either
			console.log(`Failed to send email to ${recipient.email}`);

			return {
				success: false,
				status: "failed",
				error,
			};
		}
	},

	/**
	 * Send an SMS message
	 * @param data Message data
	 * @param recipient Recipient
	 * @param organizationName Optional organization name
	 */
	async sendSMS(
		data: MessageData,
		recipient: MessageRecipient,
		organizationName?: string,
	): Promise<MessageResult> {
		const { twilioClient } = this.initClients();

		try {
			// Format phone number
			const formattedPhone = this.formatPhoneNumber(recipient.phone);
			if (!formattedPhone) {
				throw new Error("No phone number available for recipient");
			}

			// Personalize message
			const personalizedMessage = this.personalizeMessage(
				data.message,
				recipient,
				organizationName,
			);

			// Send SMS
			const smsResponse = await twilioClient.messages.create({
				to: formattedPhone,
				from: "+18445479466", // Should be configurable
				body: personalizedMessage,
			});

			// Track the SMS
			await MessageTrackerService.trackMessage({
				churchOrganizationId: data.churchOrganizationId,
				messageType: "sms",
				recipientId: recipient.userId,
				guardianId: recipient.guardianId,
				recipientPhone: formattedPhone,
				sentByUserId: data.senderUserId,
				messageContent: personalizedMessage,
				messageLength: personalizedMessage.length,
				status: smsResponse.status,
				providerMessageId: smsResponse.sid,
			});

			return {
				success: true,
				status: smsResponse.status,
				providerMessageId: smsResponse.sid,
			};
		} catch (error) {
			console.error("Error sending SMS:", error);

			// Track failed message
			await MessageTrackerService.trackMessage({
				churchOrganizationId: data.churchOrganizationId,
				messageType: "sms",
				recipientId: recipient.userId,
				guardianId: recipient.guardianId,
				recipientPhone: recipient.phone,
				sentByUserId: data.senderUserId,
				messageContent: data.message,
				messageLength: data.message.length,
				status: "failed",
			});

			return {
				success: false,
				status: "failed",
				error,
			};
		}
	},

	/**
	 * Make a phone call
	 * @param data Message data
	 * @param recipient Recipient
	 * @param organizationName Optional organization name
	 */
	async makePhoneCall(
		data: MessageData,
		recipient: MessageRecipient,
		organizationName?: string,
	): Promise<MessageResult> {
		const { twilioClient } = this.initClients();

		try {
			// Format phone number
			const formattedPhone = this.formatPhoneNumber(recipient.phone);
			if (!formattedPhone) {
				throw new Error("No phone number available for recipient");
			}

			// Personalize message
			const personalizedMessage = this.personalizeMessage(
				data.message,
				recipient,
				organizationName,
			);

			// Create TwiML
			const twiml = `<Response><Say>Hello, ${recipient.firstName || ""}! ${personalizedMessage}</Say></Response>`;

			// Make call
			const callResponse = await twilioClient.calls.create({
				twiml,
				to: formattedPhone,
				from: "+18445479466", // Should be configurable
			});

			// Track the phone call
			await MessageTrackerService.trackMessage({
				churchOrganizationId: data.churchOrganizationId,
				messageType: "phone",
				recipientId: recipient.userId,
				guardianId: recipient.guardianId,
				recipientPhone: formattedPhone,
				sentByUserId: data.senderUserId,
				messageContent: personalizedMessage,
				status: callResponse.status,
				providerMessageId: callResponse.sid,
			});

			return {
				success: true,
				status: callResponse.status,
				providerMessageId: callResponse.sid,
			};
		} catch (error) {
			console.error("Error making phone call:", error);

			// Track failed message
			await MessageTrackerService.trackMessage({
				churchOrganizationId: data.churchOrganizationId,
				messageType: "phone",
				recipientId: recipient.userId,
				guardianId: recipient.guardianId,
				recipientPhone: recipient.phone,
				sentByUserId: data.senderUserId,
				messageContent: data.message,
				status: "failed",
			});

			return {
				success: false,
				status: "failed",
				error,
			};
		}
	},

	/**
	 * Send a message to a single recipient
	 * @param data Message data
	 * @param recipient Message recipient
	 */
	async sendMessage(
		data: MessageData,
		recipient: MessageRecipient,
	): Promise<MessageResult> {
		// Get organization info for personalization
		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, data.churchOrganizationId))
			.then((res) => res[0]);

		// Enrich recipient data if needed
		const enrichedRecipient = await this.enrichRecipientData(recipient);

		// Send based on message type
		switch (data.messageType) {
			case "email":
				return this.sendEmail(data, enrichedRecipient, organization?.name);

			case "sms":
				return this.sendSMS(data, enrichedRecipient, organization?.name);

			case "phone":
				return this.makePhoneCall(data, enrichedRecipient, organization?.name);

			default:
				throw new Error(`Unsupported message type: ${data.messageType}`);
		}
	},

	/**
	 * Send a message to multiple recipients
	 * @param data Message data
	 * @param recipients Array of recipients
	 */
	async sendBulkMessage(
		data: MessageData,
		recipients: MessageRecipient[],
	): Promise<{
		results: MessageResult[];
		summary: { success: number; failed: number };
	}> {
		const results: MessageResult[] = [];
		let success = 0;
		let failed = 0;

		for (const recipient of recipients) {
			const result = await this.sendMessage(data, recipient);
			results.push(result);

			if (result.success) {
				success++;
			} else {
				failed++;
			}
		}

		return {
			results,
			summary: {
				success,
				failed,
			},
		};
	},

	/**
	 * Send an alert message using user preferences
	 * @param data Message data (type will be ignored)
	 * @param recipient Recipient with preferences
	 */
	async sendAlert(
		data: MessageData,
		recipient: MessageRecipient & {
			preferences: {
				emailNotifications: boolean;
				smsNotifications: boolean;
				phoneNotifications: boolean;
			};
		},
	): Promise<{
		results: MessageResult[];
		summary: { success: number; failed: number };
	}> {
		const results: MessageResult[] = [];
		let success = 0;
		let failed = 0;

		// Get organization info for personalization
		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, data.churchOrganizationId))
			.then((res) => res[0]);

		// Enrich recipient data if needed
		const enrichedRecipient = await this.enrichRecipientData(recipient);

		// Send via each enabled channel according to preferences
		if (recipient.preferences.emailNotifications) {
			const emailResult = await this.sendEmail(
				{
					...data,
					messageType: "email",
					subject: data.subject || "Alert: Important Message",
				},
				enrichedRecipient,
				organization?.name,
			);

			results.push(emailResult);
			if (emailResult.success) success++;
			else failed++;
		}

		if (recipient.preferences.smsNotifications) {
			const smsResult = await this.sendSMS(
				{
					...data,
					messageType: "sms",
				},
				enrichedRecipient,
				organization?.name,
			);

			results.push(smsResult);
			if (smsResult.success) success++;
			else failed++;
		}

		if (recipient.preferences.phoneNotifications) {
			const phoneResult = await this.makePhoneCall(
				{
					...data,
					messageType: "phone",
				},
				enrichedRecipient,
				organization?.name,
			);

			results.push(phoneResult);
			if (phoneResult.success) success++;
			else failed++;
		}

		return {
			results,
			summary: {
				success,
				failed,
			},
		};
	},
};
