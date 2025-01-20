import { redirect } from "react-router";
import type { Route } from "./+types";
import { authenticator } from "~/server/auth/strategies/authenticaiton";

export let loader = async ({ request }: Route.LoaderArgs) => {
    await authenticator.logout(request, {
        redirectTo: "/login",
    });
};
