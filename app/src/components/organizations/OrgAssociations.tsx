import List from "../listItems/List";
import { isNil, map } from "lodash-es";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import ChurchRowCard from "../listItems/components/ChurchRowCard";
import type { churchOrganization } from "server/db/schema";
import { NoData } from "~/components/ui/no-data";

export const OrgAssociations = ({ org }: { org: typeof churchOrganization }) => {
    return (
        <Card className="bg-white">
            <CardContent>
                <CardHeader>
                    <h1 className="text-2xl text-gray-900">Associated Orgs</h1>

                </CardHeader>
                <hr className="border-gray-200" />
                <div className="h-full">
                    {isNil(org?.associations) || org?.associations.length === 0 ? (
                        <NoData message="No associated organizations found" />
                    ) : (
                        <List>
                            {map(org?.associations, (org: typeof churchOrganization) => {
                                return <ChurchRowCard key={org.id} church={org} />;
                            })}
                        </List>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

