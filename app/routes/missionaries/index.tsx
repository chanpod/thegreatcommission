import { PlusIcon } from "@heroicons/react/24/outline";
import { Missionary } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/src/components/button/Button";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import { prismaClient } from "~/server/dbConnection";
import List from "~/src/components/listItems/List";

export const loader = async ({ request }: LoaderArgs) => {
    const url = new URL(request.url);

    const missionaries = await prismaClient.missionary.findMany();

    return json({
        missionaries: missionaries,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();

    return (
        <div className="flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Create or find Missionaries</h1>
                <Link to="/missionaries/create">
                    <Button className="w-40 flex items-center justify-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Create</span>
                    </Button>
                </Link>
            </div>

            <div className="mt-8 border-t-2 border-gray-400">
                <h1 className="mt-4 text-2xl">Missionaries</h1>
                <List>
                    {loaderData?.missionaries?.map((missionary: Missionary) => {
                        return (
                            <Row key={missionary.id}>
                                <Link to={`/missionaries/${missionary.id}`}>
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
                                </Link>
                            </Row>
                        );
                    })}
                </List>
            </div>
        </div>
    );
}
