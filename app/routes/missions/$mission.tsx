import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useLoaderData, useParams } from "@remix-run/react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";

export const action = async({request}: ActionArgs) => {

    return json({})
}

export const loader = async ({ request, params }: LoaderArgs) => {
    const missionary = await prismaClient.missions.findUnique({
        where: {
            id: params.mission,
        },
    });

    return json({
        missionary,
    });
};

const MissionaryPage = () => {
    const params = useParams();
    const loaderData = useLoaderData<typeof loader>();
    return <h1 className="text-3xl"> Missionary: {loaderData.missionary?.title}</h1>;
};

export default MissionaryPage;
