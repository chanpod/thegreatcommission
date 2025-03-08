import { db } from "@/server/db/dbConnection";
import { messageTracker } from "@/server/db/schema";
import { eq, gte, lte, desc, sql, count } from "drizzle-orm";

// Define cost per message type (in cents)
const MESSAGE_COSTS = {
	sms: 1, // $0.01 per SMS
	phone: 10, // $0.10 per phone call
	email: 0.5, // $0.005 per email - not used anymore as we don't track emails
};

// Interface for message tracking data
export interface MessageTrackingData {
	churchOrganizationId: string;
	messageType: "sms" | "phone" | "email";
	recipientId?: string;
	recipientPhone?: string;
	recipientEmail?: string;
	sentByUserId?: string;
	messageContent?: string;
	messageSubject?: string;
	messageLength?: number;
	callDuration?: number;
	status?: string;
	providerMessageId?: string;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class MessageTrackerService {
	/**
	 * Tracks a message sent through the system
	 * @param data Message tracking data
	 * @returns The tracked message record
	 */
	static async trackMessage(data: MessageTrackingData) {
		// Skip tracking for email messages
		if (data.messageType === "email") {
			console.log("Skipping tracking for email message");
			return null;
		}

		// Calculate cost based on message type
		const cost = MESSAGE_COSTS[data.messageType] || 0;

		// For SMS, adjust cost based on message length if provided
		let finalCost = cost;
		if (data.messageType === "sms" && data.messageLength) {
			// Calculate SMS segments (1 segment = 160 chars)
			const segments = Math.ceil(data.messageLength / 160);
			finalCost = cost * segments;
		}

		// For phone calls, adjust cost based on duration if provided
		if (data.messageType === "phone" && data.callDuration) {
			// Calculate cost per minute (rounded up)
			const minutes = Math.ceil(data.callDuration / 60);
			finalCost = cost * minutes;
		}

		// Insert tracking record
		const result = await db
			.insert(messageTracker)
			.values({
				churchOrganizationId: data.churchOrganizationId,
				messageType: data.messageType,
				recipientId: data.recipientId,
				recipientPhone: data.recipientPhone,
				recipientEmail: data.recipientEmail,
				sentByUserId: data.sentByUserId,
				messageContent: data.messageContent,
				messageSubject: data.messageSubject,
				messageLength: data.messageLength,
				callDuration: data.callDuration,
				status: data.status || "sent",
				providerMessageId: data.providerMessageId,
				cost: finalCost,
				updatedAt: new Date(),
				sentAt: new Date(), // Add sentAt field which is required
			})
			.returning();

		return result[0];
	}

	/**
	 * Get usage statistics for an organization
	 * @param organizationId The church organization ID
	 * @param startDate Optional start date for filtering
	 * @param endDate Optional end date for filtering
	 */
	static async getUsageStats(
		organizationId: string,
		startDate?: Date,
		endDate?: Date,
	) {
		// Base query filters by organization
		let query = db
			.select({
				messageType: messageTracker.messageType,
				count: count(),
				totalCost: sql`SUM(${messageTracker.cost})`.mapWith(Number),
			})
			.from(messageTracker)
			.where(eq(messageTracker.churchOrganizationId, organizationId))
			.groupBy(messageTracker.messageType);

		// Add date filters if provided
		if (startDate) {
			query = query.where(gte(messageTracker.sentAt, startDate));
		}

		if (endDate) {
			query = query.where(lte(messageTracker.sentAt, endDate));
		}

		const results = await query;

		// Calculate totals
		const totalMessages = results.reduce(
			(sum, item) => sum + Number(item.count),
			0,
		);
		const totalCost = results.reduce(
			(sum, item) => sum + (item.totalCost || 0),
			0,
		);

		return {
			messageTypes: results,
			totalMessages,
			totalCost: totalCost / 100, // Convert cents to dollars
		};
	}

	/**
	 * Get detailed message history
	 * @param organizationId The church organization ID
	 * @param limit Maximum number of records to return
	 * @param offset Offset for pagination
	 */
	static async getMessageHistory(
		organizationId: string,
		limit = 100,
		offset = 0,
	) {
		const messages = await db
			.select()
			.from(messageTracker)
			.where(eq(messageTracker.churchOrganizationId, organizationId))
			.orderBy(desc(messageTracker.sentAt))
			.limit(limit)
			.offset(offset);

		const totalCount = await db
			.select({ count: count() })
			.from(messageTracker)
			.where(eq(messageTracker.churchOrganizationId, organizationId));

		return {
			messages,
			totalCount: totalCount[0].count,
		};
	}
}
