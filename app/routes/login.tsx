import { PrismaClient, User } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Scripts, useFetcher, useLoaderData, useNavigation, useTransition } from "@remix-run/react";
import DBConnection, { prismaClient } from "~/server/dbConnection";
import { TrashIcon } from "@heroicons/react/24/outline";
import { Input } from "~/src/components/forms/input/Input";
import { Button } from "~/src/components/button/Button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { googleStrategy } from "~/server/auth/strategies/googleStrategy";

export const loader = async ({ request }: LoaderArgs) => {
    const users = await prismaClient.user.findMany();

    return json({
        users: users,
    });
};

export const action = async ({ request }: ActionArgs) => {
    console.log("Logging in");

    return await authenticator.authenticate("google", request);
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
                action: "/user/delete",
                method: "delete",
            }
        );
    }

    return (
        <>
            <div className="flex-col">
                <h1 className="text-3xl"> Login </h1>

                <form method="post" className="flex-col w-48 space-y-2">
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
