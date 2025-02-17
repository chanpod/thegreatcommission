import { eq } from "drizzle-orm";
import { roles, usersToRoles } from "../db/schema";
import type { Permission } from "~/lib/permissions";
import type { DatabaseClient } from "./types";

export class UserRolesDataService {
	constructor(private readonly dbClient: DatabaseClient) {}

	/**
	 * Get all site-wide roles for a user
	 */
	async getUserSiteRoles(userId: string) {
		const [allSiteRoles, userSiteRoles] = await Promise.all([
			this.dbClient.db.select().from(roles),
			this.dbClient.db
				.select()
				.from(usersToRoles)
				.where(eq(usersToRoles.userId, userId)),
		]);

		return {
			siteRoles: allSiteRoles,
			userToSiteRoles: userSiteRoles,
		};
	}

	/**
	 * Get all site-wide roles
	 */
	async getAllSiteRoles() {
		return this.dbClient.db.select().from(roles);
	}

	/**
	 * Get user's site role assignments
	 */
	async getUserSiteRoleAssignments(userId: string) {
		return this.dbClient.db
			.select()
			.from(usersToRoles)
			.where(eq(usersToRoles.userId, userId));
	}

	/**
	 * Check if a user has a specific site-wide role by name
	 */
	async hasRole(userId: string, roleName: string) {
		const userRoles = await this.dbClient.db
			.select()
			.from(usersToRoles)
			.innerJoin(roles, eq(roles.id, usersToRoles.roleId))
			.where(eq(usersToRoles.userId, userId))
			.where(eq(roles.name, roleName));

		return userRoles.length > 0;
	}

	/**
	 * Check if a user has a specific site-wide permission
	 */
	async hasPermission(userId: string, permission: Permission) {
		const userRoles = await this.dbClient.db
			.select()
			.from(usersToRoles)
			.innerJoin(roles, eq(roles.id, usersToRoles.roleId))
			.where(eq(usersToRoles.userId, userId));

		return userRoles.some((role) =>
			role.roles.permissions?.includes(permission),
		);
	}
}
