import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { CheckCircleIcon, QuestionMarkCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";
import { ChurchOrganization, OrganizationMemberShipRequest } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Tabs } from "flowbite-react";
import React, { useState } from "react";
import { prismaClient } from "~/server/dbConnection";
import EmptyAvatar from "~/src/components/avatar/EmptyAvatar";
import OrgRequestCard from "~/src/components/forms/cards/OrgRequestCard";
import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";
import OrganizationListItem from "~/src/components/listItems/components/OrganizationListItem";
import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import { InvitationStatus, InvitationTypes } from "~/src/types/invitation.types";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
        include: {
            associations: true,
            parentOrganization: true,
        },
    });

    const organizations = await prismaClient.churchOrganization.findMany({
        where: {
            id: {
                not: params.organization,
            },
            AND: {
                NOT: {
                    organizationMembershipRequest: {
                        some: {
                            requestingChurchOrganizationId: params.organization,
                            OR: [
                                {
                                    status: InvitationStatus.accepted,
                                },
                                {
                                    status: InvitationStatus.pending,
                                },
                            ],
                        },
                    },
                },
            },
        },
    });

    const previousRequest = await prismaClient.organizationMemberShipRequest.findMany({
        where: {
            requestingChurchOrganizationId: params.organization,
        },
        include: {
            requestingChurchOrganization: true,
            parentOrganization: true,
        },
        orderBy: {
            createdAt: "desc",
        },
    });

    // const previousRequest = await prismaClient.churchOrganization.findMany({
    //     where: {
    //         organizationMembershipRequest: {
    //             some: {
    //                 requestingChurchOrganizationId: params.organization,
    //                 AND: {
    //                     status: {
    //                        not: InvitationStatus.accepted,
    //                     },
    //                 },
    //             },
    //         },
    //     },
    //     include: {
    //         organizationMembershipRequest: true,
    //     },
    // });

    return json({
        requestingOrg: organization,
        previousRequest,
        organizations,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    const form = await request.formData();

    if (request.method === "POST") {
        const orgId = JSON.parse(form.get("orgId") as string);
        const parentOrgId = form.get("parentOrgId") as string;

        if (orgId === parentOrgId) {
            throw new Error("Cannot associate with self");
        }

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: parentOrgId,
            },
            data: {
                associations: {
                    connect: {
                        id: orgId,
                    },
                },
            },
        });

        return json({ success: true, response });
    } else if (request.method === "DELETE") {
        const orgId = form.get("orgId") as string;
        const parentOrgId = form.get("parentOrgId") as string;

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: parentOrgId,
            },
            data: {
                associations: {
                    disconnect: {
                        id: orgId,
                    },
                },
            },
        });

        return json({ success: true, response });
    }

    throw new Error("Method not allowed");
};

const AssociateChurch = () => {
    const loaderData = useLoaderData();
    const addOrgFetcher = useFetcher();
    const leaveOrgFetcher = useFetcher();
    const [activeFilter, setActiveFilter] = useState(InvitationStatus.accepted);

    function associateOrg(org: ChurchOrganization) {
        addOrgFetcher.submit(
            {
                requestingChurchOrganizationId: loaderData.requestingOrg.id,
                parentOrganizationId: org.id,
                type: InvitationTypes.Organization,
            },
            {
                method: "post",
                action: `/api/invitation`,
            }
        );
    }

    function leaveOrganization() {
        leaveOrgFetcher.submit(
            {
                orgId: loaderData.requestingOrg.id,
                parentOrgId: loaderData.requestingOrg.parentOrganization.id,
            },
            {
                method: "delete",
            }
        );
    }

    function currentOrganizations() {
        return loaderData.requestingOrg?.parentOrganization && (
            <div>
                <ChurchRowCard church={loaderData.requestingOrg?.parentOrganization} />
                <Button onClick={() => leaveOrganization()} className="bg-red">
                    Leave Org{" "}
                </Button>
            </div>
        );
    }

    function request() {
        const acceptedActive = activeFilter === InvitationStatus.accepted;
        const pendingActive = activeFilter === InvitationStatus.pending;
        const declinedActive = activeFilter === InvitationStatus.declined;
        return (
            <>
                {/* <div className="inline-flex rounded-md shadow-sm" role="group">
                    <button
                        type="button"
                        onClick={() => setActiveFilter(InvitationStatus.accepted)}
                        className={`${
                            acceptedActive ? "active" : "bg-white text-gray-900 "
                        } inline-flex items-center px-4 py-2 text-sm font-medium   border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white`}
                    >
                        <CheckCircleIcon className={`w-6 h-6 ${acceptedActive ? 'text-white' : 'text-green-500'}`} />
                        Accepted
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveFilter(InvitationStatus.pending)}
                        className={`${
                            pendingActive ? "bg-blue-500" : "bg-white"
                        } inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900  border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white`}
                    >
                        <QuestionMarkCircleIcon className="w-6 h-6 text-yellow-300" />
                        Pending
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveFilter(InvitationStatus.declined)}
                        className={`${
                            declinedActive ? "bg-blue-500" : "bg-white"
                        } inline-flex items-center px-4 py-2 text-sm font-medium text-gray-900  border border-gray-200 rounded-l-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:text-white dark:hover:bg-gray-600 dark:focus:ring-blue-500 dark:focus:text-white`}
                    >
                        <XCircleIcon className="w-6 h-6 text-red-500" />
                        Declined
                    </button>
                </div> */}
                <List>
                    {loaderData?.previousRequest?.map((request: OrganizationMemberShipRequest) => {
                        let bgColor = "";
                        switch (request.status) {
                            case InvitationStatus.pending:
                                bgColor = "bg-yellow-400";
                                break;
                            case InvitationStatus.accepted:
                                bgColor = "bg-green-800";
                                break;
                            case InvitationStatus.declined:
                                bgColor = "bg-red-800";
                                break;
                        }

                        return (
                            <div key={request.id}>
                                <OrgRequestCard request={request} showStatus />
                                {/* <Row className={bgColor}>
                                    <RowItem>
                                        <Link to={`/churches/${request.parentOrganization.id}`}>
                                            <OrganizationListItem
                                                church={request.parentOrganization}
                                            ></OrganizationListItem>
                                        </Link>

                                        {format(new Date(request.createdAt), "MM-dd-yyyy")}
                                    </RowItem>

                                    <RowItem>{request.status}</RowItem>
                                </Row> */}
                            </div>
                        );
                    })}
                </List>
            </>
        );
    }

    function makeNewRequest() {
        return (
            <List>
                {loaderData?.organizations?.map((church: ChurchOrganization) => {
                    return (
                        <div key={church.id} className="">
                            <ChurchRowCard church={church} />

                            <Button className="ml-2" onClick={() => associateOrg(church)}>
                                Request to join organization
                            </Button>
                        </div>
                    );
                })}
            </List>
        );
    }

    return (
        <div className="space-y-3">
            <h1 className="text-3xl">Associate</h1>
            <Tabs.Group aria-label="Tabs with underline" style="underline">
                <Tabs.Item title="Current Parent Organization">{currentOrganizations()}</Tabs.Item>
                <Tabs.Item title="Make New Request">{makeNewRequest()}</Tabs.Item>
                <Tabs.Item title="Previous Request">{request()}</Tabs.Item>
            </Tabs.Group>
        </div>
    );
};

export default AssociateChurch;
