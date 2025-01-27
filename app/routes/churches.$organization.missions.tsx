import { eq } from "drizzle-orm";
import { useLoaderData } from "react-router";
import { churchOrganization, missions as missionSchema } from "@/server/db/schema";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { NoData } from "~/components/ui/no-data";
import List from "~/src/components/listItems/List";
import { isNil, map } from "lodash-es";
import MissionRowCard from "~/src/components/listItems/components/MissionRowCard";

export const loader = async ({ params }) => {
    const missions = await db.select().from(missionSchema).where(eq(missionSchema.churchOrganizationId, params.organization));

    return { missions };
};

export default function MissionsList() {
    const { missions } = useLoaderData<typeof loader>();

    return (
        <PageLayout title="Missions">
            <div className="h-full">
                <List>
                    {isNil(missions) || missions.length === 0 ? (
                        <NoData message="No missions found" />
                    ) : (
                        map(missions, (mission) => {
                            return (
                                <MissionRowCard
                                    key={mission.id}
                                    mission={mission}
                                    linkActive
                                    sponsoringOrg={mission.ChurchOrganization}
                                />
                            );
                        }))}
                </List>
            </div>
        </PageLayout>
    );
}
