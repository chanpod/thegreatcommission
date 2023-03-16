import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/src/components/button/Button";
import { prismaClient } from "~/server/dbConnection";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization } from "@prisma/client";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import List from "~/src/components/listItems/List";
export const loader = async ({ request }: LoaderArgs) => {
    const churches = await prismaClient.churchOrganization.findMany();

    return json({
        churches: churches,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    const { isLoggedIn, user } = useIsLoggedIn();
    
    return (
        <div className="flex-col">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl">Create or find Missions Organization</h1>
                {isLoggedIn && (
                    <Link to="/churches/create">
                        <Button className="w-40 flex items-center justify-center space-x-2">
                            <PlusIcon className="w-5 h-5" />
                            <span>Create</span>
                        </Button>
                    </Link>
                )}
            </div>

            <div className="mt-8 border-t-2 border-gray-400">
                <h1 className="mt-4 mb-3 text-3xl">Organizations</h1>
                <List>
                    {loaderData?.churches?.map((church: ChurchOrganization) => {
                        return (
                            // <div key={church.id} className={`w-full rounded-lg hover:shadow-md shadow-sm p-2`}>Test</div>
                            <Row key={church.id}>
                                <Link to={`/churches/${church.id}`}>
                                    <RowItem>
                                        <div className="mr-3">
                                            <EmptyAvatar />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={primaryText}>{church.name}</p>
                                            <p className={secondaryText}>
                                                {church.city}, {church.state}
                                            </p>
                                        </div>
                                        <div className={secondaryText}>{church.zip}</div>
                                    </RowItem>
                                </Link>
                            </Row>
                        );
                    })}
                </List>
            </div>
        </div>
    );
}
