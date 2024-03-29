import { ChurchOrganization, Missionary } from "@prisma/client";
import { ActionArgs, json } from "@remix-run/node";
import { Button } from "~/src/components/button/Button";
import { Input } from "~/src/components/forms/input/Input";
import { prismaClient } from "~/server/dbConnection";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { Form } from "@remix-run/react";
import { Card } from "flowbite-react";

export const action = async ({ request }: ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);

    if (request.method === "POST") {
        const form = await request.formData();

        const newMissionary: Missionary = {
            firstName: form.get("firstName") as string,
            lastName: form.get("lastName") as string,
            middleName: form.get("middleName") as string,
            email: form.get("email") as string,
            city: form.get("city") as string,
            state: form.get("state") as string,
            zip: form.get("zip") as string,
        };

        const response = await prismaClient.missionary.create({
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
                <Form method="post">
                    <Input name="firstName" label="First Name" />
                    <Input name="lastName" label="Last Name" />
                    <Input name="middleName" label="Middle Name" />
                    <Input name="email" label="email" />
                    <Input name="city" label="City" />
                    <Input name="state" label="State" />
                    <Input name="zip" label="Zip Code" />

                    <Button type="submit">Submit</Button>
                </Form>
            </Card>
        </div>
    );
}
