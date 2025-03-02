import { db } from "@/server/db/dbConnection";
import {
	InvitationStatus,
	InvitationTypes,
} from "~/src/types/invitation.types";
import type { Route } from "./+types";
import { eq } from "drizzle-orm";
import {
	churchOrganization,
	organizationMembershipRequest,
} from "server/db/schema";

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	const invitationType = formData.get("type") as InvitationTypes;

	if (invitationType === InvitationTypes.Organization) {
		const orgId = formData.get("orgId") as string;
		const parentOrgId = formData.get("parentOrgId") as string;
		const invitationId = formData.get("invitationId") as string;

		if (orgId === parentOrgId) {
			throw new Error("Cannot associate with self");
		}

		const response = await db
			.update(churchOrganization)
			.set({
				associations: {
					connect: {
						id: orgId,
					},
				},
			})
			.where(eq(churchOrganization.id, parentOrgId));

		const updateInvitation = await db
			.update(organizationMembershipRequest)
			.set({
				status: InvitationStatus.accepted,
			})
			.where(eq(organizationMembershipRequest.id, invitationId));

		return { success: true, response };
	}

	throw new Error("Invalid invitation type");
};
