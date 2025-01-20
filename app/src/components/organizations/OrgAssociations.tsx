import List from "../listItems/List";
import { map } from "lodash-es";
import { Card } from "~/components/ui/card";
import ChurchRowCard from "../listItems/components/ChurchRowCard";
import type { churchOrganization } from "server/db/schema";

export const OrgAssociations = ({ org }: { org: typeof churchOrganization }) => {
    return (
        <Card className="flex-1">
            <h1 className="text-3xl">Associated Orgs</h1>
            <hr className="my-2" />
            <div className="h-full">
                <List>
                    {map(org?.associations, (org: typeof churchOrganization) => {
                        return <ChurchRowCard key={org.id} church={org} />;
                    })}
                </List>
            </div>
        </Card>
    );
};
