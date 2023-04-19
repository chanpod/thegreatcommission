import { Menu, Transition } from "@headlessui/react";
import {
    ArrowTopRightOnSquareIcon,
    CalendarIcon,
    CurrencyDollarIcon,
    LockClosedIcon,
    PencilIcon,
    ShieldCheckIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { Missionary, Missions } from "@prisma/client";
import { ActionArgs, LoaderArgs, json } from "@remix-run/node";
import { Link, Outlet, useActionData, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Card, Modal, Tabs } from "flowbite-react";
import { Fragment, useState } from "react";
import { ClientOnly } from "remix-utils";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { MissionsService } from "~/services/MissionsService";
import CurrencyFormatter from "~/src/components/forms/currencyFormat/CurrencyFormatter";

import MissionDescription from "~/src/components/missions/Description";
import MissionMissionaries from "~/src/components/missions/Missionaries";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const action = async ({ request, params }: ActionArgs) => {
    const user = await authenticator.isAuthenticated(request);

    if (request.method === "PUT") {
        const missionsService = new MissionsService();
        const newMission = (await missionsService.getMissionsFormData(request)) as Missions;
        console.log("newMission", newMission);
        const response = await prismaClient.missions.update({
            where: {
                id: params.mission,
            },
            data: newMission,
        });

        console.log("response", response);

        return json({
            newChurch: response,
        });
    }

    throw new Error("Method not allowed");
};

export const loader = async ({ request, params }: LoaderArgs) => {
    const mission = await prismaClient.missions.findUnique({
        where: {
            id: params.mission,
        },
        include: {
            ChurchOrganization: true,
            missionaries: true,
        },
    });

    return json({
        mission,
    });
};

const MissionaryPage = () => {
    const { isLoggedIn, user } = useIsLoggedIn();
    const [showUpdateToast, setShowUpdateToast] = useState(false);
    const loaderData = useLoaderData();
    const actionData = useActionData();
    const deleteFetcher = useFetcher();
    const loading = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
    const navigate = useNavigate();
    const [showDialog, setShowDialog] = useState(false);

    function deleteChurch() {
        deleteFetcher.submit({}, { method: "delete", action: `/missions/${loaderData.mission?.id}` });
    }

    function onClose() {
        setShowDialog(false);
    }

    function getEndTime() {
        if (loaderData.mission?.endDate) {
            return format(new Date(loaderData.mission?.endDate), "MM-dd-yyyy");
        } else {
            return "Indefinite";
        }
    }

    return (
        <div>
            <div className="flex">
                <div className="flex-1">
                    <div className="flex items-center justify-start">
                        <h1 className="flex text-3xl relative">
                            {loaderData.mission.sensitive && (
                                <ShieldCheckIcon color="green" className="rounded-full h-8 w-8 " />
                            )}
                            Mission: {loaderData.mission?.title}{" "}
                        </h1>
                        <div className="flex flex-col justify-center items-center">
                            <div className="text-green-700 text-3xl flex items-center">
                                <CurrencyDollarIcon className="w-8 h-8" />{" "}
                                <CurrencyFormatter skipDollarSign value={loaderData.mission?.investment ?? 0} />
                            </div>
                            <div className="text-gray-500 ml-3 ">Community Investment </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 items-center flex">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {format(new Date(loaderData.mission?.beginDate), "MM-dd-yyyy")} until {getEndTime()}
                    </div>
                    <div className="text-sm text-gray-500">
                        <Link
                            className="flex items-center"
                            to={`/churches/${loaderData.mission?.ChurchOrganization?.id}`}
                        >
                            Association: {loaderData.mission?.ChurchOrganization?.name}
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {isLoggedIn && (
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
                                            onClick={() => navigate(`/missions/${loaderData.mission?.id}/edit`)}
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
                                            onClick={() => navigate(`/missions/${loaderData.mission.id}/missionary`)}
                                            className={classNames(
                                                active ? "bg-gray-100" : "",
                                                "cursor-pointer block px-4 py-2 text-sm text-gray-700"
                                            )}
                                        >
                                            Edit Missionaries
                                        </div>
                                    )}
                                </Menu.Item>
                                <Menu.Item>
                                    {({ active }) => (
                                        <Button
                                            className=" bg-red-800 h-11  w-full flex items-center"
                                            onClick={() => setShowDialog(true)}
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
                <div className="flex-1 space-y-3">
                    <Tabs.Group aria-label="Tabs with icons" style="underline">
                        <Tabs.Item title="Details">
                            <MissionDescription mission={loaderData.mission} />
                        </Tabs.Item>
                        <Tabs.Item title="Missionaries">
                            <MissionMissionaries mission={loaderData.mission} />
                        </Tabs.Item>
                        {/* <Tabs.Item title="Volunteers">
                            <MissionDescription mission={loaderData.mission} />
                        </Tabs.Item> */}
                    </Tabs.Group>
                </div>
                <div className="flex-1">
                    <Card>
                        <Outlet />
                    </Card>
                </div>
            </div>
            <ClientOnly>
                {() => (
                    <Modal show={showDialog} onClose={onClose}>
                        <Modal.Header>Confirmation</Modal.Header>
                        <Modal.Body>
                            <div className="space-y-6">
                                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                                    Are you sure you want to delete this mission? This action cannot be undone.
                                </p>
                            </div>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button onClick={() => setShowDialog(false)}>I accept</Button>
                            <Button color="gray" onClick={deleteChurch}>
                                Decline
                            </Button>
                        </Modal.Footer>
                    </Modal>
                )}
            </ClientOnly>
        </div>
    );
};

export default MissionaryPage;
