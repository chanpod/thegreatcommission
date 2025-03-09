import { createCookie } from "react-router";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { MessagingService } from "@/server/services/MessagingService";
import { eq, and } from "drizzle-orm";

// Create a verification cookie
const verificationCookie = createCookie("childcheckin-verification", {
	maxAge: 60 * 60 * 24, // 24 hours
	httpOnly: true,
	secure: process.env.NODE_ENV === "production",
	sameSite: "lax",
	path: "/",
});

// Store verification codes in memory
const verificationCodes = new Map();

class VerificationService {
	/**
	 * Create a verification session cookie
	 */
	async createVerificationSession(familyId: string, organizationId: string) {
		const cookieValue = {
			familyId,
			organizationId,
			verified: true,
			timestamp: Date.now(),
		};

		return await verificationCookie.serialize(cookieValue);
	}

	/**
	 * Get verification data from cookie
	 */
	async getVerificationFromCookie(request: Request) {
		const cookieHeader = request.headers.get("Cookie");
		if (!cookieHeader) return null;

		try {
			const cookieValue = await verificationCookie.parse(cookieHeader);
			if (!cookieValue) return null;

			// Check if the verification is still valid (24 hours)
			const now = Date.now();
			const timestamp = cookieValue.timestamp || 0;
			if (now - timestamp > 24 * 60 * 60 * 1000) return null;

			return cookieValue;
		} catch (error) {
			console.error("Error parsing verification cookie:", error);
			return null;
		}
	}

	/**
	 * Get or create a system user for tracking
	 */
	async getSystemUser(organizationId: string) {
		try {
			// Try to find an existing system user
			const systemUser = await db.query.users.findFirst({
				where: and(
					eq(users.churchOrganizationId, organizationId),
					eq(users.email, "system@thegreatcommission.org"),
				),
			});

			// If found, return it
			if (systemUser) {
				return systemUser;
			}

			// Otherwise, create a new system user
			const result = await db
				.insert(users)
				.values({
					firstName: "System",
					lastName: "User",
					email: "system@thegreatcommission.org",
					churchOrganizationId: organizationId,
					updatedAt: new Date(),
				})
				.returning();

			return result[0];
		} catch (error) {
			console.error("Error getting/creating system user:", error);
			// Return a minimal user object if we can't create one
			return {
				id: "system",
				firstName: "System",
				lastName: "User",
				email: "system@thegreatcommission.org",
			};
		}
	}

	/**
	 * Generate a random 6-digit verification code
	 */
	generateVerificationCode() {
		return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
	}

	/**
	 * Store a verification code with expiration
	 */
	storeVerificationCode(phone: string, organizationId: string) {
		const code = this.generateVerificationCode();
		const expiration = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiration

		const key = `${phone}-${organizationId}`;
		verificationCodes.set(key, {
			code,
			expiration,
			attempts: 0,
		});

		return code;
	}

	/**
	 * Verify a code
	 */
	verifyCode(phone: string, organizationId: string, inputCode: string) {
		const key = `${phone}-${organizationId}`;
		const storedData = verificationCodes.get(key);

		if (!storedData) {
			return { valid: false, reason: "No verification code found" };
		}

		if (new Date() > storedData.expiration) {
			verificationCodes.delete(key);
			return { valid: false, reason: "Verification code expired" };
		}

		// Increment attempts
		storedData.attempts += 1;
		verificationCodes.set(key, storedData);

		// Check if too many attempts
		if (storedData.attempts > 5) {
			verificationCodes.delete(key);
			return { valid: false, reason: "Too many failed attempts" };
		}

		// Check if code matches
		if (storedData.code !== inputCode) {
			return { valid: false, reason: "Invalid verification code" };
		}

		// Code is valid, remove it from storage
		verificationCodes.delete(key);
		return { valid: true };
	}

	/**
	 * Send verification code via SMS
	 */
	async sendVerificationCodeSMS(
		phone: string,
		code: string,
		organizationId: string,
		organizationName: string,
	) {
		try {
			// Get the system user for tracking
			const systemUser = await this.getSystemUser(organizationId);

			// Create message content
			const message = `Your verification code for ${organizationName} Child Check-in is: ${code}`;

			// Send SMS via MessagingService
			const result = await MessagingService.sendSMS(
				{
					churchOrganizationId: organizationId,
					messageType: "sms",
					message,
					senderUserId: systemUser.id, // Use system user ID for tracking
				},
				{
					phone,
					// No user ID needed for public check-in
					preferences: {
						// Override preferences for verification codes
						smsNotifications: true,
					},
				},
				organizationName,
			);

			console.log(`SMS sent to ${phone}: ${result.success}`);
			return result.success;
		} catch (error) {
			console.error("Error sending verification SMS:", error);
			return false;
		}
	}
}

export const verificationService = new VerificationService();
