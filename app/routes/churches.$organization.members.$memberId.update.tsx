import { data, Form, useActionData, useLoaderData, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import { churchOrganization, userPreferences, users, usersTochurchOrganization } from "server/db/schema";
import { eq } from "drizzle-orm";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "~/src/components/layout/PageLayout";
import UsersForm from "~/src/components/forms/users/UsersForm";
import { updateUser } from "@/server/dataServices/UserDataService";
import { updateUserPreferences } from "@/server/dataServices/UserPreferences";
import { getUserPreferences } from "@/server/dataServices/UserPreferences";

export const loader = async ({ request, params }) => {
    const user = await db.select().from(users)
        .where(eq(users.id, params.memberId))
        .then((data) => data[0]);

    const userPreferences = await getUserPreferences(params.memberId);

    console.log("userPreferences", userPreferences);

    return {
        user,
        userPreferences,
        orgId: params.organization,
    };
};

export const action = async ({ request, params }) => {


    if (request.method === "DELETE") {
        const authUser = await authenticator.isAuthenticated(request);
        if (!authUser) return data({ message: "Not Authenticated" }, { status: 401 });

        const response = await db.delete(usersTochurchOrganization).where(eq(usersTochurchOrganization.userId, params.memberId));
        return {
            success: true,
        };
    }

    if (request.method === "PUT") {
        const authUser = await authenticator.isAuthenticated(request);
        if (!authUser) return data({ message: "Not Authenticated" }, { status: 401 });

        const formData = await request.formData();

        const userPreferencesData = {
            emailNotifications: formData.get("preferEmail"),
            smsNotifications: formData.get("preferText"),
            phoneNotifications: formData.get("preferCall"),
        } as typeof userPreferences

        const userPreferencesResponse = await updateUserPreferences(params.memberId, userPreferencesData);

        const user = {
            firstName: formData.get("firstName"),
            lastName: formData.get("lastName"),
            middleName: formData.get("middleName"),
            email: formData.get("email"),
            phone: formData.get("phone"),
            address: formData.get("address"),
            city: formData.get("city"),
            state: formData.get("state"),
            zip: formData.get("zip"),
        } as typeof users

        const response = await updateUser(params.memberId, user);

        return {
            success: true,
        };
    }
};

const AddMember = () => {
    const { user, orgId, userPreferences } = useLoaderData();
    const navigate = useNavigate();
    const actionData = useActionData();
    const [isOpen, setIsOpen] = useState(true);

    useEffect(() => {
        if (actionData?.success) {
            toast.success("Member Added", {
                description: "The member has been added successfully",
            });
            setIsOpen(false);
            setTimeout(() => {
                navigate("/churches/" + orgId + "/members");
            }, 300); // Match sheet close animation duration
        }
    }, [actionData]);

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open);
        if (!open) {
            setTimeout(() => {
                navigate("/churches/" + orgId + "/members");
            }, 300); // Match sheet close animation duration
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleOpenChange}>
            <SheetContent>
                <PageLayout title="Edit Member" className="mt-3">
                    <Form method="put" className="space-y-4">
                        <UsersForm defaultValues={{ ...user, ...userPreferences }} />
                        <Button type="submit">Update Member</Button>
                    </Form>
                </PageLayout>
            </SheetContent>
        </Sheet>
    );
};

export default AddMember;
