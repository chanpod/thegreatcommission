import { eq } from "drizzle-orm";
import { organizationRoles, usersToOrganizationRoles } from "../db/schema";
import type { Permission } from "~/lib/permissions";
import type { DatabaseClient } from "./types";
import { DefaultDatabaseClient } from "./DefaultDatabaseClient";

export class OrganizationRolesDataService {
	constructor(
		private readonly dbClient: DatabaseClient | undefined = undefined,
	) {
		this.dbClient = dbClient || new DefaultDatabaseClient();
	}

	/**
	 * Get all roles and user role assignments for an organization
	 */
	async getOrganizationRoles(organizationId: string) {
		const [orgRoles, userOrgRoles] = await Promise.all([
			this.dbClient.db
				.select()
				.from(organizationRoles)
				.where(eq(organizationRoles.churchOrganizationId, organizationId)),
			this.dbClient.db
				.select()
				.from(usersToOrganizationRoles)
				.where(
					eq(usersToOrganizationRoles.churchOrganizationId, organizationId),
				),
		]);

		return {
			organizationRoles: orgRoles,
			userToOrgRoles: userOrgRoles,
		};
	}

	/**
	 * Get all roles for an organization
	 */
	async getAllOrganizationRoles(organizationId: string) {
		return this.dbClient.db
			.select()
			.from(organizationRoles)
			.where(eq(organizationRoles.churchOrganizationId, organizationId));
	}

	/**
	 * Get user's role assignments for an organization
	 */
	async getUserOrganizationRoles(userId: string, organizationId: string) {
		return this.dbClient.db
			.select()
			.from(usersToOrganizationRoles)
			.where(eq(usersToOrganizationRoles.userId, userId))
			.where(eq(usersToOrganizationRoles.churchOrganizationId, organizationId));
	}

	/**
	 * Check if a user has a specific role in an organization
	 */
	async hasRole(userId: string, organizationId: string, roleName: string) {
		const userRoles = await this.dbClient.db
			.select()
			.from(usersToOrganizationRoles)
			.innerJoin(
				organizationRoles,
				eq(organizationRoles.id, usersToOrganizationRoles.organizationRoleId),
			)
			.where(eq(usersToOrganizationRoles.userId, userId))
			.where(eq(usersToOrganizationRoles.churchOrganizationId, organizationId))
			.where(eq(organizationRoles.name, roleName));

		return userRoles.length > 0;
	}

	/**
	 * Check if a user has a specific permission in an organization
	 */
	async hasPermission(
		userId: string,
		organizationId: string,
		permission: Permission,
	) {
		const userRoles = await this.dbClient.db
			.select()
			.from(usersToOrganizationRoles)
			.innerJoin(
				organizationRoles,
				eq(organizationRoles.id, usersToOrganizationRoles.organizationRoleId),
			)
			.where(eq(usersToOrganizationRoles.userId, userId))
			.where(eq(usersToOrganizationRoles.churchOrganizationId, organizationId));

		return userRoles.some((role) =>
			role.organization_roles.permissions?.includes(permission),
		);
	}

	/**
	 * Get default roles for an organization
	 */
	async getDefaultRoles(organizationId: string) {
		return this.dbClient.db
			.select()
			.from(organizationRoles)
			.where(eq(organizationRoles.churchOrganizationId, organizationId))
			.where(eq(organizationRoles.isDefault, true));
	}

	/**
	 * Get admin role for an organization
	 */
	async getAdminRole(organizationId: string) {
		const adminRole = await this.dbClient.db
			.select()
			.from(organizationRoles)
			.where(eq(organizationRoles.churchOrganizationId, organizationId))
			.where(eq(organizationRoles.name, "Admin"))
			.limit(1);

		return adminRole[0];
	}
}
