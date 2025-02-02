import { useState } from "react";
import { Form, useNavigate, useParams } from "react-router";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { createMission } from "~/server/services/data/MissionsData.service";
import { MissionsService } from "~/services/MissionsService";
import { PageLayout } from "~/src/components/layout/PageLayout";
import type { Route } from "./+types";
import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";


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

export const action = async ({ request, params }: Route.ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);

    if (request.method === "POST") {

        const form = await request.formData();

        const missionsService = new MissionsService();
        const newMission = await missionsService.getMissionsFormData(form);
        newMission.churchOrganizationId = params.organization;

        const response = await createMission(newMission);

        console.log("response", response);

        return {
            newChurch: response,
        };
    }

    return { message: "Hello World" };
};

export default function CreateMission() {
    const { organization } = useParams();
    const [isOpen, setIsOpen] = useState(true);
    const navigate = useNavigate();
    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setTimeout(() => {
                navigate(`/churches/${organization}/missions`);
            }, 300); // Match sheet close animation duration
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent>
                <PageLayout title="Edit Member" className="mt-3">

                    <Form method="post" className="space-y-5">
                        <CreateMissionForm />
                        <Button type="submit">Submit</Button>
                    </Form>
                </PageLayout>
            </SheetContent>
        </Sheet>
    );
}
