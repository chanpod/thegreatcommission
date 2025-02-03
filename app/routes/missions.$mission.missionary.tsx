import { useFetcher, useLoaderData } from "react-router";
import { db } from "~/server/dbConnection";
import List from "~/src/components/listItems/List";
import MissionaryListItem from "~/src/components/missions/MissionaryListItem";
import type { Route } from "./+types";
import { eq, and, ne, notInArray } from "drizzle-orm";
import { missions, users, usersToMissions } from "server/db/schema";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const url = new URL(request.url);

    const missionsWithMissionaries = await db.select().from(missions)
        .where(eq(missions.id, params.mission as string));

    const missionaryIds = missionsWithMissionaries.map(m => m.id);

    const availableMissionaries = await db.select().from(users)
        .where(
            and(
                ne(users.id, params.mission as string),
                notInArray(users.id, missionaryIds)
            )
        );


    return {
        missionaries: availableMissionaries,
    };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
    const form = await request.formData();

    if (request.method === "POST") {
        const response = await db.insert(usersToMissions).values({
            userId: form.get("userId") as string,
            missionId: params.mission as string,
        });

        return {
            response,
        };
    } else if (request.method === "DELETE") {

        const response = await db.delete(usersToMissions)
            .where(eq(usersToMissions.userId, form.get("userId") as string));

        return {
            response,
        };
    }
};



const AddMissionary = () => {
    const loaderData = useLoaderData();
    const fetcher = useFetcher();
    function addMissionary(missionary: typeof users.$inferSelect) {
        fetcher.submit(
            {
                userId: missionary.id,
            },
            { method: "post" }
        );
    }

    return (
        <div>
            <h1 className="text-2xl ">Add Missionary</h1>
            <div>
                {loaderData?.missionaries.length === 0 ? <span>No missionaries to add right now</span> : null}
                <List>
                    {loaderData?.missionaries?.map((missionary: typeof users.$inferSelect) => {
                        return <MissionaryListItem editing key={missionary.id} missionary={missionary} />;
                    })}
                </List>
            </div>
        </div>
    );
};

export default AddMissionary;
