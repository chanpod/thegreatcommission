import { ChurchOrganization } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organizations = await prismaClient.churchOrganization.findMany({});

    return json({
        organizations,
    });
};

const AssociateChurch = () => {
    const loaderData = useLoaderData();

    return (
        <div>
            <h1 className="text-3xl">Associate</h1>
            <hr className="my-2" />
            <List>
                {loaderData?.organizations?.map((church: ChurchOrganization) => {
                    return (
                        // <div key={church.id} className={`w-full rounded-lg hover:shadow-md shadow-sm p-2`}>Test</div>
                        <Row key={church.id}>
                            <Link to={`/churches/${church.id}`}>
                                <RowItem>
                                    <div className="mr-3">
                                        <EmptyAvatar />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={primaryText}>{church.name}</p>
                                        <p className={secondaryText}>
                                            {church.city}, {church.state}
                                        </p>
                                    </div>
                                    <div className={secondaryText}>{church.zip}</div>
                                </RowItem>
                            </Link>
                        </Row>
                    );
                })}
            </List>
        </div>
    );
};

export default AssociateChurch;
