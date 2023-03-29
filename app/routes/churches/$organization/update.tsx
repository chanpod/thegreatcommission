import { json, LoaderArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button } from "flowbite-react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";
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

const Update = () => {
    const loaderData = useLoaderData();

    return (
        <div>
            <h1 className="text-3xl">Update</h1>
            <hr className="my-2" />
            <Form method="put" className="space-y-4">
                <CreateChurchForm readOnly={true} initialValues={loaderData?.organization} />

                <Button type="submit">Update</Button>
            </Form>
        </div>
    );
};

export default Update;
