import { Menu, Transition } from "@headlessui/react";
import {
    CurrencyDollarIcon,
    CalendarIcon,
    ArrowTopRightOnSquareIcon,
    PencilIcon,
    TrashIcon,
} from "@heroicons/react/24/outline";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Card, Tabs } from "flowbite-react";

import React, { Fragment } from "react";
import { prismaClient } from "~/server/dbConnection";
import CurrencyFormatter from "~/src/components/forms/currencyFormat/CurrencyFormatter";
import MissionDescription from "~/src/components/missions/Description";
import MissionMissionaries from "~/src/components/missions/Missionaries";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const action = async ({ request }: ActionArgs) => {
    return json({});
};

export const loader = async ({ request, params }: LoaderArgs) => {
    const missionary = await prismaClient.missionary.findUnique({
        where: {
            id: params.missionary,
        },
    });

    return json({
        missionary,
    });
};

const MissionaryPage = () => {
    const params = useParams();
    const loaderData = useLoaderData<typeof loader>();
    const { isLoggedIn, user } = useIsLoggedIn();
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg p-2 flex-col p-1 text-black space-y-4">
            <div className="flex">
                <div className="flex-1">
                    <div className="flex items-center justify-start">
                        <h1 className="text-3xl">
                            {loaderData.missionary?.firstName} {loaderData.missionary?.lastName}
                        </h1>
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
                                            onClick={() => navigate(`/missionaries/${loaderData.missionary?.id}/edit`)}
                                            className={classNames(
                                                active ? "bg-gray-100" : "",
                                                "cursor-pointer block px-4 py-2 text-sm text-gray-700"
                                            )}
                                        >
                                            Edit
                                        </div>
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
                        <Tabs.Item title="Details">Information about missionary here</Tabs.Item>
                        <Tabs.Item title="Missions">Display missions here</Tabs.Item>
                    </Tabs.Group>
                </div>
                <div className="flex-1">
                    <Card>
                        <Outlet />
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default MissionaryPage;
