import { redirect } from "@remix-run/node";
import { LoaderArgs } from "remix";
import { authenticator } from "~/server/auth/strategies/authenticaiton";

export let loader = async ({ request }: LoaderArgs) => {
    await authenticator.logout(request, {
        redirectTo: "/login",
    });
};
