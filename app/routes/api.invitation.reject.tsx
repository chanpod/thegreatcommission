import { ActionArgs, json } from "@remix-run/node";
import { prismaClient } from "~/server/dbConnection";
import { InvitationStatus, InvitationTypes } from "~/src/types/invitation.types";

export const action = async ({ request, params }: ActionArgs) => {
    const formData = await request.formData();
    const invitationType = formData.get("type") as InvitationTypes;

    if (invitationType === InvitationTypes.Organization) {
        const orgId = formData.get("orgId") as string;
        const parentOrgId = formData.get("parentOrgId") as string;
        const invitationId = formData.get("invitationId") as string;

        const updateInvitation = await prismaClient.organizationMemberShipRequest.update({
            where: {
                id: invitationId,
            },
            data: {
                status: InvitationStatus.declined,
            },
        });

        return json({ success: true, response: updateInvitation });
    }

    throw new Error("Invalid invitation type");
};
