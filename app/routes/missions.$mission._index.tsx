import { useLoaderData } from "react-router";

import WorldMap from "~/src/components/maps/WorldMap";
import type { Route } from "./+types";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";
import { missions } from "server/db/schema";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const mission = await db.select().from(missions).where(eq(missions.id, params.mission as string));

    return {
        mission,
    };
};

const Index = () => {
    const { mission }: { mission: typeof missions.$inferSelect } = useLoaderData();
    return (
        <div>
            <WorldMap pins={mission.lat && mission.lng ? [{ lat: mission.lat, lng: mission.lng }] : undefined} />
        </div>
    );
};

export default Index;
