import type {
	users,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";

type Permission = `${string}.${string}`;

export class AuthorizationService {
	private user: typeof users.$inferSelect;
	private roles: Array<typeof organizationRoles.$inferSelect>;
	private userToRoles: Array<typeof usersToOrganizationRoles.$inferSelect>;

	constructor(
		user: typeof users.$inferSelect,
		roles: Array<typeof organizationRoles.$inferSelect>,
		userToRoles: Array<typeof usersToOrganizationRoles.$inferSelect>,
	) {
		this.user = user;
		this.roles = roles;
		this.userToRoles = userToRoles;
	}

	hasPermission(permission: Permission, organizationId: string): boolean {
		// Get all roles for the user in this organization
		const userRolesForOrg = this.userToRoles.filter(
			(utr) =>
				utr.churchOrganizationId === organizationId &&
				utr.userId === this.user.id,
		);

		// Get the actual role objects
		const userRoles = this.roles.filter((role) =>
			userRolesForOrg.some((utr) => utr.organizationRoleId === role.id),
		);

		// Check if any of the user's roles have the required permission
		return userRoles.some((role) => role.permissions?.includes(permission));
	}

	hasAnyPermission(permissions: Permission[], organizationId: string): boolean {
		return permissions.some((permission) =>
			this.hasPermission(permission, organizationId),
		);
	}

	hasAllPermissions(
		permissions: Permission[],
		organizationId: string,
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
		return this.hasPermission("members.update", organizationId);
	}

	canDeleteMembers(organizationId: string): boolean {
		return this.hasPermission("members.delete", organizationId);
	}

	canAssignMembers(organizationId: string): boolean {
		return this.hasPermission("members.assign", organizationId);
	}

	// Helper method to check if user has admin role
	isAdmin(organizationId: string): boolean {
		console.log("isAdmin check input:", {
			organizationId,
			userId: this.user.id,
			allUserToRoles: this.userToRoles.map((utr) => ({
				userId: utr.userId,
				orgId: utr.churchOrganizationId,
				roleId: utr.organizationRoleId,
			})),
		});

		// Get all roles for the user in this organization
		const userRolesForOrg = this.userToRoles.filter(
			(utr) =>
				utr.churchOrganizationId === organizationId &&
				utr.userId === this.user.id,
		);
		console.log("userRolesForOrg", userRolesForOrg);

		// Get the actual role objects
		const userRoles = this.roles.filter((role) =>
			userRolesForOrg.some((utr) => utr.organizationRoleId === role.id),
		);
		console.log("userRoles", userRoles);

		// Check if the user has the admin role
		const isAdmin = userRoles.some(
			(role) =>
				role.name === "Admin" && role.churchOrganizationId === organizationId,
		);
		console.log("isAdmin check result:", {
			organizationId,
			hasAdminRole: isAdmin,
			roles: userRoles.map((r) => ({
				id: r.id,
				name: r.name,
				orgId: r.churchOrganizationId,
			})),
			allRoles: this.roles.map((r) => ({
				id: r.id,
				name: r.name,
				orgId: r.churchOrganizationId,
			})),
		});
		return isAdmin;
	}
}
