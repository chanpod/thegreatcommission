import { eq, and } from "drizzle-orm";
import { Link, Outlet, useLoaderData } from "react-router";
import { events } from "server/db/schema";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { NoData } from "~/components/ui/no-data";
import List from "~/src/components/listItems/List";
import { isNil, map } from "lodash-es";
import { MissionRowCard } from "~/src/components/listItems/components/MissionRowCard";
import { Button } from "~/components/ui/button";
import type { Route } from "../+types/root";

export const loader = async ({ params }: Route.LoaderArgs) => {
    const missionEvents = await db
        .select()
        .from(events)
        .where(
            and(
                eq(events.churchOrganizationId, params.organization),
                eq(events.type, 'mission')
            )
        );

    return { missions: missionEvents };
};

export default function MissionsList() {
    const { missions } = useLoaderData<typeof loader>();

    return (
        <PageLayout title="Mission Trips">
            <div className="h-full">
                <List>
                    {isNil(missions) || missions.length === 0 ? (
                        <NoData message="No mission trips found" />
                    ) : (
                        map(missions, (mission) => {
                            return (
                                <MissionRowCard
                                    key={mission.id}
                                    mission={mission}
                                    linkActive
                                />
                            );
                        }))}
                </List>
            </div>

            <Outlet />
        </PageLayout>
    );
}
