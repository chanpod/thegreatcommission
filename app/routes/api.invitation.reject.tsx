import { db } from "~/server/dbConnection";
import { InvitationStatus, InvitationTypes } from "~/src/types/invitation.types";
import type { Route } from "./+types";
import { eq } from "drizzle-orm";
import { organizationMembershipRequest } from "server/db/schema";

export const action = async ({ request, params }: Route.ActionArgs) => {
    const formData = await request.formData();
    const invitationType = formData.get("type") as InvitationTypes;

    if (invitationType === InvitationTypes.Organization) {
        const orgId = formData.get("orgId") as string;
        const parentOrgId = formData.get("parentOrgId") as string;
        const invitationId = formData.get("invitationId") as string;

        const updateInvitation = await db.update(organizationMembershipRequest).set({
            status: InvitationStatus.declined,
        }).where(eq(organizationMembershipRequest.id, invitationId));

        return { success: true, response: updateInvitation };
    }

    throw new Error("Invalid invitation type");
};
