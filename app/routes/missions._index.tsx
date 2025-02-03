import { Plus as PlusIcon } from "lucide-react";
import { Link, useFetcher, useLoaderData } from "react-router";
import { map } from "lodash-es";
import { Button } from "~/components/ui/button";;
import { SearchEntityType } from "~/src/components/header/SearchBar";
import List from "~/src/components/listItems/List";
import { MissionRowCard } from "~/src/components/listItems/components/MissionRowCard";
import MissionRowItem from "~/src/components/listItems/components/MissionRowItem";
import Toolbar from "~/src/components/toolbar/Toolbar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import type { Route } from "./+types";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";
import { churchOrganization, events, missions } from "server/db/schema";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const missionsData = await db.select().from(events).where(eq(events.type, "mission"));

    return {
        missions: missionsData,
    };
};

export default function MissionsPage() {
    const loaderData = useLoaderData();
    const { isLoggedIn, user } = useIsLoggedIn();
    const fetcher = useFetcher();

    function onSearchChange(searchText: string) {
        fetcher.load(`/api/search?search=${encodeURI(searchText)}&type=${SearchEntityType.Mission}`);
    }

    const missions = fetcher.data?.missions || loaderData.missions;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Missions</h1>
                {isLoggedIn && (
                    <Link to="/missions/create">
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
                    {map(missions, (mission: typeof missions.$inferSelect) => {
                        // return <MissionRowItem key={mission.id} mission={mission} />;
                        {
                            JSON.stringify(mission);
                        }
                        return (
                            <>
                                <MissionRowCard
                                    key={mission.id}
                                    linkActive
                                    mission={mission}
                                    sponsoringOrg={mission.ChurchOrganization}
                                />
                            </>
                        );
                    })}
                </List>
            </div>
        </div>
    );
}
