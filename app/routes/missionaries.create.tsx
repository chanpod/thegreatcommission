import { Button } from "~/components/ui/button";;
import { Input } from "~/src/components/forms/input/Input";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { Form } from "react-router";
import type { Route } from "./+types";
import { db } from "~/server/dbConnection";
import { missionaries } from "server/db/schema";
import { Card } from "~/components/ui/card";
import { PageLayout } from "~/src/components/layout/PageLayout";

export const action = async ({ request }: Route.ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);

    if (request.method === "POST") {
        const form = await request.formData();

        const newMissionary: typeof missionaries.$inferInsert = {
            firstName: form.get("firstName") as string,
            lastName: form.get("lastName") as string,
            middleName: form.get("middleName") as string,
            email: form.get("email") as string,
            city: form.get("city") as string,
            state: form.get("state") as string,
            zip: form.get("zip") as string,
            updatedAt: new Date(),
            createdAt: new Date(),
        };

        const response = await db.insert(missionaries).values(newMissionary);

        console.log("response", response);

        return {
            newChurch: response,
        };
    }

    return { message: "Hello World" };
};

export default function CreateChurch() {
    return (
        <PageLayout title="Create a Missionary">

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
        </PageLayout>
    );
}
