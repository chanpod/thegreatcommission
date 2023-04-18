import { LoaderArgs, json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react"



export const loader = async ({ request }: LoaderArgs) => {
    return json({})
}

export default function MissionaryEdit(){
    const loaderData = useLoaderData();

    return (
        <div>
            Edit
        </div>
    )
}