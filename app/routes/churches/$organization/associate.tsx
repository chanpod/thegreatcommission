import { PlusCircleIcon } from "@heroicons/react/24/outline";
import { ChurchOrganization } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Link, useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "flowbite-react";
import React from "react";
import { prismaClient } from "~/server/dbConnection";
import EmptyAvatar from "~/src/components/emptyAvatar/EmptyAvatar";
import OrganizationListItem from "~/src/components/listItems/components/OrganizationListItem";
import List from "~/src/components/listItems/List";
import Row from "~/src/components/listItems/Row";
import RowItem, { primaryText, secondaryText } from "~/src/components/listItems/RowItem";

export const loader = async ({ request, params }: LoaderArgs) => {
    const organization = await prismaClient.churchOrganization.findUnique({
        where: {
            id: params.organization,
        },
        include: {
            associations: true,
        },
    });

    const organizations = await prismaClient.churchOrganization.findMany({
        where: {
            id: {
                not: params.organization,
            },
            AND: {
                NOT: {
                    id: { in: organization?.associations.map((org) => org.id) },
                },
            },
        },
    });

    return json({
        parentOrg: organization,
        organizations,
    });
};

export const action = async ({ request, params }: ActionArgs) => {
    const form = await request.formData();

    if (request.method === "POST") {
        const org = JSON.parse(form.get("org") as string);
        const parentOrgId = form.get("parentOrgId") as string;

        if (org.id === parentOrgId) {
            throw new Error("Cannot associate with self");
        }

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: parentOrgId,
            },
            data: {
                associations: {
                    connect: {
                        id: org.id,
                    },
                },
            },
        });

        return json({ success: true, response });
    } else if (request.method === "DELETE") {
        const orgId = form.get("orgId") as string;
        const parentOrgId = form.get("parentOrgId") as string;

        const response = await prismaClient.churchOrganization.update({
            where: {
                id: parentOrgId,
            },
            data: {
                associations: {
                    disconnect: {
                        id: orgId,
                    },
                },
            },
        });

        return json({ success: true, response });
    }

    throw new Error("Method not allowed");
};

const AssociateChurch = () => {
    const loaderData = useLoaderData();
    const addOrgFetcher = useFetcher();

    function associateOrg(org: ChurchOrganization) {
        addOrgFetcher.submit(
            {
                org: JSON.stringify(org),
                parentOrgId: loaderData.parentOrg.id,
            },
            {
                method: "post",
            }
        );
    }    

    return (
        <div>
            <h1 className="text-3xl">Associate</h1>
            <hr className="my-2" />
            <List>
                {loaderData?.organizations?.map((church: ChurchOrganization) => {
                    return (
                        <div key={church.id} className="flex items-center">
                            <Row>
                                <OrganizationListItem church={church} />
                            </Row>
                            <Button pill={true} className="ml-2" onClick={() => associateOrg(church)}>
                                <PlusCircleIcon className="w-6 h-6" />
                            </Button>
                        </div>
                    );
                })}
            </List>
        </div>
    );
};

export default AssociateChurch;
