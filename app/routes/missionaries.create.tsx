import { Form } from "react-router";
import { users } from "server/db/schema";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import UsersForm from "~/src/components/forms/users/UsersForm";
import { PageLayout } from "~/src/components/layout/PageLayout";
import type { Route } from "./+types";


export const action = async ({ request }: Route.ActionArgs) => {
    console.log("Create missionary action");

    const user = await authenticator.isAuthenticated(request);

    if (request.method === "POST") {
        const form = await request.formData();

        const newMissionary: typeof users.$inferInsert = {
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

        const response = await db.insert(users).values(newMissionary);

        console.log("response", response);

        return {
            newMissionary: response,
        };
    }

    return { message: "Hello World" };
};

export default function CreateMissionary() {
    return (
        <PageLayout title="Create a Missionary">

            <Form method="post">
                <UsersForm defaultValues={{}} />

                <Button type="submit">Submit</Button>
            </Form>
        </PageLayout>
    );
}
