import { ChurchOrganization } from "@prisma/client";
import { ActionArgs, json } from "@remix-run/node";
import { Button } from "~/src/components/button/Button";
import { Input } from "~/src/components/forms/input/Input";
import { prismaClient } from "~/server/dbConnection";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { Form, useActionData } from "@remix-run/react";
import { useEffect } from "react";
import CreateChurchForm, { IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";
import { ChurchService } from "~/services/ChurchService";

export const action = async ({ request }: ActionArgs) => {
    console.log("Create church action");
    const user = await authenticator.isAuthenticated(request);
    console.log(user);

    if (request.method === "POST") {
        const churchService = new ChurchService();
        const newChurch: ChurchOrganization = await churchService.getChurchFormDataFromRequest(request);

        if (!user) return json({ status: 401, message: "Not authorized", formData: newChurch }, { status: 401 });

        const response = await prismaClient.churchOrganization.create({
            data: newChurch,
        });

        console.log("response", response);

        return json({
            newChurch: response,
        });
    }

    return json({ message: "Hello World" });
};

interface ICreateChurchActionResponse {
    newChurch?: ChurchOrganization;
    status?: number;
    message?: string;
    formData?: IChurchFormData;
}

export default function CreateChurch() {
    const actionData = useActionData<ICreateChurchActionResponse>();

    useEffect(() => {
        console.log(actionData);
        if (actionData?.status === 401) {
            alert("Must be logged in to do this");
        }
    }, [actionData?.status]);

    return (
        <div className="flex-col">
            <h1 className="text-3xl">Create a Missions Organization</h1>

            <div className="p-5 max-w-xl shadow-md">
                <h1 className="text-3xl">Information</h1>
                <hr className="my-2" />
                <Form method="post" className="space-y-4">
                    <CreateChurchForm initialValues={actionData?.formData} />

                    <Button type="submit">Submit</Button>
                </Form>
            </div>
        </div>
    );
}
