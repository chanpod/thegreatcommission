import { data, Link, Outlet, redirect, useActionData, useFetcher, useLoaderData, useLocation, useNavigate } from "react-router";

import { motion } from "framer-motion";
import { isNil, map } from "lodash-es";
import { Fragment, useContext, useEffect, useState } from "react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { ChurchService } from "~/services/ChurchService";

import List from "~/src/components/listItems/List";
import { MissionRowCard } from "~/src/components/listItems/components/MissionRowCard";
import { OrgAssociations } from "~/src/components/organizations/OrgAssociations";
import OrgDescription from "~/src/components/organizations/OrgDescription";
import UpdateToast from "~/src/components/toast/UpdateToast";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import { db } from "~/server/dbConnection";
import { churchOrganization, usersTochurchOrganization } from "server/db/schema";
import { aliasedTable, eq, and } from "drizzle-orm";
import type { Route } from "./+types";
import { ArrowRight as ArrowNarrowRightIcon } from "lucide-react";
import { ArrowLeft as ArrowLeftIcon } from "lucide-react";
import { Pencil as PencilIcon } from "lucide-react";
import { Trash as TrashIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { UserContext } from "~/src/providers/userProvider";
import { NoData } from "~/components/ui/no-data";
import { PageLayout } from "~/src/components/layout/PageLayout";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const parentOrganizationAlias = aliasedTable(churchOrganization, 'parentOrganization')
    const organizationReponse = await db.select().from(churchOrganization)
        .where(eq(churchOrganization.id, params.organization!))
        .leftJoin(parentOrganizationAlias, eq(churchOrganization.id, parentOrganizationAlias.id))
        .then((data) => {
            return data[0];
        })

    const adminIds = await db.select().from(usersTochurchOrganization).where(and(eq(usersTochurchOrganization.churchOrganizationId, params.organization!), eq(usersTochurchOrganization.isAdmin, true)))

    const organization = organizationReponse.church_organizations
    const parentOrganization = organizationReponse.parentOrganization

    return {
        organization: organization,
        parentOrganization: parentOrganization,
        adminIds: adminIds.map((admin) => admin.userId)
    };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    if (request.method === "PUT") {
        const user = await authenticator.isAuthenticated(request);
        if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

        console.log("Updating the church");
        const churchService = new ChurchService();
        const newChurch: typeof churchOrganization.$inferInsert = await churchService.getChurchFormDataFromRequest(request);

        const response = await db.update(churchOrganization).set(newChurch).where(eq(churchOrganization.id, params.organization!));

        return {
            organization: response,
            success: true,
        };
    } else if (request.method === "DELETE") {
        const user = await authenticator.isAuthenticated(request);
        if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

        const response = await db.delete(churchOrganization).where(eq(churchOrganization.id, params.organization!));

        return redirect("/churches");
    }
};


const ChurchPage = () => {
    const { isLoggedIn, user } = useIsLoggedIn();
    const { roles } = useContext(UserContext);
    const [showUpdateToast, setShowUpdateToast] = useState(false);
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData();
    const deleteFetcher = useFetcher();
    const loading = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
    const navigate = useNavigate();
    const location = useLocation();

    const churchService = new ChurchService(loaderData?.organization!, loaderData?.adminIds);
    const subRouteDetected =
        location.pathname.includes("update") ||
        location.pathname.includes("associate") ||
        location.pathname.includes("request");

    function deleteChurch() {
        deleteFetcher.submit({}, { method: "delete", action: `/churches/${loaderData.organization?.id}` });
    }

    function removeChurchAssociation(org: typeof churchOrganization.$inferSelect) {
        deleteFetcher.submit(
            {
                orgId: org.id,
                parentOrgId: loaderData.organization?.id,
            },
            { method: "delete", action: `/churches/${loaderData.organization?.id}/associate` }
        );
    }

    useEffect(() => {
        if (actionData?.success) {
            setShowUpdateToast(actionData.success);
        }
    }, [actionData]);

    return (
        <div className="md:flex-col sm:flex space-y-4">
            <div className="flex">
                <div className="flex-1">
                    <h1 className="text-3xl"> {loaderData.organization?.name} </h1>
                    <div className="text-sm text-gray-500">Last Updated: {loaderData.organization?.updatedAt.toLocaleDateString()}</div>
                    <div className="text-sm text-gray-500">
                        {loaderData.organization?.parentOrganizationId && (
                            <Link
                                className="flex items-center"
                                to={`/churches/${loaderData.organization?.parentOrganizationId}`}
                            >
                                Parent Org: {loaderData.organization?.parentOrganization?.name}
                                <ArrowNarrowRightIcon className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
                {churchService.userIsAdmin(user, roles) && (
                    <DropdownMenu>
                        <div className="">
                            <DropdownMenuTrigger className="flex items-center">
                                <Button>
                                    <span className="sr-only">Open user menu</span>
                                    <PencilIcon className="h-6 w-6 " />
                                </Button>
                            </DropdownMenuTrigger>
                        </div>

                        <DropdownMenuContent className="absolute space-y-2 right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                            <DropdownMenuItem onClick={() => navigate(`update`)}
                                className={classNames(
                                    "cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:text-white"
                                )}>
                                <div>
                                    Edit
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`associate`)}
                                className={classNames(
                                    "cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:text-white"
                                )}>
                                <div>
                                    Associate Org
                                </div>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`request`)}
                                className={classNames(
                                    "cursor-pointer block px-4 py-2 text-sm text-gray-700 hover:text-white"
                                )}>
                                <div>
                                    Manage Request -{" "}
                                    {loaderData.organization?.organizationMembershipRequest?.length}
                                </div>

                            </DropdownMenuItem>

                            <DropdownMenuItem className="h-11  w-full flex items-center"
                                onClick={deleteChurch}>
                                <Button variant="destructive" className="w-full">
                                    <TrashIcon className="h-4 w-4 mr-2" />
                                    Delete
                                </Button>

                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <div className="lg:flex space-y-3 lg:space-x-3 lg:space-y-0">
                <motion.div layout className="flex-1 space-y-3">
                    <Tabs defaultValue="details">
                        <TabsList>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="missions">Missions</TabsTrigger>
                            <TabsTrigger value="associated">Associated Orgs</TabsTrigger>
                            <TabsTrigger value="members" disabled>Members</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            <OrgDescription org={loaderData.organization as typeof churchOrganization.$inferSelect} />
                        </TabsContent>
                        <TabsContent value="missions">
                            <PageLayout title="Missions">
                                <div className="h-full">
                                    <List>
                                        {isNil(loaderData.organization?.missions) || loaderData.organization?.missions.length === 0 ? (
                                            <NoData message="No missions found" />
                                        ) : (
                                            map(loaderData.organization?.missions, (mission: typeof mission.$inferSelect) => {
                                                return (
                                                    <MissionRowCard
                                                        key={mission.id}
                                                        mission={mission}
                                                        linkActive
                                                        sponsoringOrg={mission.ChurchOrganization}
                                                    />
                                                );
                                            }))}
                                    </List>
                                </div>
                            </PageLayout>

                        </TabsContent>
                        <TabsContent value="associated">
                            <>
                                <OrgAssociations org={loaderData.organization as typeof churchOrganization.$inferSelect} />
                            </>
                        </TabsContent>
                        <TabsContent value="members"></TabsContent>
                    </Tabs>
                </motion.div>
                <Outlet />
            </div>
            <UpdateToast
                showUpdateToast={showUpdateToast}
                message="Updated Successfully"
                onClose={() => setShowUpdateToast(false)}
            />
        </div>
    );
};

export default ChurchPage;
