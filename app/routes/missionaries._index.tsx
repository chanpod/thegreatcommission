import { Plus as PlusIcon } from "lucide-react";
import { map } from "lodash-es";
import { Link, useFetcher, useLoaderData } from "react-router";
import { Button } from "~/components/ui/button";
import { SearchEntityType } from "~/src/components/header/SearchBar";
import List from "~/src/components/listItems/List";
import { MissionaryRowCard } from "~/src/components/listItems/components/MissionaryRowCard";
import Toolbar from "~/src/components/toolbar/Toolbar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import type { Route } from "./+types";
import { users } from "server/db/schema";
import { db } from "~/server/dbConnection";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const url = new URL(request.url);

    const missionariesData = await db.select().from(users);

    return {
        missionaries: missionariesData,
    };
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
                    {map(missionaries, (missionary: typeof missionaries.$inferSelect) => {
                        return <MissionaryRowCard linkActive key={missionary.id} missionary={missionary} />;
                    })}
                </List>
            </div>
        </div>
    );
}
