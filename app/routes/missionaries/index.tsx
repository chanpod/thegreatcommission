import { PlusIcon } from "@heroicons/react/24/outline";
import { Missionary } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { Card } from "flowbite-react";
import { map } from "lodash";
import { prismaClient } from "~/server/dbConnection";
import { Button } from "~/src/components/button/Button";
import { SearchEntityType } from "~/src/components/header/SearchBar";
import List from "~/src/components/listItems/List";
import { MissionaryRowCard } from "~/src/components/listItems/components/MissionaryRowCard";
import MissionaryListItem from "~/src/components/missions/MissionaryListItem";
import Toolbar from "~/src/components/toolbar/Toolbar";

import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const loader = async ({ request }: LoaderArgs) => {
    const url = new URL(request.url);

    const missionaries = await prismaClient.missionary.findMany();

    return json({
        missionaries: missionaries,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    const { isLoggedIn, user } = useIsLoggedIn();

    const fetcher = useFetcher();

    function onSearchChange(searchText: string) {
        fetcher.load(`/api/search?search=${encodeURI(searchText)}&type=${SearchEntityType.Missionary}`);
    }

    const missionaries = fetcher.data?.missionary || loaderData.missionaries;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Missionaries</h1>
                {isLoggedIn && (
                    <Link to="/missionaries/create">
                        <Button className="w-40 flex items-center justify-center space-x-2">
                            <PlusIcon className="w-5 h-5" />
                            <span>Create</span>
                        </Button>
                    </Link>
                )}
            </div>
            <hr className="my-4" />
            <Toolbar onChange={onSearchChange} />
            <div>
                <List>
                    {map(missionaries, (missionary: Missionary) => {
                        return <MissionaryRowCard linkActive key={missionary.id} missionary={missionary} />;
                    })}
                </List>
            </div>
        </div>
    );
}
