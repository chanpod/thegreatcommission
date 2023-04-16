import { Button, Card } from "flowbite-react";
import React from "react";
import List from "../listItems/List";
import { ChurchOrganization } from "@prisma/client";
import { map } from "lodash";
import Row from "../listItems/Row";
import { Link } from "@remix-run/react";
import OrganizationListItem from "../listItems/components/OrganizationListItem";

export const OrgAssociations = ({ org }: { org: ChurchOrganization }) => {
    return (
        <Card className="flex-1">
            <h1 className="text-3xl">Associated Orgs</h1>
            <hr className="my-2" />
            <div className="h-full">
                <List>
                    {map(org?.associations, (org: ChurchOrganization) => {
                        return (
                            // <div key={church.id} className={`w-full rounded-lg hover:shadow-md shadow-sm p-2`}>Test</div>
                            <Row key={org.id}>
                                <Link to={`/churches/${org.id}`}>
                                    <OrganizationListItem church={org} />
                                </Link>
                            </Row>
                        );
                    })}
                </List>
            </div>
        </Card>
    );
};
