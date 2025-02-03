import { ArrowRight as ArrowTopRightOnSquareIcon } from "lucide-react";
import { Calendar as CalendarIcon } from "lucide-react";
import { DollarSign as CurrencyDollarIcon } from "lucide-react";
import { Pencil as PencilIcon } from "lucide-react";
import { ShieldCheck as ShieldCheckIcon } from "lucide-react";
import { Trash as TrashIcon } from "lucide-react";

import { Link, Outlet, useActionData, useFetcher, useLoaderData, useNavigate } from "react-router";
import { format } from "date-fns";
import { Fragment, useState } from "react";

import { db } from "~/server/dbConnection";
import { eq } from "drizzle-orm";
import { missions, churchOrganization, events } from "server/db/schema";
import CurrencyFormatter from "~/src/components/forms/currencyFormat/CurrencyFormatter";

import MissionDescription from "~/src/components/missions/Description";
import MissionMissionaries from "~/src/components/missions/Missionaries";
import { classNames } from "~/src/helpers";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "~/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import type { Route } from "./+types";

export const action = async ({ request, params }: Route.ActionArgs) => {
    if (request.method === "PUT") {
        const formData = await request.formData();
        const newMission = Object.fromEntries(formData);

        const response = await db.update(missions)
            .set(newMission)
            .where(eq(missions.id, params.mission as string));

        return {
            newMission: response,
        };
    }

    throw new Error("Method not allowed");
};

export const loader = async ({ request, params }: Route.LoaderArgs) => {
    const missionResponse = await db.select()
        .from(events)
        .where(eq(events.id, params.mission as string))
        .innerJoin(churchOrganization, eq(events.churchOrganizationId, churchOrganization.id))
        .then((res) => res[0]);

    console.log(missionResponse)

    return {
        mission: missionResponse.events,
    };
};

const MissionaryPage = () => {
    const { isLoggedIn } = useIsLoggedIn();
    const [showUpdateToast, setShowUpdateToast] = useState(false);
    const loaderData = useLoaderData<typeof loader>();
    const actionData = useActionData();
    const deleteFetcher = useFetcher();
    const loading = deleteFetcher.state === "submitting" || deleteFetcher.state === "loading";
    const navigate = useNavigate();
    const [showDialog, setShowDialog] = useState(false);

    function deleteChurch() {
        deleteFetcher.submit({}, { method: "delete", action: `/missions/${loaderData.mission?.id}` });
    }

    function getEndTime() {
        if (loaderData.mission?.endDate) {
            return format(new Date(loaderData.mission?.endDate ?? ""), "MM-dd-yyyy");
        } else {
            return "Indefinite";
        }
    }

    console.log(loaderData.mission)

    return (
        <div>
            <div className="flex">
                <div className="flex-1">
                    <div className="flex items-center justify-start">
                        <h1 className="flex text-3xl relative">
                            {loaderData.mission.sensitive && (
                                <ShieldCheckIcon color="green" className="rounded-full h-8 w-8 " />
                            )}
                            Mission: {loaderData.mission?.title}{" "}
                        </h1>
                        <div className="flex flex-col justify-center items-center">
                            <div className="text-green-700 text-3xl flex items-center">
                                <CurrencyDollarIcon className="w-8 h-8" />{" "}
                                <CurrencyFormatter skipDollarSign value={loaderData.mission?.investment ?? 0} />
                            </div>
                            <div className="text-gray-500 ml-3 ">Community Investment </div>
                        </div>
                    </div>
                    <div className="text-sm text-gray-500 items-center flex">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {format(new Date(loaderData.mission?.startDate), "MM-dd-yyyy")} until {getEndTime()}
                    </div>
                    <div className="text-sm text-gray-500">
                        <Link
                            className="flex items-center"
                            to={`/churches/${loaderData.mission?.ChurchOrganization?.id}`}
                        >
                            Association: {loaderData.mission?.ChurchOrganization?.name}
                            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
                {isLoggedIn && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="icon">
                                <span className="sr-only">Open menu</span>
                                <PencilIcon className="h-6 w-6" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/missions/${loaderData.mission?.id}/edit`)}>
                                Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate(`/missions/${loaderData.mission.id}/missionary`)}>
                                Edit Missionaries
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => setShowDialog(true)}>
                                <TrashIcon className="h-4 w-4 mr-2" />
                                Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
            <div className="lg:flex space-y-3 lg:space-x-3 lg:space-y-0">
                <div className="flex-1 space-y-3">
                    <Tabs defaultValue="details">
                        <TabsList>
                            <TabsTrigger value="details">Details</TabsTrigger>
                            <TabsTrigger value="missionaries">Missionaries</TabsTrigger>
                        </TabsList>
                        <TabsContent value="details">
                            <MissionDescription mission={loaderData.mission} />
                        </TabsContent>
                        <TabsContent value="missionaries">
                            <MissionMissionaries mission={loaderData.mission} />
                        </TabsContent>
                    </Tabs>
                </div>
                <div className="flex-1">
                    <Card>
                        <Outlet />
                    </Card>
                </div>
            </div>

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6">
                        <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                            Are you sure you want to delete this mission? This action cannot be undone.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={deleteChurch}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

export default MissionaryPage;
