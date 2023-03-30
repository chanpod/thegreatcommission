import { ChurchOrganization } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "flowbite-react";
import React from "react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";
import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
        include: {
            missions: true,
        },
    });

    return json({
        organization,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    if (request.method === "PUT") {
        const user = await authenticator.isAuthenticated(request);
        if (!user) return json({ message: "Not Authenticated" }, { status: 401 });

        console.log("UPdating the church");
        const churchService = new ChurchService();
        const newChurch: ChurchOrganization = await churchService.getChurchFormDataFromRequest(request);

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: params.organization,
            },
            data: newChurch,
        });

        return json({
            organization: response,
            success: true,
        });
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
