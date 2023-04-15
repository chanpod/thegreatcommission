import { ChurchOrganization, Missionary, Missions } from "@prisma/client";
import { ActionArgs, json } from "@remix-run/node";
import { Form, useFetcher } from "@remix-run/react";
import { Card } from "flowbite-react";
import { useState } from "react";
import { DateValueType } from "react-tailwindcss-datepicker/dist/types";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { Button } from "~/src/components/button/Button";
import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";

export const action = async ({ request }: ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);
    
    if (request.method === "POST") {
        const form = await request.formData();

        const startDate = form.get("beginDate") as string;
        const endDate = form.get("endDate") as string;

        console.log("startDate", startDate);
        console.log("endDate", endDate);

        const newMissionary: Partial<Missions> = {
            title: form.get("title") as string,
            beginDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : null,
            description: form.get("description") as string,
            volunteersNeeded: Number(form.get("volunteersNeeded")) || 0,
            churchOrganizationId: form.get("churchOrganizationId") as string,        
            location: {
                lat: parseFloat(form.get("lat") as string),
                lng: parseFloat(form.get("lng") as string),
            }    
        };

        const response = await prismaClient.missions.create({
            data: newMissionary,
        });

        console.log("response", response);

        return json({
            newChurch: response,
        });
    }

    return json({ message: "Hello World" });
};

export default function CreateChurch() {


    return (
        <div className="flex-col space-y-5 ">
            <h1 className="text-3xl">Create a Missions Organization</h1>

            <Card className="text-black max-w-[700px]">
                <h1 className="text-3xl">Information</h1>
                <hr className="my-2" />
                <Form method="post" className="space-y-5">
                    <CreateMissionForm />
                    <Button type="submit">Submit</Button>
                </Form>
            </Card>
        </div>
    );
}
