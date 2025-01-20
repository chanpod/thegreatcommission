import { useLoaderData } from "react-router";
import type { Route } from "./+types";

export const loader = async ({ request }: Route.LoaderArgs) => {
    return {
        missionary: {
            id: "1",
            name: "John Doe",
        },
    };
};

export default function MissionaryEdit(){
    const loaderData = useLoaderData();

    return (
        <div>
            Edit
        </div>
    )
}