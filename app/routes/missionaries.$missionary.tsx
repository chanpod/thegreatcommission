
import { Pencil as PencilIcon } from "lucide-react";
import { Outlet, useLoaderData, useNavigate, useParams } from "react-router";

import { eq } from "drizzle-orm";
import { missionaries } from "server/db/schema";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsTrigger } from "~/components/ui/tabs";
import { db } from "~/server/dbConnection";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import type { Route } from "./+types";

export const action = async ({ request }: Route.ActionArgs) => {
    return {};
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const missionary = await db.select().from(missionaries).where(eq(missionaries.id, params.missionary!)).then(([missionary]) => missionary);

    return {
        missionary,
    };
};

const MissionaryPage = () => {
    const params = useParams();
    const loaderData = useLoaderData<typeof loader>();
    const { isLoggedIn, user } = useIsLoggedIn();
    const navigate = useNavigate();

    return (
        <div className="bg-white rounded-lg p-2 flex-col p-1 text-black space-y-4">
            <div className="flex">
                <div className="flex-1">
                    <div className="flex items-center justify-start">
                        <h1 className="text-3xl">
                            {loaderData.missionary?.firstName} {loaderData.missionary?.lastName}
                        </h1>
                    </div>
                </div>
                {isLoggedIn && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <span className="sr-only">Open user menu</span>
                                <PencilIcon className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/missionaries/${loaderData.missionary?.id}/edit`)}>
                                Edit
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <div className="lg:flex space-y-3 lg:space-x-3 lg:space-y-0">
                <div className="flex-1 space-y-3">
                    <Tabs aria-label="Tabs with icons">
                        <TabsTrigger value="details">Details</TabsTrigger>
                        <TabsTrigger value="missions">Missions</TabsTrigger>
                        <TabsContent value="details">
                            <Outlet />
                        </TabsContent>
                        <TabsContent value="missions">
                            <Outlet />
                        </TabsContent>
                    </Tabs>
                </div>
                
            </div>
        </div>
    );
};

export default MissionaryPage;
