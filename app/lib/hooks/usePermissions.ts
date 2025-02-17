import { useContext } from "react";
import { UserContext } from "~/src/providers/userProvider";
import { useParams } from "react-router";
import { AuthorizationService } from "~/services/AuthorizationService";
import type { Permission } from "~/lib/permissions";

export function usePermissions() {
	const {
		user,
		siteRoles,
		userToSiteRoles,
		organizationRoles,
		userToOrgRoles,
	} = useContext(UserContext);

	const hasPermission = (
		permission: Permission,
		organizationId?: string,
	): boolean => {
		if (!user) return false;

		const authService = new AuthorizationService(
			user,
			siteRoles ?? [],
			userToSiteRoles ?? [],
			organizationRoles ?? [],
			userToOrgRoles ?? [],
		);
		return authService.hasPermission(permission, organizationId);
	};

	return {
		hasPermission,
	};
}
