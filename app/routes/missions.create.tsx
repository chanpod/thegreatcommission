import { Form } from "react-router";
import { missions } from "server/db/schema";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import { MissionsService } from "~/services/MissionsService";
import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";
import { PageLayout } from "~/src/components/layout/PageLayout";
import type { Route } from "./+types";
;

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
        const newMission = await missionsService.getMissionsFormData(form) as typeof missions.$inferInsert;

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
        <PageLayout title="Create a Missions Organization">

            <Form method="post" className="space-y-5">
                <CreateMissionForm />
                <Button type="submit">Submit</Button>
            </Form>
        </PageLayout>
    );
}
