


import { useState } from "react";
import { useFetcher, useLoaderData } from "react-router";
import { db } from "~/server/dbConnection";
import OrgRequestCard from "~/src/components/forms/cards/OrgRequestCard";
import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";
import List from "~/src/components/listItems/List";
import { InvitationStatus, InvitationTypes } from "~/src/types/invitation.types";
import type { Route } from "./+types";
import { churchOrganization, organizationMembershipRequest } from "server/db/schema";
import { and, eq, exists, not } from "drizzle-orm";
import { Button } from "~/components/ui/button";
import { Tabs, TabsTrigger } from "~/components/ui/tabs";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const organization = await db.select().from(churchOrganization)
                                          .where(eq(churchOrganization.id, params.organization))    
                                          .then(([organization]) => organization);


    return {
        requestingOrg: organization,  

    };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const form = await request.formData();

    if (request.method === "POST") {
        const orgId = JSON.parse(form.get("orgId") as string);
        const parentOrgId = form.get("parentOrgId") as string;

        if (orgId === parentOrgId) {
            throw new Error("Cannot associate with self");
        }

        const response = await db.update(churchOrganization).set({
            associations: {
                connect: {
                    id: orgId,
                },
            },
        }).where(eq(churchOrganization.id, parentOrgId));

        return { success: true, response };
    } else if (request.method === "DELETE") {
        const orgId = form.get("orgId") as string;
        const parentOrgId = form.get("parentOrgId") as string;

        const response = await db.update(churchOrganization).set({
            associations: {
                disconnect: {
                    id: orgId,
                },
            },
        }).where(eq(churchOrganization.id, parentOrgId));

        return { success: true, response };
    }

    throw new Error("Method not allowed");
};


const AssociateChurch = () => {
    const loaderData = useLoaderData();
    const addOrgFetcher = useFetcher();
    const leaveOrgFetcher = useFetcher();
    const [activeFilter, setActiveFilter] = useState(InvitationStatus.accepted);

    function associateOrg(org: typeof churchOrganization.$inferSelect) {
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
                    {loaderData?.previousRequest?.map((request: typeof organizationMembershipRequest.$inferSelect) => {
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
                {loaderData?.organizations?.map((church: typeof churchOrganization.$inferSelect) => {
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
            <Tabs aria-label="Tabs with underline" style="underline">
                <TabsTrigger value="current">Current Parent Organization</TabsTrigger>
                <TabsTrigger value="makeNewRequest">Make New Request</TabsTrigger>
                <TabsTrigger value="previousRequest">Previous Request</TabsTrigger>
            </Tabs>
            
        </div>
    );
};

export default AssociateChurch;
