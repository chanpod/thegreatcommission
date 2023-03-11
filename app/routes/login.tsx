import { PrismaClient, User } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import DBConnection, { prismaClient } from "~/src/components/server/dbConnection";
import { TrashIcon } from "@heroicons/react/24/outline";

export const loader = async ({ request }: LoaderArgs) => {
    const users = await prismaClient.user.findMany();

    return json({
        users: users,
    });
};

export const action = async ({ request }: ActionArgs) => {
    if (request.method === "POST") {
        const form = await request.formData();

        const newUser: User = {
            email: form.get("email") as string,
            firstName: form.get("firstName") as string,
            lastName: form.get("lastName") as string,
        };

        const response = await prismaClient.user.create({
            data: newUser,
        });

        return json({
            response: response,
        });
    }
    else if(request.method === "DELETE") {
        const form = await request.formData();

        const user = JSON.parse(form.get("user") as string) as User;

        const response = await prismaClient.user.delete({
            where: {
                id: user.id,
            },
        });

        return json({
            response: response,
        });
    }

    return json(
        {
            message: "Method not allowed",
        },
        {
            status: 404,
        }
    );
};

export default function LoginPage() {
    const loaderData = useLoaderData();
    const deleteFetcher = useFetcher();

    function deleteUser(user: User) {
        deleteFetcher.submit(
            {
                user: JSON.stringify(user),
            },
            {
                action: "/login",
                method: "delete",
            }
        );
    }
    return (
        <>
            <div className="flex-col">
                <h1> Login </h1>

                <form method="post" className="flex-col divide-y">
                    <input name="email" placeholder="email" className="flex"></input>
                    <input name="firstName" placeholder="first name" className="flex"></input>
                    <input name="lastName" placeholder="last name" className="flex"></input>

                    <button type="submit" className="flex">
                        {" "}
                        Submit{" "}
                    </button>
                </form>

                <h1> Existing Users</h1>

                {loaderData.users.map((user: User) => {
                    return (
                        <div key={user.id} className="flex">
                            <p> {user.email} </p>
                            <p> {user.firstName} </p>
                            <p> {user.lastName} </p>
                            <button onClick={() => deleteUser(user)}>
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </>
    );
}
