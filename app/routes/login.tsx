import { PrismaClient, User } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigation, useTransition } from "@remix-run/react";
import DBConnection, { prismaClient } from "~/src/components/server/dbConnection";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Input } from "~/src/components/forms/input/Input";
import { Button } from "~/src/components/button/Button";

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

        console.log("Adding New User", newUser);

        const response = await prismaClient.user.create({
            data: newUser,
        });

        return json({
            response: response,
        });
    } else if (request.method === "DELETE") {
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
    const transition = useNavigation();
    const loaderData = useLoaderData();
    const deleteFetcher = useFetcher();
    const loading =
        transition.state === "submitting" ||
        transition.state === "loading" ||
        deleteFetcher.state === "submitting" ||
        deleteFetcher.state === "loading";

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
            <div className="flex-col bg-white rounded-md p-3">
                <h1 className="text-3xl"> Login </h1>

                <form method="post" className="flex-col w-48 space-y-2">
                    <Input label="Email" name="email" placeholder="email" className="flex"></Input>
                    <Input label="First Name" name="firstName" placeholder="first name" className="flex"></Input>
                    <Input label="Last Name" name="lastName" placeholder="last name" className="flex"></Input>

                    <Button type="submit" loading={loading}>
                        Submit
                    </Button>
                </form>

                <h1 className="text-3xl mt-5"> Existing Users</h1>

                <div className="border-t-4">
                    {loaderData.users.map((user: User) => {
                        return (
                            <div key={user.id} className="flex items-center w-96">
                                <div className="flex-col">
                                    <div>
                                        Name: {user.firstName} {user.lastName}{" "}
                                    </div>
                                    <div className="text-sm text-slate-500"> {user.email} </div>

                                </div>

                                <Button className="w-12 h-12 ml-4" loading={loading} onClick={() => deleteUser(user)}>
                                    <TrashIcon className="w-full h-full" />
                                </Button>
                            </div>
                        );
                    })}
                </div>
            </div>
        </>
    );
}
