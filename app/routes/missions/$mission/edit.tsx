import { Menu, Transition } from "@headlessui/react";
import { Bars3Icon, CheckCircleIcon, PencilIcon, TrashIcon } from "@heroicons/react/24/outline";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, Link, useActionData, useFetcher, useLoaderData, useNavigate, useParams } from "@remix-run/react";
import { format } from "date-fns";
import { Button, Card, Modal } from "flowbite-react";
import React, { Fragment, useState } from "react";
import { ClientOnly } from "remix-utils";
import { prismaClient } from "~/server/dbConnection";

import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const loader = async ({ request, params }: LoaderArgs) => {
    const mission = await prismaClient.missions.findUnique({
        where: {
            id: params.mission,
        },
        include: {
            ChurchOrganization: true,
        },
    });

    return json({
        mission,
    });
};

const SubRoute = () => {
    const loaderData = useLoaderData();
    const navigate = useNavigate();

    return (
        <div>
            <Form action={`/missions/${loaderData.mission.id}`} method="put" className="space-y-3">
                <CreateMissionForm initialValues={loaderData.mission} />
                <div className="flex space-x-3">
                    <Button onClick={() => navigate("/missions/" + loaderData.mission.id)}>Cancel</Button>
                    <Button className="bg-green-600" type="submit">
                        <CheckCircleIcon className="h-5 w-5" />
                        Save
                    </Button>
                </div>
            </Form>
        </div>
    );
};

export default SubRoute;
