import { redirect } from "react-router";
import { Form, useFetcher, useNavigation } from "react-router";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import googleIcon from "~/src/assets/images/googleIcon.svg";
import type { Route } from "./+types";

export const loader = async ({ request }: Route.LoaderArgs) => {
    // const users = await prismaClient.user.findMany();
    // return json({
    //     users: users,
    // });

    return redirect('/')
};

export const action = async ({ request }: Route.ActionArgs) => {
    console.log("Logging in");

    return await authenticator.isAuthenticated(request);
};

export default function LoginPage() {
    const transition = useNavigation();
    const deleteFetcher = useFetcher();
    const loading =
        transition.state === "submitting" ||
        transition.state === "loading" ||
        deleteFetcher.state === "submitting" ||
        deleteFetcher.state === "loading";

    return (
        <>
            <div className="flex-col items-center">
                <div className="text-center">
                    <h1 className="text-5xl"> Login </h1>
                </div>
                <div>
                    <Form method="post" className="flex-col items-center justify-center w-48 space-y-2">
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
                    </Form>
                </div>
            </div>
        </>
    );
}
