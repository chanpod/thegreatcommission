import { data, Form, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";
import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";
import { churchOrganization, missions } from "server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const organization = await db.select().from(churchOrganization).where(eq(churchOrganization.id, params.organization)).innerJoin(missions, eq(churchOrganization.id, missions.churchOrganizationId));

    return {
        organization,
    };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    if (request.method === "PUT") {
        const user = await authenticator.authenticate("google", request);
        if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

        console.log("UPdating the church");
        const churchService = new ChurchService();
        const newChurch = await churchService.getChurchFormDataFromRequest(request);

        const response = await db
            .update(churchOrganization)
            .set(newChurch)
            .where(eq(churchOrganization.id, params.organization))
            .returning();

        return {
            organization: response[0],
            success: true,
        };
    }
};

const Update = () => {
    const loaderData = useLoaderData();

    return (
        <div>
            <h1 className="text-3xl">Update</h1>
            <hr className="my-2" />
            <Form method="put" className="space-y-4">
                <CreateChurchForm initialValues={loaderData?.organization} />
                <Button type="submit">Update</Button>
            </Form>
        </div>
    );
};

export default Update;
