import { ChurchOrganization } from "@prisma/client";
import { ActionArgs, json } from "@remix-run/node";
import { Button } from "~/src/components/button/Button";
import { Input } from "~/src/components/forms/input/Input";
import { prismaClient } from "~/src/components/server/dbConnection";

export const action = async ({ request }: ActionArgs) => {
    console.log("Create church action");

    if (request.method === "POST") {
        const form = await request.formData();

        const user = await prismaClient.user.findUnique({
            where: {
                email: "chauncey.philpot@gmail.com",
            },
        });

        console.log(user);

        const newChurch: ChurchOrganization = {
            name: form.get("name") as string,
            city: form.get("city") as string,
            state: form.get("state") as string,
            createdById: user?.id,
            zip: form.get("zip") as string,
        };

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

export default function CreateChurch() {
    return (
        <div className="flex-col">
            <h1 className="text-3xl">Create a Missions Organization</h1>

            <form method="post">
                <Input name="name" label="Name" />
                <Input name="city" label="City" />
                <Input name="state" label="State" />
                <Input name="country" label="Country" />
                <Input name="zip" label="Zip Code" />

                <Button type="submit">Submit</Button>
            </form>
        </div>
    );
}
