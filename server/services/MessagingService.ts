import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { db } from "@/server/db/dbConnection";
import { users, churchOrganization } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { MessageTrackerService } from "./MessageTrackerService";

// Interface for recipient data
export interface MessageRecipient {
	userId?: string;
	email?: string;
	phone?: string;
	firstName?: string;
	lastName?: string;
	preferences?: {
		emailNotifications?: boolean;
		smsNotifications?: boolean;
		phoneNotifications?: boolean;
		emailFrequency?: string;
		smsFrequency?: string;
		phoneFrequency?: string;
		notificationTypes?: string[];
		preferredContactMethod?: "email" | "sms" | "phone";
	};
}

// Interface for message data
export interface MessageData {
	churchOrganizationId: string;
	messageType: "email" | "sms" | "phone" | "alert";
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
	 * Fetch user data if only userId is provided
	 * @param recipient Recipient with at least userId
	 */
	async enrichRecipientData(
		recipient: MessageRecipient,
	): Promise<MessageRecipient> {
		if (recipient.email && recipient.phone && recipient.firstName) {
			return recipient; // Already has all needed data
		}

		// Check if we have a userId
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

		throw new Error("userId must be provided");
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
			console.log(
				`Email sent to ${recipient.email} with subject: ${personalizedSubject}`,
			);

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
				
			case "alert":
				// For individual messages, redirect to sendAlert which will handle preferred methods
				if (recipient.preferences && typeof recipient.preferences === 'object') {
					// Cast the recipient to include the required preferences structure
					const alertRecipient = recipient as MessageRecipient & {
						preferences: {
							emailNotifications: boolean;
							smsNotifications: boolean;
							phoneNotifications: boolean;
							preferredContactMethod?: "email" | "sms" | "phone";
						}
					};
					
					const alertResult = await this.sendAlert(data, alertRecipient);
					
					// Return the first result, or a default error if no results
					if (alertResult.results.length > 0) {
						return alertResult.results[0];
					} else {
						return {
							success: false,
							status: "Alert failed - no communication methods available",
						};
					}
				} else {
					return {
						success: false,
						status: "Cannot send alert - recipient is missing required preference data",
					};
				}

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
		summary: { success: number; failed: number; skipped: number };
		skippedRecipients: Array<{ recipient: MessageRecipient; reason: string }>;
	}> {
		const results: MessageResult[] = [];
		let success = 0;
		let failed = 0;
		let skipped = 0;
		const skippedRecipients: Array<{
			recipient: MessageRecipient;
			reason: string;
		}> = [];

		const isAlert = data.messageType === 'alert';

		for (const recipient of recipients) {
			// Skip processing if this is an alert but recipient lacks required preferences structure
			if (isAlert && (!recipient.preferences || typeof recipient.preferences !== 'object')) {
				console.log(
					`Skipping alert to ${recipient.email || recipient.phone}: Missing preferences data`,
				);
				skipped++;
				skippedRecipients.push({
					recipient,
					reason: "Missing preferences data required for alert",
				});
				continue;
			}

			if (isAlert) {
				// Handle alert message - this uses preferred communication method
				try {
					// Cast the recipient to include the required preferences structure for alerts
					const alertRecipient = recipient as MessageRecipient & {
						preferences: {
							emailNotifications: boolean;
							smsNotifications: boolean;
							phoneNotifications: boolean;
							preferredContactMethod?: "email" | "sms" | "phone";
						}
					};
					
					// Send alert through the sendAlert method
					const alertResult = await this.sendAlert(data, alertRecipient);
					
					// Process results
					results.push(...alertResult.results);
					success += alertResult.summary.success;
					failed += alertResult.summary.failed;
				} catch (error) {
					console.error(`Error sending alert to ${recipient.email || recipient.phone}:`, error);
					failed++;
					results.push({
						success: false,
						status: "Error sending alert",
						error,
					});
				}
			} else {
				// Handle regular (non-alert) message types
				// Validate if we can send this type of message to this recipient
				const validationResult = await this.canSendMessageToUser(
					data.messageType,
					recipient,
				);

				if (!validationResult.isAllowed) {
					console.log(
						`Skipping message to ${recipient.email || recipient.phone}: ${validationResult.reason}`,
					);
					skipped++;
					skippedRecipients.push({
						recipient,
						reason: validationResult.reason || "Unknown reason",
					});
					continue;
				}

				// Send the message if validation passed
				const result = await this.sendMessage(data, recipient);
				results.push(result);

				if (result.success) {
					success++;
				} else {
					failed++;
				}
			}
		}

		return {
			results,
			summary: {
				success,
				failed,
				skipped,
			},
			skippedRecipients,
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
				preferredCommunicationMethod?: "email" | "sms" | "phone";
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

		console.log("enrichedRecipient", recipient);
		// Enrich recipient data if needed
		const enrichedRecipient = await this.enrichRecipientData(recipient);
		// Check if the user has a preferred contact method
		const preferredMethod = recipient.preferences.preferredCommunicationMethod;
		console.log("preferredMethod", preferredMethod);
		// If a preferred method is specified, ONLY use that method
		if (preferredMethod) {
			let result: MessageResult | null = null;
			
			if (preferredMethod === "email" && recipient.preferences.emailNotifications && recipient.email) {
				result = await this.sendEmail(
					{
						...data,
						messageType: "email",
						subject: data.subject || "Alert: Important Message",
					},
					enrichedRecipient,
					organization?.name,
				);
			} else if (preferredMethod === "sms" && recipient.preferences.smsNotifications && recipient.phone) {
				result = await this.sendSMS(
					{
						...data,
						messageType: "sms",
					},
					enrichedRecipient,
					organization?.name,
				);
			} else if (preferredMethod === "phone" && recipient.preferences.phoneNotifications && recipient.phone) {
				result = await this.makePhoneCall(
					{
						...data,
						messageType: "phone",
					},
					enrichedRecipient,
					organization?.name,
				);
			}
			
			// If we have a result, add it to results
			if (result) {
				results.push(result);
				if (result.success) success++;
				else failed++;
			}
			
			// Return results - we don't try other methods when preferred is specified
			return {
				results,
				summary: {
					success,
					failed,
				},
			};
		}
		
		// No preferred method specified, fall back to sending via all enabled channels
		// Only reach here if user has no preferred method set
		
		// Send via email if enabled
		if (recipient.preferences.emailNotifications && recipient.email) {
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

		// Send via SMS if enabled
		if (recipient.preferences.smsNotifications && recipient.phone) {
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

		// Send via phone call if enabled
		if (recipient.preferences.phoneNotifications && recipient.phone) {
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

	/**
	 * Validates if a message of a specific type can be sent to a user based on their preferences
	 * @param messageType The type of message to send (email, sms, phone)
	 * @param recipient The recipient with optional preferences
	 * @param userPreferences The user preferences if not included in the recipient
	 * @returns An object with isAllowed flag and reason if not allowed
	 */
	async canSendMessageToUser(
		messageType: "email" | "sms" | "phone",
		recipient: MessageRecipient,
		userPreferences?: any,
	): Promise<{ isAllowed: boolean; reason?: string }> {
		// If no preferences provided in recipient and no separate userPreferences, assume allowed
		const preferences = recipient.preferences || userPreferences;

		// If no preferences at all, default to allowed (legacy behavior)
		if (!preferences) {
			console.log(`No preferences found for recipient, defaulting to allowed`);
			return { isAllowed: true };
		}

		// Check if the user has enabled notifications for this message type
		switch (messageType) {
			case "email":
				if (preferences.emailNotifications === false) {
					return {
						isAllowed: false,
						reason: "User has disabled email notifications",
					};
				}

				// Check if recipient has an email
				if (!recipient.email) {
					return {
						isAllowed: false,
						reason: "Recipient has no email address",
					};
				}
				break;

			case "sms":
				if (preferences.smsNotifications === false) {
					return {
						isAllowed: false,
						reason: "User has disabled SMS notifications",
					};
				}

				// Check if recipient has a phone number
				if (!recipient.phone) {
					return {
						isAllowed: false,
						reason: "Recipient has no phone number",
					};
				}
				break;

			case "phone":
				if (preferences.phoneNotifications === false) {
					return {
						isAllowed: false,
						reason: "User has disabled phone call notifications",
					};
				}

				// Check if recipient has a phone number
				if (!recipient.phone) {
					return {
						isAllowed: false,
						reason: "Recipient has no phone number",
					};
				}
				break;
		}

		// All checks passed, user can receive this type of message
		return { isAllowed: true };
	},
};
