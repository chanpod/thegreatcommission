import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { createAuthLoader } from "~/server/auth/authLoader";
import { churchOrganization, users, userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "~/server/dbConnection";

export const action = createAuthLoader(
	async ({ request, auth, params, userContext }) => {
		const formData = await request.formData();
		const message = formData.get("message") as string;
		const messageType = formData.get("type") as string;
		const subject = formData.get("subject") as string;
		const templateId = formData.get("templateId") as string;
		const userIds = formData.getAll("userIds[]") as string[];
		const format = formData.get("format")
			? JSON.parse(formData.get("format") as string)
			: undefined;

		// Initialize clients
		const accountSid = process.env.TWILIO_ACCOUNT_SID;
		const authToken = process.env.TWILIO_AUTH_TOKEN;
		const twilioClient = twilio(accountSid, authToken);
		sgMail.setApiKey(process.env.SENDGRID_API_KEY);

		// Get the organization details for template personalization
		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, params.organization))
			.then((res) => res[0]);

		const messagesSent = [];

		for (const userId of userIds) {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.then((res) => res[0]);

			if (messageType === "email") {
				let personalizedSubject = subject;
				let personalizedMessage = message;

				if (templateId) {
					// Replace template variables
					const replacements = {
						"{first_name}": user.firstName,
						"{church_name}": organization.name,
					};

					personalizedSubject = subject.replace(
						/{first_name}|{church_name}/g,
						(match) => replacements[match],
					);

					personalizedMessage = message.replace(
						/{first_name}|{church_name}/g,
						(match) => replacements[match],
					);
				}

				const email = {
					to: user.email,
					from: "gracecommunitybrunswick@gmail.com",
					subject: personalizedSubject,
					text: format?.html
						? personalizedMessage.replace(/<[^>]*>/g, "")
						: personalizedMessage,
					...(format?.html && { html: personalizedMessage }),
				};
				await sgMail.send(email);
				messagesSent.push(`email to ${user.firstName}`);
			} else if (messageType === "sms") {
				const formattedPhone = user.phone?.startsWith("+")
					? user.phone
					: `+1${user.phone}`;
				await twilioClient.messages.create({
					to: formattedPhone,
					from: "+18445479466",
					body: message,
				});
				messagesSent.push(`text to ${user.firstName}`);
			} else if (messageType === "phone") {
				const formattedPhone = user.phone?.startsWith("+")
					? user.phone
					: `+1${user.phone}`;
				await twilioClient.calls.create({
					twiml: `<Response><Say>${message}</Say></Response>`,
					to: formattedPhone,
					from: "+18445479466",
				});
				messagesSent.push(`call to ${user.firstName}`);
			}
		}

		return {
			success: true,
			message: `Messages sent: ${messagesSent.join(", ")}`,
		};
	},
);
