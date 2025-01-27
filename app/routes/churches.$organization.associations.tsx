import { eq } from "drizzle-orm";
import { useLoaderData } from "react-router";
import { churchOrganization } from "@/server/db/schema";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { NoData } from "~/components/ui/no-data";
import List from "~/src/components/listItems/List";
import ChurchRowCard from "~/src/components/listItems/components/ChurchRowCard";


export const loader = async ({ params }) => {
    const associations = await db
        .select({
            childOrg: churchOrganization,
        })
        .from(churchOrganization)
        .where(eq(churchOrganization.parentOrganizationId, params.organization))


    return { associations };
};

export default function AssociationsList() {
    const { associations } = useLoaderData<typeof loader>();

    return (
        <PageLayout title="Associated Organizations">
            <List>
                {associations.length === 0 ? (
                    <NoData message="No associated organizations found" />
                ) : (
                    associations?.map((association) => (
                        <div key={association.childOrg.id} className="p-4 border-b">
                            <ChurchRowCard church={association.childOrg} />
                        </div>
                    ))
                )}
            </List>
        </PageLayout>
    );
}
