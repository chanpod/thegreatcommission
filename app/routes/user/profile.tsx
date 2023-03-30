import { Role } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button, Card } from "flowbite-react";
import React, { useContext } from "react";
import { UserContext } from "~/root";
import { getSession } from "~/server/auth/session.server";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";

export const loader = async ({ request }: LoaderArgs) => {
    const roles = await prismaClient.role.findMany();

    return json({
        roles,
    });
};

export const action = async ({ request }: ActionArgs) => {
    if (request.method === "POST") {
        const form = await request.formData();
        const role = JSON.parse(form.get("role") as string);
        const user = await authenticator.isAuthenticated(request);

        const updatedUser = await prismaClient.user.update({
            where: {
                id: user?.id,
            },
            data: {
                roles: {
                    connect: {
                        id: role.id,
                    },
                },
            },
        });

        return json({
            updatedUser,
            success: true,
        });
    }
};

const UserProfilePage = () => {
    const loaderData = useLoaderData();
    const userContext = useContext(UserContext);
    const addRoleFetcher = useFetcher();

    function addRole(role: Role) {
        addRoleFetcher.submit(
            {
                role: JSON.stringify(role),
            },
            {
                method: "post",
            }
        );
    }

    return (
        <Card className="flex-col text-black space-y-4">
            <div className="flex justify-between">
                <div className="text-3xl">User Profile</div>
                <Button>Edit</Button>
            </div>
            <div>Email: {userContext.user?.email}</div>
            <div>First Name: {userContext.user?.firstName}</div>
            <div>Last Name: {userContext.user?.lastName}</div>

            <div>
                {loaderData.roles?.map((role: Role) => {
                    return (
                        <div className="flex items-center space-x-3" key={role.id}>
                            <span>{role.name}</span>
                            <Button onClick={() => addRole(role)}>Add</Button>
                        </div>
                    );
                })}
            </div>
        </Card>
    );
};

export default UserProfilePage;
