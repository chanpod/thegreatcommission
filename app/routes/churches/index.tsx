import { json, LoaderArgs } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Button } from "~/src/components/button/Button";
import { prismaClient } from "~/server/dbConnection";
import { PlusIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization } from "@prisma/client";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";
import EmptyAvatar from "~/src/components/avatar/EmptyAvatar";
import useIsLoggedIn from "~/src/hooks/useIsLoggedIn";
import List from "~/src/components/listItems/List";
import OrganizationListItem from "~/src/components/listItems/components/OrganizationListItem";
import { Card } from "flowbite-react";
export const loader = async ({ request }: LoaderArgs) => {
    const churches = await prismaClient.churchOrganization.findMany({
        include: {
            missions: false,
            associations: false,
        },
    });

    return json({
        churches: churches,
    });
};

export default function ChurchPage() {
    const loaderData = useLoaderData();
    const { isLoggedIn, user } = useIsLoggedIn();

    return (
        <Card className="flex-col text-black space-y-4">
            <div className="md:flex-col sm:flex-row">
                <div className="flex justify-between items-center">
                    <h1 className="text-3xl">Organizations</h1>
                    {isLoggedIn && (
                        <Link to="/churches/create">
                            <Button className="w-40 flex items-center justify-center space-x-2">
                                <PlusIcon className="w-5 h-5" />
                                <span>Create</span>
                            </Button>
                        </Link>
                    )}
                </div>

                <hr className="my-4" />

                <div>
                    <List>
                        {loaderData?.churches?.map((church: ChurchOrganization) => {
                            return (
                                <Row key={church.id}>
                                    <Link to={`/churches/${church.id}`}>
                                        <OrganizationListItem church={church} />
                                    </Link>
                                </Row>
                            );
                        })}
                    </List>
                </div>
            </div>
        </Card>
    );
}
