import { Form, useFetcher } from "react-router";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { MissionsService } from "~/services/MissionsService";
import { Button } from "~/components/ui/button";;
import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";
import type { Route } from "./+types";
import { missions } from "server/db/schema";
import { db } from "~/server/dbConnection";
import { Card, CardContent, CardHeader } from "~/components/ui/card";

export interface IMissionsFormData {
    title: string;
    beginDate: string;
    endDate: string;
    description: string;
    volunteersNeeded: number;
    churchOrganizationId: string;
    location: Location | undefined;
    investment?: number;
    fundingRaised?: number;
}

export const action = async ({ request }: Route.ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);

    if (request.method === "POST") {
        const form = await request.formData();

        const startDate = form.get("beginDate") as string;
        const endDate = form.get("endDate") as string;

        console.log("startDate", startDate);
        console.log("endDate", endDate);

        const missionsService = new MissionsService();
        const newMission = await missionsService.getMissionsFormData(request) as typeof missions.$inferInsert;

        const response = await db.insert(missions).values(newMission);

        console.log("response", response);

        return {
            newChurch: response,
        };
    }

    return { message: "Hello World" };
};

export default function CreateChurch() {
    return (
        <Card className="bg-white">
            <CardContent>
                <CardHeader>

                    <div className="flex-col space-y-5 ">
                        <h1 className="text-3xl">Create a Missions Organization</h1>
                    </div>
                </CardHeader>

            <Card className="text-black max-w-[700px]">
                <h1 className="text-3xl">Information</h1>
                <hr className="my-2" />
                <Form method="post" className="space-y-5">
                    <CreateMissionForm />
                    <Button type="submit">Submit</Button>
                </Form>
                </Card>
            </CardContent>
        </Card>
    );
}
