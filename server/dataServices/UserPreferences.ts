import { eq } from "drizzle-orm";
import { db } from "@/server/db/dbConnection";
import { userPreferences } from "../db/schema";

export async function getUserPreferences(userId: string) {
	const userPreferencesResponse = await db
		.select()
		.from(userPreferences)
		.where(eq(userPreferences.userId, userId))
		.then((res) => res[0]);

	return userPreferencesResponse;
}

export async function updateUserPreferences(
	userId: string,
	userPreferencesIn: typeof userPreferences,
) {
	const userPreferencesData = {
		...userPreferencesIn,
		emailNotifications: userPreferencesIn.emailNotifications || false,
		smsNotifications: userPreferencesIn.smsNotifications || false,
		phoneNotifications: userPreferencesIn.phoneNotifications || false,
		emailFrequency: userPreferencesIn.emailFrequency || "daily",
		smsFrequency: userPreferencesIn.smsFrequency || "daily",
		phoneFrequency: userPreferencesIn.phoneFrequency || "weekly",
	} as typeof userPreferences;

	const userPreferencesResponse = await db
		.insert(userPreferences)
		.values({ ...userPreferencesData, userId, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: userPreferences.userId,
			set: userPreferencesData,
		});
	return userPreferencesResponse;
}
