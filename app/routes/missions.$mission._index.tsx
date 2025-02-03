import { useLoaderData } from "react-router";

import WorldMap from "~/src/components/maps/WorldMap";
import type { Route } from "./+types";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";
import { events, missions } from "server/db/schema";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const mission = await db.select().from(events).where(eq(events.id, params.mission as string)).then((res) => res[0]);

    return {
        mission,
    };
};

const Index = () => {
    const { mission } = useLoaderData<typeof loader>();
    return (
        <div>
            <WorldMap pins={mission.lat && mission.lng ? [{ lat: mission.lat, lng: mission.lng }] : undefined} />
        </div>
    );
};

export default Index;
