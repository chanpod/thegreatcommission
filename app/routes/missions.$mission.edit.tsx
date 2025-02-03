import { CheckCircle as CheckCircleIcon } from "lucide-react";
import { Form, useLoaderData, useNavigate } from "react-router";
import { events, missions } from "server/db/schema";
import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";
import type { Route } from "./+types";
import CreateMissionForm from "~/src/components/forms/createMission/CreateMissionForm";
import { Button } from "~/components/ui/button";

import { Sheet, SheetContent } from "~/components/ui/sheet";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { EventDialog } from "~/components/events/EventDialog";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const mission = await db.select().from(events).where(eq(events.id, params.mission as string)).then((res) => res[0]);

    return {
        mission,
    };
};

const SubRoute = () => {
    const loaderData = useLoaderData();
    const navigate = useNavigate();

    const handleClose = () => {
        navigate(`/missions/${loaderData.mission.id}`);
    };

    const handleSubmit = () => {
        console.log("submit");
    };

    const handleDelete = () => {
        console.log("delete");
    };

    return (
        <EventDialog
            open={true}
            onOpenChange={(open) => !open && handleClose()}
            event={loaderData.mission}
            onSubmit={handleSubmit}
            onDelete={handleDelete}
            mode="edit"
        />
    );
};

export default SubRoute;
