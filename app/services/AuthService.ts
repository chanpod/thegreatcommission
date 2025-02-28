import {
	createClerkClient,
	type AuthObject,
} from "@clerk/react-router/api.server";

import { db } from "~/server/dbConnection";
import {
	organizationRoles,
	roles,
	users,
	usersToOrganizationRoles,
	usersToRoles,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { getUser } from "@/server/dataServices/UserDataService";

export interface AuthenticatedUser {
	user: Awaited<ReturnType<typeof getUser>>["users"];
	siteRoles: Array<typeof roles.$inferSelect>;
	userToSiteRoles: Array<typeof usersToRoles.$inferSelect>;
	organizationRoles: Array<typeof organizationRoles.$inferSelect>;
	userToOrgRoles: Array<typeof usersToOrganizationRoles.$inferSelect>;
}

// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class AuthService {
	static async getAuthenticatedUser(
		auth: AuthObject,
	): Promise<AuthenticatedUser | null> {
		const { userId: clerkUserId } = auth;
		if (!clerkUserId) return null;

		try {
			console.log("clerk secret key", process.env.CLERK_SECRET_KEY);
			console.log(
				"clerk publishable key",
				process.env.VITE_CLERK_PUBLISHABLE_KEY,
			);

			const clerkUser = await createClerkClient({
				secretKey: process.env.CLERK_SECRET_KEY,
				publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
			}).users.getUser(clerkUserId);

			const userEmail = clerkUser.emailAddresses[0].emailAddress;

			// Get user data with site-wide roles
			const getUserQuery = await getUser(userEmail, {
				roles: true,
				churches: false,
			});
			console.log("getUserQuery", getUserQuery);
			let user = getUserQuery?.users;

			// If user doesn't exist in our database, create a new user
			if (!user) {
				console.log("Creating new user for first-time login:", userEmail);

				// Extract user info from Clerk
				const firstName = clerkUser.firstName || "";
				const lastName = clerkUser.lastName || "";
				const imageUrl = clerkUser.imageUrl;

				// Create the new user in our database
				const newUsers = await db
					.insert(users)
					.values({
						email: userEmail,
						firstName,
						lastName,
						avatarUrl: imageUrl,
					})
					.returning();

				if (newUsers && newUsers.length > 0) {
					user = newUsers[0];
					console.log("Created new user:", user);
				} else {
					console.error("Failed to create new user");
					return null;
				}
			}

			console.log("getUserQuery", getUserQuery);

			const userId = user.id;

			// Get all organization roles and user-to-role assignments
			const [allOrgRoles, userOrgRoles] = await Promise.all([
				db.select().from(organizationRoles),
				db
					.select()
					.from(usersToOrganizationRoles)
					.where(eq(usersToOrganizationRoles.userId, userId)),
			]);

			// Get all site-wide roles and user-to-role assignments
			const [allSiteRoles, userSiteRoles] = await Promise.all([
				db.select().from(roles),
				db.select().from(usersToRoles).where(eq(usersToRoles.userId, userId)),
			]);

			return {
				user,
				siteRoles: allSiteRoles,
				userToSiteRoles: userSiteRoles,
				organizationRoles: allOrgRoles,
				userToOrgRoles: userOrgRoles,
			};
		} catch (error) {
			console.error("Error getting authenticated user:", error);
			return null;
		}
	}

	static async requireAuth(auth: AuthObject): Promise<AuthenticatedUser> {
		const user = await AuthService.getAuthenticatedUser(auth);
		if (!user) {
			throw new Response("Unauthorized", { status: 401 });
		}
		return user;
	}
}
