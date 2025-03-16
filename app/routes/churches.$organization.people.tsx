import { useLocation, Link, Navigate } from "react-router";
import { createAuthLoader } from "~/server/auth/authLoader";
import { cn } from "~/lib/utils";
import { PermissionsService } from "@/server/services/PermissionsService";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const permissionsService = new PermissionsService();
		const permissions = await permissionsService.getOrganizationPermissions(
			userContext.user.id,
			params.organization,
		);

		return {
			permissions,
		};
	},
	true,
);

const PEOPLE_TABS = [
	{ name: "Members", href: "members" },
	{ name: "Teams", href: "teams" },
	{ name: "Roles", href: "roles" },
];

export default function PeoplePage() {
	const location = useLocation();
	const organizationId = location.pathname.split("/")[2];

	// Redirect to members page by default
	return <Navigate to={`/churches/${organizationId}/members`} replace />;
}
