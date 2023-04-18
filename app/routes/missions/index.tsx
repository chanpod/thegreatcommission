import { PlusIcon } from "@heroicons/react/24/outline";
import { Missions } from "@prisma/client";
import { LoaderArgs, json } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { Card, Select } from "flowbite-react";
import { map } from "lodash";
import { prismaClient } from "~/server/dbConnection";
import { Button } from "~/src/components/button/Button";
import { SearchEntityType } from "~/src/components/header/SearchBar";
import List from "~/src/components/listItems/List";
import { MissionRowCard } from "~/src/components/listItems/components/MissionRowCard";
import MissionRowItem from "~/src/components/listItems/components/MissionRowItem";
import Toolbar from "~/src/components/toolbar/Toolbar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const loader = async ({ request }: LoaderArgs) => {
    const missions = await prismaClient.missions.findMany({
        include: {
            ChurchOrganization: true,
        },
    });

    return json({
        missions: missions,
    });
};



export default function ChurchPage() {
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
                    {map(missions, (mission: Missions) => {
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
