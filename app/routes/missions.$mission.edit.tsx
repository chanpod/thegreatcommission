import { CheckCircle as CheckCircleIcon } from "lucide-react";
import { Form, useLoaderData, useNavigate } from "react-router";
import { missions } from "server/db/schema";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";
import type { Route } from "./+types";
import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";
import { Button } from "~/components/ui/button";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const mission = await db.select().from(missions).where(eq(missions.id, params.mission as string));

    return {
        mission,
    };
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
