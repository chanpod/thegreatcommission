import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/src/components/button/Button";
import { prismaClient } from "~/src/components/server/dbConnection";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization } from "@prisma/client";
export const loader = async ({ request }: LoaderArgs) => {
    const churches = await prismaClient.churchOrganization.findMany();

    return json({
        churches: churches,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    console.log("loaderData", loaderData)
    return (
        <div className="flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Create or find Missions Organization</h1>
                <Link to="/churches/create">
                    <Button className="w-40 flex items-center justify-center space-x-2">
                        <PlusIcon className="w-5 h-5" />
                        <span>Create</span>
                    </Button>
                </Link>
            </div>

            <div className="mt-8 border-t-2 border-gray-400">
                <h1 className="mt-4 text-2xl">Organizations</h1>
                <ul className="max-w-md divide-y  divide-gray-200 dark:divide-gray-700">
                    {loaderData?.churches?.map((church: ChurchOrganization) => {
                        return (
                            <li className="p-3 sm:pb-4">
                                <div className="flex items-center space-x-4">
                                    <div className="flex-shrink-0">
                                        {/* <img
                                        className="w-8 h-8 rounded-full"
                                        src="/docs/images/people/profile-picture-1.jpg"
                                        alt="Neil image"
                                    /> */}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {church.name}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate dark:text-gray-400">
                                            {church.city}, {church.state}
                                        </p>
                                    </div>
                                    <div className="inline-flex items-center text-base font-semibold text-gray-900">
                                        {church.zip}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
