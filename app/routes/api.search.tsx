import { defer, json, LoaderArgs } from "@remix-run/node";
import { prismaClient } from "~/server/dbConnection";

export const loader = async ({ request, params }: LoaderArgs) => {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const search = searchParams.get("search");

    const missionaryPromise = prismaClient.missionary.findMany({
        where: {
            OR: [
                {
                    firstName: {
                        contains: search ?? "",
                        mode: "insensitive",
                    },
                },
                {
                    lastName: {
                        contains: search ?? "",
                        mode: "insensitive",
                    },
                },
            ],
        },
    });

    const churchesPromise = prismaClient.churchOrganization.findMany({
        where: {
            name: {
                contains: search ?? "",
                mode: "insensitive",
            },
        },
    });

    const missionsPromise = prismaClient.missions.findMany({
        where: {
            title: {
                contains: search ?? "",
                mode: "insensitive",
            },
        },
    });

    const responses = await Promise.all([missionaryPromise, churchesPromise, missionsPromise]);

    return json({
        missionary: responses[0],
        churches: responses[1],
        missions: responses[2],
    });
};
