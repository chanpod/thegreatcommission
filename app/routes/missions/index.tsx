import { PlusIcon } from "@heroicons/react/24/outline";
import { Missionary, Missions } from "@prisma/client";
import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/src/components/button/Button";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import { prismaClient } from "~/server/dbConnection";
import List from "~/src/components/listItems/List";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

export const loader = async ({ request }: LoaderArgs) => {
    const missions = await prismaClient.missions.findMany();

    return json({
        missions: missions,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    const { isLoggedIn, user } = useIsLoggedIn();
    return (
        <div className="flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Create or find Missionaries</h1>
                {isLoggedIn && (
                    <Link to="/missionaries/create">
                        <Button className="w-40 flex items-center justify-center space-x-2">
                            <PlusIcon className="w-5 h-5" />
                            <span>Create</span>
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mt-8 border-t-2 border-gray-400">
                <h1 className="mt-4 text-2xl">Missionaries</h1>
                <List>
                    {loaderData?.missions?.map((mission: Missions) => {
                        return (
                            <Row key={mission.id}>
                                <Link to={`/missionaries/${mission.id}`}>
                                    <RowItem>
                                        <div className="flex-shrink-0">
                                            <EmptyAvatar />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={primaryText}>
                                                {mission.title}
                                            </p>
                                            <p className={secondaryText}>
                                                {mission.churchOrganizationId}
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
