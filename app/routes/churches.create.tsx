import { Button } from "~/components/ui/button";;
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { data, Form, useActionData } from "react-router";
import { useEffect } from "react";
import CreateChurchForm, { type IChurchFormData } from "~/src/components/forms/createChurch/CreateChurchForm";
import { ChurchService } from "~/services/ChurchService";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { redirect } from "react-router";
import type { Route } from "./+types";
import { churchOrganization, usersTochurchOrganization } from "server/db/schema";
import { db } from "~/server/dbConnection";

export const action = async ({ request }: Route.ActionArgs) => {
    console.log("Create church action");
    const user = await authenticator.isAuthenticated(request);
    console.log(user);

    if (request.method === "POST") {
        const churchService = new ChurchService();
        const newChurch: typeof churchOrganization.$inferSelect = await churchService.getChurchFormDataFromRequest(request);

        if (!user) return data({ status: 401, message: "Not authorized", formData: newChurch }, { status: 401 });

        const response = await db.insert(churchOrganization).values({
            ...newChurch,
            createdById: user.id,
            updatedById: user.id,
            updatedAt: new Date(),
        }).returning();

        await db.insert(usersTochurchOrganization).values({
            userId: user.id,
            churchOrganizationId: response[0].id,
            isAdmin: true,
        })

        console.log("response", response);

        return redirect("/churches/" + response[0].id);
    }

    return { message: "Hello World" };
};

interface ICreateChurchActionResponse {
    newChurch?: typeof churchOrganization.$inferSelect;
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
        <div className="flex-col space-y-5 ">
            <h1 className="text-3xl">Create a Missions Organization</h1>

            <Card>
                <CardHeader>

                    <h1 className="text-3xl">Information</h1>
                </CardHeader>
                <CardContent>
                    
                    <Form method="post" className="space-y-4" >
                        <CreateChurchForm initialValues={actionData?.formData} />

                        <Button type="submit">Submit</Button>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
