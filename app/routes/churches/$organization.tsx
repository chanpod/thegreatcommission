import { Menu, Transition } from "@headlessui/react";
import { ArrowLeftIcon, ArrowTopRightOnSquareIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization, Missions } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Link, Outlet, useActionData, useFetcher, useLoaderData, useLocation, useNavigate } from "@remix-run/react";
import { Button, Card, Tabs, Toast } from "flowbite-react";
import { AnimatePresence, motion } from "framer-motion";
import { map } from "lodash";
import { Fragment, useEffect, useState } from "react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";

import List from "~/src/components/listItems/List";
import { MissionRowCard } from "~/src/components/listItems/components/MissionRowCard";
import { OrgAssociations } from "~/src/components/organizations/OrgAssociations";
import OrgChart from "~/src/components/organizations/OrgChart";
import OrgDescription from "~/src/components/organizations/OrgDescription";
import UpdateToast from "~/src/components/toast/UpdateToast";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import { InvitationStatus } from "~/src/types/invitation.types";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
        include: {
            missions: true,
            admins: true,
            members: true,
            associations: {
                include: {
                    associations: true,
                },
            },
            parentOrganization: {
                include: {
                    parentOrganization: true,
                },
            },
            organizationMembershipRequest: {
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

export const action = async ({ request, params }: ActionArgs) => {
    if (request.method === "PUT") {
        const user = await authenticator.isAuthenticated(request);
        if (!user) return json({ message: "Not Authenticated" }, { status: 401 });

        console.log("Updating the church");
        const churchService = new ChurchService();
        const newChurch: ChurchOrganization = await churchService.getChurchFormDataFromRequest(request);

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: params.organization,
            },
            data: newChurch,
        });

        return json({
            organization: response,
            success: true,
        });
    } else if (request.method === "DELETE") {
        const user = await authenticator.isAuthenticated(request);
        if (!user) return json({ message: "Not Authenticated" }, { status: 401 });

        const response = await prismaClient.churchOrganization.delete({
            where: {
                id: params.organization,
            },
        });

        return redirect("/churches");
    }
};

interface ILoaderData {
    organization: ChurchOrganization | null;
}

const ChurchPage = () => {
    const { isLoggedIn, user } = useIsLoggedIn();
    const [showUpdateToast, setShowUpdateToast] = useState(false);
    const loaderData = useLoaderData<ILoaderData>();
    const actionData = useActionData();
    const deleteFetcher = useFetcher();
    const loading = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
    const navigate = useNavigate();
    const location = useLocation();
    const churchService = new ChurchService(loaderData?.organization!);
    const subRouteDetected =
        location.pathname.includes("update") ||
        location.pathname.includes("associate") ||
        location.pathname.includes("request");

    function deleteChurch() {
        deleteFetcher.submit({}, { method: "delete", action: `/churches/${loaderData.organization?.id}` });
    }

    function removeChurchAssociation(org: ChurchOrganization) {
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
                    <div className="text-sm text-gray-500">Last Updated: {loaderData.organization?.updatedAt}</div>
                    <div className="text-sm text-gray-500">
                        {loaderData.organization?.parentOrganization && (
                            <Link
                                className="flex items-center"
                                to={`/churches/${loaderData.organization?.parentOrganization?.id}`}
                            >
                                Parent Org: {loaderData.organization?.parentOrganization?.name}
                                <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
                {churchService.userIsAdmin(user) && (
                    <Menu as="div" className="relative ml-3">
                        <div className="">
                            <Menu.Button className="flex items-center">
                                <Button pill outline>
                                    <span className="sr-only">Open user menu</span>
                                    <PencilIcon className="h-6 w-6 " />
                                </Button>
                            </Menu.Button>
                        </div>
                        <Transition
                            as={Fragment}
                            enter="transition ease-out duration-100"
                            enterFrom="transform opacity-0 scale-95"
                            enterTo="transform opacity-100 scale-100"
                            leave="transition ease-in duration-75"
                            leaveFrom="transform opacity-100 scale-100"
                            leaveTo="transform opacity-0 scale-95"
                        >
                            <Menu.Items className="absolute space-y-2 right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                                <Menu.Item>
                                    {({ active }) => (
                                        <div
                                            onClick={() => navigate(`update`)}
                                            className={classNames(
                                                active ? "bg-gray-100" : "",
                                                "cursor-pointer block px-4 py-2 text-sm text-gray-700"
                                            )}
                                        >
                                            Edit
                                        </div>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <div
                                            onClick={() => navigate(`associate`)}
                                            className={classNames(
                                                active ? "bg-gray-100" : "",
                                                "cursor-pointer block px-4 py-2 text-sm text-gray-700"
                                            )}
                                        >
                                            Associate Org
                                        </div>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <div
                                            onClick={() => navigate(`request`)}
                                            className={classNames(
                                                active ? "bg-gray-100" : "",
                                                "cursor-pointer block px-4 py-2 text-sm text-gray-700"
                                            )}
                                        >
                                            Manage Request -{" "}
                                            {loaderData.organization?.organizationMembershipRequest?.length}
                                        </div>
                                    )}
                                </Menu.Item>

                                <Menu.Item>
                                    {({ active }) => (
                                        <Button
                                            className=" bg-red-800 h-11  w-full flex items-center"
                                            onClick={deleteChurch}
                                        >
                                            <TrashIcon className="h-4 w-4 mr-2" />
                                            Delete
                                        </Button>
                                    )}
                                </Menu.Item>
                            </Menu.Items>
                        </Transition>
                    </Menu>
                )}
            </div>
            <div className="lg:flex space-y-3 lg:space-x-3 lg:space-y-0">
                <motion.div layout className="flex-1 space-y-3">
                    <Tabs.Group aria-label="Tabs with icons" style="underline">
                        <Tabs.Item title="Details">
                            <OrgDescription org={loaderData.organization as ChurchOrganization} />
                        </Tabs.Item>
                        <Tabs.Item title="Missions">
                            <List>
                                {map(loaderData.organization?.missions, (mission: Missions) => {
                                    return (
                                        <MissionRowCard
                                            key={mission.id}
                                            mission={mission}
                                            linkActive
                                            sponsoringOrg={mission.ChurchOrganization}
                                        />
                                    );
                                })}
                            </List>
                        </Tabs.Item>
                        <Tabs.Item title="Associated Orgs">
                            <>
                                <OrgAssociations org={loaderData.organization as ChurchOrganization} />
                                {/* <OrgChart /> */}
                            </>
                        </Tabs.Item>
                        <Tabs.Item title="Members" disabled></Tabs.Item>
                    </Tabs.Group>
                </motion.div>
                {subRouteDetected && (
                    <motion.div layout className="lg:flex flex-1 space-y-3 lg:space-x-3 lg:space-y-0">
                        <Card className="flex-1">
                            <Button className="w-36" onClick={() => navigate("")}>
                                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                                Back
                            </Button>
                            <Outlet />
                        </Card>
                    </motion.div>
                )}
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
