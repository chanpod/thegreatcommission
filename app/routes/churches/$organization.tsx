import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/src/components/server/dbConnection";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
    });

    return json({
        organization,
    });
};

const MissionaryPage = () => {
    const loaderData = useLoaderData<typeof loader>();
    return <h1 className="text-3xl"> Church: {loaderData.organization?.name}</h1>;
};

export default MissionaryPage;
