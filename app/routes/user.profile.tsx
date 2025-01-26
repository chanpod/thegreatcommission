import type { Route } from "./+types";
import { Form, useFetcher, useLoaderData } from "react-router";
import { useContext, useState } from "react";
import { UserContext } from "~/src/providers/userProvider";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import { UserService } from "~/services/UserService";
import { UserAvatar } from "~/src/components/avatar/UserAvatar";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { eq } from "drizzle-orm";
import { roles, users } from "server/db/schema";
import { DataDisplay } from "~/src/components/dataDisplay/data";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { Stack } from "~/src/components/layout/Stack";

export const loader = async ({ request }: Route.LoaderArgs) => {
    const allRoles = await db.select().from(roles);

    return {
        roles: allRoles,
    };
};

export const action = async ({ request }: Route.ActionArgs) => {
    if (request.method === "POST") {
        const form = await request.formData();
        const role = JSON.parse(form.get("role") as string);
        const user = await authenticator.isAuthenticated(request);

        const updatedUser = await db
            .update(users)
            .set({
                roleIds: [...(user?.roleIds || []), role.id]
            })
            .where(eq(users.id, user?.id as string))
            .returning();

        return {
            updatedUser,
            success: true,
        };
    } else if (request.method === "PUT") {
        const form = await request.formData();
        const firstName = form.get("firstName") as string;
        const lastName = form.get("lastName") as string;
        const avatarUrl = form.get("avatarUrl") as string;
        const user = await authenticator.isAuthenticated(request);

        const updatedUser = await db
            .update(users)
            .set({
                firstName,
                lastName,
                avatarUrl,
            })
            .where(eq(users.id, user?.id as string))
            .returning();

        return {
            updatedUser,
            success: true,
        };
    }
};

const UserProfilePage = () => {
    const loaderData = useLoaderData();
    const userContext = useContext(UserContext);
    const addRoleFetcher = useFetcher();
    const [editing, setEditing] = useState(false);
    const userService = new UserService(userContext.user, roles);

    function addRole(role: typeof roles.$inferSelect) {
        addRoleFetcher.submit(
            {
                role: JSON.stringify(role),
            },
            {
                method: "post",
            }
        );
    }

    function toggleEditing() {
        setEditing(!editing);
    }

    return (
        <PageLayout title="User Profile" actions={<Button onClick={toggleEditing}>Edit</Button>}>

            <div className="pb-4">

                <DataDisplay label="Email">
                    <div>{userContext.user?.email}</div>
                </DataDisplay>
            </div>

            {editing ? (
                <Form method="put" className="space-y-3 max-w-lg">
                    <Stack spacing={3}>
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                defaultValue={userContext.user?.firstName ?? ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                defaultValue={userContext.user?.lastName ?? ""}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="avatarUrl">Avatar URL</Label>
                            <Input
                                id="avatarUrl"
                                name="avatarUrl"
                                defaultValue={userContext.user?.avatarUrl ?? ""}
                            />
                        </div>
                        <div className="flex space-x-5">
                            <Button type="submit">Save</Button>
                            <Button variant="outline" onClick={toggleEditing}>
                                Cancel
                            </Button>
                        </div>
                    </Stack>
                </Form>
            ) : (
                <Stack spacing={5}>
                    <DataDisplay label="First name">
                        {userContext.user?.firstName}
                    </DataDisplay>
                    <DataDisplay label="Last name">
                        {userContext.user?.lastName}
                    </DataDisplay>


                    <DataDisplay label="Avatar">
                        <UserAvatar user={userContext.user} />
                    </DataDisplay>
                </Stack>
            )}


            {userService.userIsSiteAdmin() && (
                <Card className="h-full flex-1">
                    <span className="text-2xl">Roles</span>
                    {loaderData.roles?.map((role: typeof roles.$inferSelect) => {
                        return (
                            <div className="flex items-center space-x-3" key={role.id}>
                                <span>{role.name}</span>
                                <Button onClick={() => addRole(role)}>Add</Button>
                            </div>
                        );
                    })}
                </Card>
            )}

        </PageLayout>
    );
};

export default UserProfilePage;
