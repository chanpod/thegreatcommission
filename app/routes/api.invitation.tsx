import { InvitationTypes } from "~/src/types/invitation.types";
import type { Route } from "./+types";
import { organizationMembershipRequest } from "server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "~/server/dbConnection";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const invitation = await db.select().from(organizationMembershipRequest).where(eq(organizationMembershipRequest.requestingChurchOrganizationId, "640d49474bb6597e7979093e")).where(eq(organizationMembershipRequest.parentOrganizationId, "640cec0ff147bd38e751244a"));

    if (invitation.length == 1) {
        console.log("Record exists and unique constraint is enforced");
    } else {
        console.log("Record does not exist or unique constraint is not enforced");
    }

    return {
        length: invitation.length,
    };
};

export const action = async ({ request, params }: ActionArgs) => {
    const formData = await request.formData();
    const invitationType = formData.get("type") as InvitationTypes;

    if (invitationType === InvitationTypes.Organization) {
        const invitationRequest: Partial<typeof organizationMembershipRequest> = {
            type: invitationType,
            requestingChurchOrganizationId: formData.get("requestingChurchOrganizationId") as string,
            parentOrganizationId: formData.get("parentOrganizationId") as string,
        };

        const existingInvitation = await prismaClient.organizationMemberShipRequest.findFirst({
            where: {
                AND: {
                    status: "pending",
                    requestingChurchOrganizationId: invitationRequest.requestingChurchOrganizationId as string,
                    parentOrganizationId: invitationRequest.parentOrganizationId as string,
                },
            },
        });

        console.log(existingInvitation)

        if (existingInvitation) {
            return {
                success: false,
                message: "Active invitation already exist",
            };
        }

        const response = await db.insert(organizationMembershipRequest).values({
            requestingChurchOrganizationId: invitationRequest.requestingChurchOrganizationId as string,
            parentOrganizationId: invitationRequest.parentOrganizationId as string,
            type: invitationType,
        });

        return {
            success: true,
            response,
        };
    }

    throw new Error("Invalid invitation type");
};
