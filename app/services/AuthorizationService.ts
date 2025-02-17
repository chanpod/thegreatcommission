import type {
	users,
	organizationRoles,
	usersToOrganizationRoles,
	roles,
	usersToRoles,
} from "server/db/schema";

type Permission = `${string}.${string}`;

export class AuthorizationService {
	private user: typeof users.$inferSelect;
	private siteRoles: Array<typeof roles.$inferSelect>;
	private userToSiteRoles: Array<typeof usersToRoles.$inferSelect>;
	private organizationRoles: Array<typeof organizationRoles.$inferSelect>;
	private userToOrgRoles: Array<typeof usersToOrganizationRoles.$inferSelect>;

	constructor(
		user: typeof users.$inferSelect,
		siteRoles: Array<typeof roles.$inferSelect>,
		userToSiteRoles: Array<typeof usersToRoles.$inferSelect>,
		organizationRolesIn: Array<typeof organizationRoles.$inferSelect>,
		userToOrgRolesIn: Array<typeof usersToOrganizationRoles.$inferSelect>,
	) {
		this.user = user;
		this.siteRoles = siteRoles ?? [];
		this.userToSiteRoles = userToSiteRoles ?? [];
		this.organizationRoles = organizationRolesIn ?? [];
		this.userToOrgRoles = userToOrgRolesIn ?? [];
	}

	private hasSitePermission(permission: Permission): boolean {
		// Get all site-wide roles for the user
		const userSiteRoles = this.siteRoles.filter((role) =>
			this.userToSiteRoles.some(
				(utr) => utr.roleId === role.id && utr.userId === this.user.id,
			),
		);

		// Check if any of the user's site roles have the required permission
		return userSiteRoles.some((role) => role.permissions?.includes(permission));
	}

	private hasOrganizationPermission(
		permission: Permission,
		organizationId: string,
	): boolean {
		// Get all roles for the user in this organization
		const userRolesForOrg = this.userToOrgRoles.filter(
			(utr) =>
				utr.churchOrganizationId === organizationId &&
				utr.userId === this.user.id,
		);

		// Get the actual role objects
		const userOrgRoles = this.organizationRoles.filter((role) =>
			userRolesForOrg.some((utr) => utr.organizationRoleId === role.id),
		);

		console.log("permissions", permission);

		// Check if any of the user's organization roles have the required permission
		return userOrgRoles.some((role) => role.permissions?.includes(permission));
	}

	hasPermission(permission: Permission, organizationId?: string): boolean {
		// First check site-wide permissions
		if (this.hasSitePermission(permission)) {
			return true;
		}

		// If organizationId is provided, check organization-specific permissions
		if (organizationId) {
			return this.hasOrganizationPermission(permission, organizationId);
		}

		return false;
	}

	hasAnyPermission(
		permissions: Permission[],
		organizationId?: string,
	): boolean {
		return permissions.some((permission) =>
			this.hasPermission(permission, organizationId),
		);
	}

	hasAllPermissions(
		permissions: Permission[],
		organizationId?: string,
	): boolean {
		return permissions.every((permission) =>
			this.hasPermission(permission, organizationId),
		);
	}

	// Member management permission checks
	canViewMembers(organizationId: string): boolean {
		return this.hasPermission("members.view", organizationId);
	}

	canAddMembers(organizationId: string): boolean {
		return this.hasPermission("members.create", organizationId);
	}

	canEditMembers(organizationId: string): boolean {
		return this.hasPermission("members.edit", organizationId);
	}

	canDeleteMembers(organizationId: string): boolean {
		return this.hasPermission("members.delete", organizationId);
	}

	canAssignMembers(organizationId: string): boolean {
		return this.hasPermission("members.assign", organizationId);
	}

	canMessageMembers(organizationId: string): boolean {
		return this.hasPermission("members.message", organizationId);
	}

	// Helper method to check if user has admin role
	isAdmin(organizationId?: string): boolean {
		// Check for site-wide admin role first
		const isSiteAdmin = this.siteRoles.some(
			(role) =>
				role.name === "Admin" &&
				this.userToSiteRoles.some(
					(utr) => utr.roleId === role.id && utr.userId === this.user.id,
				),
		);

		if (isSiteAdmin) {
			return true;
		}

		// If organizationId is provided, check for organization admin
		if (organizationId) {
			const userRolesForOrg = this.userToOrgRoles.filter(
				(utr) =>
					utr.churchOrganizationId === organizationId &&
					utr.userId === this.user.id,
			);

			const userOrgRoles = this.organizationRoles.filter((role) =>
				userRolesForOrg.some((utr) => utr.organizationRoleId === role.id),
			);

			return userOrgRoles.some(
				(role) =>
					role.name === "Admin" && role.churchOrganizationId === organizationId,
			);
		}

		return false;
	}
}
