import { Menu, Transition } from "@headlessui/react";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization, Missions } from "@prisma/client";
import { ActionArgs, json, LoaderArgs, redirect } from "@remix-run/node";
import { Form, Link, Outlet, useActionData, useFetcher, useLoaderData, useNavigate } from "@remix-run/react";
import { Button, Card, Toast } from "flowbite-react";
import { Fragment, useEffect, useState } from "react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";

import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";
import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
        include: {
            missions: true,
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

        console.log("UPdating the church");
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
    function deleteChurch() {
        deleteFetcher.submit({}, { method: "delete", action: `/churches/${loaderData.organization?.id}` });
    }

    useEffect(() => {
        if (actionData?.success) {
            setShowUpdateToast(actionData.success);
        }
    }, [actionData]);

    return (
        <Card className="flex-col text-black space-y-4">
            <div className="flex">
                <div className="flex-1">
                    <h1 className="text-3xl"> {loaderData.organization?.name} </h1>
                    <div className="text-sm text-gray-500">Last Updated: {loaderData.organization?.updatedAt}</div>
                </div>

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
                                    <Button
                                        className=" bg-red-800 h-11  w-full flex items-center"
                                        onClick={() => navigate(`/missions/${loaderData.mission?.id}/edit`)}
                                    >
                                        <TrashIcon className="h-4 w-4 mr-2" />
                                        Delete
                                    </Button>
                                )}
                            </Menu.Item>
                        </Menu.Items>
                    </Transition>
                </Menu>

                {isLoggedIn && user?.id === loaderData.organization?.createdById && (
                    <Button
                        loading={loading}
                        className="rounded-xl bg-red-800 h-11 flex items-center"
                        onClick={deleteChurch}
                    >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                )}
            </div>
            <div className="flex space-x-3">
                <Card className="flex-1">
                    <h1 className="text-3xl">Missions</h1>
                    <hr className="my-2" />
                    <div>
                        <List>
                            {loaderData?.organization?.missions?.map((mission: Missions) => {
                                return (
                                    // <div key={church.id} className={`w-full rounded-lg hover:shadow-md shadow-sm p-2`}>Test</div>
                                    <Row key={mission.id}>
                                        <Link to={`/missions/${mission.id}`}>
                                            <RowItem>
                                                <div className="mr-3">
                                                    <EmptyAvatar />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={primaryText}>{mission.title}</p>
                                                    <p className={secondaryText}>{mission.description}</p>
                                                </div>
                                                <div className={secondaryText}>{mission.zip}</div>
                                            </RowItem>
                                        </Link>
                                    </Row>
                                );
                            })}
                        </List>
                    </div>
                </Card>

                <Card className="flex-1">
                    <Outlet />
                </Card>
            </div>

            {showUpdateToast && (
                <Toast>
                    <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-500 dark:bg-blue-800 dark:text-blue-200">
                        sdf
                    </div>
                    <div className="ml-3 text-sm font-normal">Set yourself free.</div>
                    <Toast.Toggle />
                </Toast>
            )}
        </Card>
    );
};

export default ChurchPage;
