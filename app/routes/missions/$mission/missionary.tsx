import { Missionary } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { prismaClient } from "~/server/dbConnection";
import List from "~/src/components/listItems/List";
import MissionaryListItem from "~/src/components/missions/MissionaryListItem";


export const loader = async ({ request, params }: LoaderArgs) => {
    const url = new URL(request.url);

    const missionsWithMissionaries = await prismaClient.missions.findUnique({
        where: {
            id: params.mission,
        },
        include: {
            missionaries: true,
        },
    });

    const missionaries = await prismaClient.missionary.findMany({
        where: {
            id: {
                not: params.mission,
            },
            AND: {
                NOT: {
                    id: { in: missionsWithMissionaries?.missionaries.map((org) => org.id) },
                },
            },
        },
    });

    // const missionaries = await prismaClient.missionary.findMany({
    //     where: {
    //         missions: {
    //             none: {},
    //         },
    //     },
    // });

    return json({
        missionaries: missionaries,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    const form = await request.formData();

    if (request.method === "POST") {
        const response = await prismaClient.missions.update({
            where: {
                id: params.mission,
            },
            data: {
                missionaries: {
                    connect: {
                        id: form.get("missionaryId") as string,
                    },
                },
            },
        });

        return json({
            response,
        });
    } else if (request.method === "DELETE") {
        const response = await prismaClient.missions.update({
            where: {
                id: params.mission,
            },
            data: {
                missionaries: {
                    disconnect: {
                        id: form.get("linkId") as string,
                    },
                },
            },
        });

        return json({
            response,
        });
    }
};



const AddMissionary = () => {
    const loaderData = useLoaderData();
    const fetcher = useFetcher();
    function addMissionary(missionary: Missionary) {
        fetcher.submit(
            {
                missionaryId: missionary.id,
            },
            { method: "post" }
        );
    }

    return (
        <div>
            <h1 className="text-2xl ">Add Missionary</h1>
            <div>
                {loaderData?.missionaries.length === 0 ? <span>No missionaries to add right now</span> : null}
                <List>
                    {loaderData?.missionaries?.map((missionary: Missionary) => {
                        return <MissionaryListItem editing key={missionary.id} missionary={missionary} />;
                    })}
                </List>
            </div>
        </div>
    );
};

export default AddMissionary;
