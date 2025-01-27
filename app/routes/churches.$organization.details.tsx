import { eq } from "drizzle-orm";
import { Outlet, useLoaderData } from "react-router";
import { churchOrganization } from "@/server/db/schema";
import { db } from "~/server/dbConnection";
import { PageLayout } from "~/src/components/layout/PageLayout";
import OrgDescription from "~/src/components/organizations/OrgDescription";

export const loader = async ({ params }) => {
    const organization = await db
        .select()
        .from(churchOrganization)
        .where(eq(churchOrganization.id, params.organization))
        .then((res) => res[0]);

    return { organization };
};

export default function OrganizationDetails() {
    const { organization } = useLoaderData<typeof loader>();

    return (
        <PageLayout title="Organization Details">
            <OrgDescription org={organization} />
            <Outlet />
        </PageLayout>
    );
}
