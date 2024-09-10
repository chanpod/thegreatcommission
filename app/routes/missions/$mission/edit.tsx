import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { Form, useLoaderData, useNavigate } from "@remix-run/react";
import { Button } from "shad/ui";
import { prismaClient } from "~/server/dbConnection";

import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
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
