import { OrganizationMemberShipRequest } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { prismaClient } from "~/server/dbConnection";
import { InvitationTypes } from "~/src/types/invitation.types";

export const loader = async ({ request, params }: LoaderArgs) => {
    const invitation = await prismaClient.organizationMemberShipRequest.findMany({
        where: {
            requestingChurchOrganizationId: "640d49474bb6597e7979093e",
            parentOrganizationId: "640cec0ff147bd38e751244a",
        },
    });

    if (invitation.length == 1) {
        console.log("Record exists and unique constraint is enforced");
    } else {
        console.log("Record does not exist or unique constraint is not enforced");
    }

    return json({
        length: invitation.length,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    const formData = await request.formData();
    const invitationType = formData.get("type") as InvitationTypes;

    if (invitationType === InvitationTypes.Organization) {
        const invitationRequest: Partial<OrganizationMemberShipRequest> = {
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
            return json({
                success: false,
                message: "Active invitation already exist",
            });
        }

        const response = await prismaClient.organizationMemberShipRequest.create({
            data: {
                requestingChurchOrganization: {
                    connect: { id: invitationRequest.requestingChurchOrganizationId },
                },
                parentOrganization: {
                    connect: { id: invitationRequest.parentOrganizationId },
                },
            },
        });

        return json({
            success: true,
            response,
        });
    }

    throw new Error("Invalid invitation type");
};
