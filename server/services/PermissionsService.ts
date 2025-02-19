import type { User } from "~/types/user";
import { DefaultDatabaseClient } from "../dataServices/DefaultDatabaseClient";
import { UserRolesDataService } from "../dataServices/UserRolesDataService";
import { OrganizationRolesDataService } from "../dataServices/OrganizationRolesDataService";
import { AuthorizationService } from "~/services/AuthorizationService";
import type { DatabaseClient } from "../dataServices/types";

export interface PermissionSet {
	canAdd: boolean;
	canEdit: boolean;
	canDelete: boolean;
	canAssign: boolean;
	canMessage?: boolean;
	canView?: boolean;
	[key: string]: boolean | undefined;
}

export class PermissionsService {
	private dbClient: DatabaseClient;
	private userRolesService: UserRolesDataService;
	private orgRolesService: OrganizationRolesDataService;

	constructor(dbClient?: DatabaseClient) {
		this.dbClient = dbClient || new DefaultDatabaseClient();
		this.userRolesService = new UserRolesDataService(this.dbClient);
		this.orgRolesService = new OrganizationRolesDataService(this.dbClient);
	}

	async getOrganizationPermissions(
		userId: string,
		organizationId: string,
	): Promise<PermissionSet> {
		const { authService } = await this.getAuthWithUserData(
			userId,
			organizationId,
		);

		return {
			canAdd: authService.hasPermission("organization.create", organizationId),
			canEdit: authService.hasPermission("organization.edit", organizationId),
			canDelete: authService.hasPermission(
				"organization.delete",
				organizationId,
			),
			canView: true,
			canAssign: authService.hasPermission(
				"organization.assign",
				organizationId,
			),
			canMessage: authService.hasPermission("members.message", organizationId),
		};
	}

	/**
	 * Get member-related permissions for a user in an organization
	 */
	async getMemberPermissions(
		userId: string,
		organizationId: string,
	): Promise<PermissionSet> {
		const { authService } = await this.getAuthWithUserData(
			userId,
			organizationId,
		);

		// Return permissions
		return {
			canAdd: authService.canAddMembers(organizationId),
			canEdit: authService.canEditMembers(organizationId),
			canDelete: authService.canDeleteMembers(organizationId),
			canAssign: authService.canAssignMembers(organizationId),
			canMessage: authService.canMessageMembers(organizationId),
		};
	}

	/**
	 * Get team-related permissions for a user in an organization
	 */
	async getTeamPermissions(
		userId: string,
		organizationId: string,
	): Promise<PermissionSet> {
		const { authService } = await this.getAuthWithUserData(
			userId,
			organizationId,
		);
		return {
			canAdd: authService.hasPermission("teams.create", organizationId),
			canEdit: authService.hasPermission("teams.edit", organizationId),
			canDelete: authService.hasPermission("teams.delete", organizationId),
			canAssign: authService.hasPermission("teams.assign", organizationId),
			canView: authService.hasPermission("teams.view", organizationId),
		};
	}

	/**
	 * Get event-related permissions for a user in an organization
	 */
	async getEventPermissions(
		userId: string,
		organizationId: string,
	): Promise<PermissionSet> {
		const { authService } = await this.getAuthWithUserData(
			userId,
			organizationId,
		);

		return {
			canAdd: authService.hasPermission("events.create", organizationId),
			canEdit: authService.hasPermission("events.edit", organizationId),
			canDelete: authService.hasPermission("events.delete", organizationId),
			canView: authService.hasPermission("events.view", organizationId),
			canAssign: authService.hasPermission("events.assign", organizationId),
		};
	}

	async getAuthWithUserData(userId: string, organizationId: string) {
		const [
			{ siteRoles, userToSiteRoles },
			{ organizationRoles: orgRoles, userToOrgRoles },
		] = await Promise.all([
			this.userRolesService.getUserSiteRoles(userId),
			this.orgRolesService.getOrganizationRoles(organizationId),
		]);

		// Create authorization service
		const authService = new AuthorizationService(
			{ id: userId } as User,
			siteRoles,
			userToSiteRoles,
			orgRoles,
			userToOrgRoles,
		);

		return {
			authService,
			siteRoles,
			userToSiteRoles,
			orgRoles,
			userToOrgRoles,
		};
	}

	/**
	 * Get role-related permissions for a user in an organization
	 */
	async getRolePermissions(
		userId: string,
		organizationId: string,
	): Promise<PermissionSet> {
		const { authService, userToOrgRoles } = await this.getAuthWithUserData(
			userId,
			organizationId,
		);

		return {
			canAdd: authService.hasPermission("roles.create", organizationId),
			canEdit: authService.hasPermission("roles.edit", organizationId),
			canDelete: authService.hasPermission("roles.delete", organizationId),
			canAssign: authService.hasPermission("roles.assign", organizationId),
			canView: authService.hasPermission("roles.view", organizationId),
		};
	}
}
