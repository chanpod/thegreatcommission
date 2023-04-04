import { CheckIcon, StopIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization, OrganizationMemberShipRequest } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Card } from "flowbite-react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";

import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import { InvitationStatus, InvitationTypes } from "~/src/types/invitation.types";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
        include: {
            missions: true,
            admins: true,
            members: true,
            associations: true,
            organizationMembershipRequest: {
                include: {
                    requestingChurchOrganization: true,
                },
                where: {
                    status: InvitationStatus.pending,
                },
            },
        },
    });

    return json({
        organization,
    });
};

const Request = () => {
    const loaderData = useLoaderData();

    const acceptFetcher = useFetcher();

    function acceptRequest(orgId: string, invitationId: string) {
        acceptFetcher.submit(
            {
                orgId: orgId,
                parentOrgId: loaderData.organization?.id,
                invitationId: invitationId,
                type: InvitationTypes.Organization,
            },
            {
                method: "post",
                action: `/api/invitation/accept`,
            }
        );
    }

    function rejectRequest(orgId: string, invitationId: string) {
        acceptFetcher.submit(
            {
                orgId: orgId,
                parentOrgId: loaderData.organization?.id,
                invitationId: invitationId,
                type: InvitationTypes.Organization,
            },
            {
                method: "post",
                action: `/api/invitation/reject`,
            }
        );
    }

    return (
        <div className="flex-col">
            <span className="text-3xl">{loaderData.organization?.organizationMembershipRequest.length} Request</span>

            <div className="flex flex-col">
                <List>
                    {loaderData.organization?.organizationMembershipRequest.map(
                        (request: OrganizationMemberShipRequest) => {
                            const organization: ChurchOrganization =
                                request.requestingChurchOrganization as ChurchOrganization;
                            return (
                                <Card key={request.id}>
                                    <Row >
                                        <div className="flex justify-between items-center">
                                            <div className="flex flex-col">
                                                <span>
                                                    {organization.name} - {organization.city} {organization.state}
                                                </span>
                                                <span>
                                                    Submitted: {format(new Date(request.createdAt), "MM-dd-yyyy")}
                                                </span>
                                            </div>
                                        </div>
                                    </Row>
                                    <div className="flex space-x-2">
                                        <Button
                                            color="success"
                                            onClick={() => acceptRequest(organization.id, request.id)}
                                            className="btn btn-primary"
                                        >
                                            <CheckIcon className="w-5 h-5" />
                                        </Button>
                                        <Button
                                            color="red"
                                            onClick={() => rejectRequest(organization.id, request.id)}
                                            className="btn btn-primary"
                                        >
                                            <XCircleIcon className="w-5 h-5" />
                                        </Button>
                                    </div>
                                </Card>
                            );
                        }
                    )}
                </List>
            </div>
        </div>
    );
};

export default Request;
