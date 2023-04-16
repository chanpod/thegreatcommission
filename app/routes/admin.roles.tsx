import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import { Button, Card } from "flowbite-react";
import { map } from "lodash";
import { prismaClient } from "~/server/dbConnection";

export const loader = async ({ request, params }: LoaderArgs) => {
    const roles = await prismaClient.role.findMany();

    return json({
        roles,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    if (request.method === "POST") {
        const form = await request.formData();
        const name = form.get("name");

        const role = await prismaClient.role.create({
            data: {
                name,
            },
        });

        return json({
            role,
            success: true,
        });
    }
};

const Roles = () => {
    const loaderData = useLoaderData();
    return (
        <Card className="flex-col text-black space-y-4">
            Manage Roles
            {map(loaderData.roles, (role) => {
                return <div key={role.id}>{role.name}</div>;
            })}
            <Form method="post">
                <input type="text" name="name" />
                <Button type="submit">Add Role</Button>
            </Form>
        </Card>
    );
};

export default Roles;
