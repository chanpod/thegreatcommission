import { RolesEnum } from "~/src/types/roles.enum";
import type {
	roles,
	users,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";
import type { Role } from "~/schema/roles";
import { AuthorizationService } from "./AuthorizationService";

export class UserService {
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

	hasPermissionInOrganization(
		permission: string,
		organizationId: string,
	): boolean {
		const authService = new AuthorizationService(
			this.user,
			this.roles,
			this.userToRoles,
		);
		return authService.hasPermission(permission, organizationId);
	}

	isAdminInOrganization(organizationId: string): boolean {
		const authService = new AuthorizationService(
			this.user,
			this.roles,
			this.userToRoles,
		);
		return authService.isAdmin(organizationId);
	}

	// Helper methods for user data
	getFullName(): string {
		return `${this.user.firstName} ${this.user.lastName}`;
	}

	getEmail(): string {
		return this.user.email;
	}

	// Add more user-specific helper methods as needed
}
