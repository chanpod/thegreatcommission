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

const Toolbar = ({ onChange }: { onChange: (searchText: string) => void }) => {
    return (
        <form>
            <label className="mb-2 text-sm font-medium text-gray-900 sr-only dark:text-white">Search</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                        aria-hidden="true"
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        ></path>
                    </svg>
                </div>
                <input
                    onChange={(event) => onChange(event.target.value)}
                    type="search"
                    id="default-search"
                    className="block w-full p-4 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    placeholder="Search Missions..."
                    required
                />
                <button
                    type="submit"
                    className="text-white absolute right-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Search
                </button>
            </div>
        </form>
    );
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
        <Card className="flex-col text-black space-y-4">
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
        </Card>
    );
}
