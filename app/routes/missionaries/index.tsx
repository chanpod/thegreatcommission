import { PlusIcon } from "@heroicons/react/24/outline";
import { Missionary } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/src/components/button/Button";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import Row from "~/src/components/listItems/Row";
import RowItem from "~/src/components/listItems/RowItem";
import { prismaClient } from "~/server/dbConnection";

export const loader = async ({ request }: LoaderArgs) => {
    const url = new URL(request.url);
   
    const missionaries = await prismaClient.missionary.findMany();

    return json({
        missionaries: missionaries,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    console.log("loaderData", loaderData);
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
                <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
                    {loaderData?.missionaries?.map((missionary: Missionary) => {
                        return (
                            <Link key={missionary.id} to={`/missionaries/${missionary.id}`}>
                                <Row>
                                    <RowItem>
                                        <div className="flex-shrink-0">
                                            <EmptyAvatar />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {missionary.firstName}, {missionary.lastName}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                                {missionary.city} {missionary.city ? "," : null} {missionary.state}
                                            </p>
                                        </div>
                                    </RowItem>
                                </Row>
                            </Link>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
