


import { Link, useFetcher, useLoaderData } from "react-router";
import { map } from "lodash-es";

import { Button } from "~/components/ui/button";;
import { SearchEntityType } from "~/src/components/header/SearchBar";
import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";
import List from "~/src/components/listItems/List";
import Toolbar from "~/src/components/toolbar/Toolbar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import type { Route } from "../+types/root";
import { churchOrganization } from "server/db/schema";
import { db } from "~/server/dbConnection";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const churches = await db.select().from(churchOrganization);

    return {
        churches: churches,
    };
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
                            
                            <span>Create</span>
                        </Button>
                    </Link>
                )}
            </div>

            <Toolbar onChange={onSearchChange} />
            <div>
                <List>
                    {map(churches, (church: typeof churchOrganization.$inferSelect) => {
                        return <ChurchRowCard linkActive church={church} key={church.id} />;
                    })}
                </List>
            </div>
        </div>
    );
}
