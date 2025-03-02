import {
	organizationRoles,
	usersToOrganizationRoles,
	usersTochurchOrganization,
} from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { data } from "react-router";
import { createAuthLoader } from "~/server/auth/authLoader";
import { db } from "@/server/db/dbConnection";
import { AuthorizationService } from "~/services/AuthorizationService";

export const action = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext?.user;
		if (request.method === "DELETE") {
			// Get all roles for the organization
			const orgRoles = await db
				.select()
				.from(organizationRoles)
				.where(eq(organizationRoles.churchOrganizationId, params.organization));

			// Get user's role assignments
			const userRoleAssignments = await db
				.select()
				.from(usersToOrganizationRoles)
				.where(
					eq(
						usersToOrganizationRoles.churchOrganizationId,
						params.organization,
					),
				);

			// Create authorization service
			const authService = new AuthorizationService(
				user,
				orgRoles,
				userRoleAssignments,
			);

			// Check if user can delete members
			if (!authService.canDeleteMembers(params.organization)) {
				return data(
					{ message: "Unauthorized to delete members" },
					{ status: 403 },
				);
			}

			const response = await db
				.delete(usersTochurchOrganization)
				.where(eq(usersTochurchOrganization.userId, params.memberId));

			return {
				success: true,
			};
		}

		throw new Error("Invalid request method");
	},
	true,
);
