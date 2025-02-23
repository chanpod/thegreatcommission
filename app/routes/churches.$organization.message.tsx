import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { createAuthLoader } from "~/server/auth/authLoader";
import { churchOrganization, users, userPreferences } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "~/server/dbConnection";

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

		for (const userId of recipientIds) {
			const user = await db
				.select()
				.from(users)
				.where(eq(users.id, userId))
				.then((res) => res[0]);

			if (!user) continue;

			if (messageType === "email") {
				console.log("sending email to", user.firstName);
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
				console.log("sending sms to", user.firstName);
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
				console.log("sending phone to", user.firstName);
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
