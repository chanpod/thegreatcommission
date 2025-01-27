import { redirect } from "react-router";

export const loader = async ({ params }: Route.LoaderArgs) => {
    throw redirect(`/churches/${params.organization}/details`);

};