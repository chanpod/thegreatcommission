import { ChurchOrganization } from "@prisma/client";
import { Card } from "shad/ui";
import pkg from "lodash";
import List from "../listItems/List";

const { map } = pkg;

import ChurchRowCard from "../listItems/components/ChurchRowCard";

export const OrgAssociations = ({ org }: { org: ChurchOrganization }) => {
    return (
        <Card className="flex-1">
            <h1 className="text-3xl">Associated Orgs</h1>
            <hr className="my-2" />
            <div className="h-full">
                <List>
                    {map(org?.associations, (org: ChurchOrganization) => {
                        return <ChurchRowCard key={org.id} church={org} />;
                    })}
                </List>
            </div>
        </Card>
    );
};
