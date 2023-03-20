import { Missionary } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";

export const loader = async ({ request, params }: LoaderArgs) => {
    const url = new URL(request.url);

    const missionaries = await prismaClient.missionary.findMany({
        where: {
            missions: {
                none: {},
            },
        },
    });

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
                        return (
                            <Row key={missionary.id}>
                                <div className="cursor-pointer" onClick={() => addMissionary(missionary)}>
                                    <RowItem>
                                        <div className="flex-shrink-0">
                                            <EmptyAvatar />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={primaryText}>
                                                {missionary.firstName}, {missionary.lastName}
                                            </p>
                                            <p className={secondaryText}>
                                                {missionary.city} {missionary.city ? "," : null} {missionary.state}
                                            </p>
                                        </div>
                                    </RowItem>
                                </div>
                            </Row>
                        );
                    })}
                </List>
            </div>
        </div>
    );
};

export default AddMissionary;
