import { PlusIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { map } from "lodash";
import { prismaClient } from "~/server/dbConnection";
import { Button } from "~/src/components/button/Button";
import { SearchEntityType } from "~/src/components/header/SearchBar";
import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";
import List from "~/src/components/listItems/List";
import Toolbar from "~/src/components/toolbar/Toolbar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
export const loader = async ({ request }: LoaderArgs) => {
    const churches = await prismaClient.churchOrganization.findMany({
        include: {
            missions: false,
            associations: false,
        },
    });

    return json({
        churches: churches,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    const { isLoggedIn, user } = useIsLoggedIn();
    const fetcher = useFetcher();

    function onSearchChange(searchText: string) {
        fetcher.load(`/api/search?search=${encodeURI(searchText)}&type=${SearchEntityType.ChurchOrganization}`);
    }

    const churches = fetcher.data?.churches || loaderData.churches;
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Organizations</h1>
                {isLoggedIn && (
                    <Link to="/churches/create">
                        <Button className="w-40 flex items-center justify-center space-x-2">
                            <PlusIcon className="w-5 h-5" />
                            <span>Create</span>
                        </Button>
                    </Link>
                )}
            </div>

            <Toolbar onChange={onSearchChange} />
            <div>
                <List>
                    {map(churches, (church: ChurchOrganization) => {
                        return <ChurchRowCard linkActive church={church} key={church.id} />;
                    })}
                </List>
            </div>
        </div>
    );
}
