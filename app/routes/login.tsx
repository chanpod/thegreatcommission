import { TrashIcon } from "@heroicons/react/24/outline";
import { User } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData, useNavigation } from "@remix-run/react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import googleIcon from "~/src/assets/images/googleIcon.svg";

export const loader = async ({ request }: LoaderArgs) => {
    // const users = await prismaClient.user.findMany();
    // return json({
    //     users: users,
    // });

    return json({});
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
            <div className="flex-col items-center">
                <div className="text-center">
                    <h1 className="text-5xl"> Login </h1>
                </div>
                <div>
                    <form method="post" className="flex-col items-center justify-center w-48 space-y-2">
                        <div>
                            <button
                                className="google-btn transition duration-150 w-60 mt-10 ease-in-out hover:bg-primary-700 hover:shadow-lg hover:text-white focus:bg-primary-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-primary-800 active:shadow-lg"
                                data-te-ripple-init
                                data-te-ripple-color="light"
                            >
                                <span className="google-icon">
                                    <img src={googleIcon} />
                                </span>
                                <span className="google-text">Sign in with Google</span>
                            </button>
                        </div>
                    </form>
                </div>
                {/*
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
                </div> */}
            </div>
        </>
    );
}
