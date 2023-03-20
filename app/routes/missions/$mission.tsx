import { Menu, Transition } from "@headlessui/react";
import { Bars3Icon, CheckCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { MissionariesOnMissions, Missionary } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, Outlet, useActionData, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Card, Modal } from "flowbite-react";
import React, { Fragment, useState } from "react";
import { ClientOnly } from "remix-utils";
import { prismaClient } from "~/server/dbConnection";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";

import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";
import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const action = async ({ request }: ActionArgs) => {
    return json({});
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

    function deleteMissionary(missionary: Missionary) {
        deleteFetcher.submit(
            {
                linkId: missionary.id,
            },
            { method: "delete", action: `/missions/${loaderData.mission?.id}/missionary` }
        );
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
        <Card className="flex-col text-black space-y-4">
            <div className="flex">
                <div className="flex-1">
                    <h1 className="text-3xl"> Mission: {loaderData.mission?.title} </h1>
                    <div className="text-sm text-gray-500">
                        {format(new Date(loaderData.mission?.beginDate), "MM-dd-yyyy")} until {getEndTime()}
                    </div>
                    <div className="text-sm text-gray-500">
                        Association:{" "}
                        <Link to={`/churches/${loaderData.mission?.ChurchOrganization?.id}`}>
                            {loaderData.mission?.ChurchOrganization?.name}
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
            <div className="flex space-x-3">
                <div className="flex-1">
                    <Card>
                        <>
                            <h1 className="text-2xl">Description</h1>
                            {loaderData.mission?.description}
                        </>
                        <>
                            <div className="flex justify-between">
                                <h1 className="text-2xl">Missionaries</h1>
                                <Button onClick={() => navigate(`/missions/${loaderData.mission.id}/missionary`)}>
                                    Add Missionary
                                </Button>
                            </div>
                            <List>
                                {loaderData.mission?.missionaries?.map((missionary: Missionary) => (
                                    <Row key={missionary.id}>
                                        <Link to={`/missionaries/${missionary.id}`}>
                                            <RowItem>
                                                <div className="flex-shrink-0">
                                                    <EmptyAvatar />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={primaryText}>
                                                        {missionary.firstName} {missionary.lastName}
                                                    </p>
                                                    <p className={secondaryText}>{missionary.email}</p>
                                                </div>
                                                <div>
                                                    <Button
                                                        onClick={(event) => {
                                                            event.preventDefault();
                                                            deleteMissionary(missionary);
                                                        }}
                                                        className="bg-red-800"
                                                        pill
                                                    >
                                                        <TrashIcon className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </RowItem>
                                        </Link>
                                    </Row>
                                ))}
                            </List>
                        </>
                    </Card>
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
        </Card>
    );
};

export default MissionaryPage;
