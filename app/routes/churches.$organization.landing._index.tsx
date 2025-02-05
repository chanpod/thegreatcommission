import { useLoaderData, Link } from "react-router";
import LandingPage from "~/src/components/churchLandingPage/LandingPage";
import { db } from "~/server/dbConnection";
import { churchOrganization, events, landingPageConfig, users, usersToRoles } from "server/db/schema";
import { and, eq, gte } from "drizzle-orm";
import type { Route } from "../+types/root";
import { Button } from "~/components/ui/button";
import { Settings } from "lucide-react";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { ChurchService } from "~/services/ChurchService";

export const loader = async ({ params, request }: Route.LoaderArgs) => {
    const user = await authenticator.isAuthenticated(request);
    const churchService = new ChurchService(undefined, undefined);
    const isAdmin = user && churchService.userIsAdmin(user, []);

    const organization = await db
        .select()
        .from(churchOrganization)
        .where(eq(churchOrganization.id, params.organization))
        .then(res => res[0]);

    const config = await db
        .select()
        .from(landingPageConfig)
        .where(eq(landingPageConfig.churchOrganizationId, params.organization))
        .then(res => res[0]);

    // Get recurring service times
    const serviceTimes = await db
        .select()
        .from(events)
        .where(
            and(
                eq(events.churchOrganizationId, params.organization),
                eq(events.type, 'recurring')
            )
        );

    const now = new Date();
    // Get upcoming local events (non-recurring, non-mission)
    const upcomingEvents = await db
        .select()
        .from(events)
        .where(
            and(
                eq(events.churchOrganizationId, params.organization),
                eq(events.type, 'local'),
                gte(events.startDate, now)
            )
        )
        .limit(3); // Only get the next 3 upcoming events

    return {
        organization,
        config,
        serviceTimes,
        upcomingEvents,
        isAdmin
    };
};

export default function Landing() {
    const { organization, config, serviceTimes, upcomingEvents, isAdmin } = useLoaderData<typeof loader>();

    return (
        <div className="relative">

            <div className="absolute top-[-100px] right-4 z-50">
                <Link to="config">
                    <Button variant="outline" size="icon" className="bg-white shadow-md">
                        <Settings className="h-4 w-4" />
                        <span className="sr-only">Edit Landing Page</span>
                    </Button>
                </Link>
            </div>

            <LandingPage
                organization={organization}
                config={config}
                serviceTimes={serviceTimes}
                upcomingEvents={upcomingEvents}
            />
        </div>
    );
} 
