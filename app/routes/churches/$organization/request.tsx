import { CheckIcon, StopIcon, XCircleIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization, OrganizationMemberShipRequest } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Card } from "flowbite-react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";
import OrgRequestCard from "~/src/components/forms/cards/OrgRequestCard";

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
                            return (
                                <OrgRequestCard
                                    key={request.id}
                                    request={request}
                                    acceptRequest={acceptRequest}
                                    rejectRequest={rejectRequest}
                                />
                            );
                        }
                    )}
                </List>
            </div>
        </div>
    );
};

export default Request;
