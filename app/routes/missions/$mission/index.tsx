import { Missions } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";
import WorldMap from "~/src/components/maps/WorldMap";

export const loader = async ({ request, params }: LoaderArgs) => {
    const mission = await prismaClient.missions.findUnique({
        where: {
            id: params.mission,
        },
        include: {
            ChurchOrganization: true,
            missionaries: true,
        },
    });

    return json({
        mission,
    });
};

const Index = () => {
    const { mission }: { mission: Missions } = useLoaderData();
    return (
        <div>
            <WorldMap pins={mission.location ? [mission.location] : undefined} />
        </div>
    );
};

export default Index;
