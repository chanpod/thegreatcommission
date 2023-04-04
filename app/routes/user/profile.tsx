import { Role } from "@prisma/client";
import { ActionArgs, json, LoaderArgs } from "@remix-run/node";
import { Form, useFetcher, useLoaderData } from "@remix-run/react";
import { Button, Card, Label } from "flowbite-react";
import { useContext, useState } from "react";
import { UserContext } from "~/root";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { prismaClient } from "~/server/dbConnection";
import { UserService } from "~/services/UserService";
import { UserAvatar } from "~/src/components/avatar/UserAvatar";
import { Input } from "~/src/components/forms/input/Input";

export const loader = async ({ request }: LoaderArgs) => {
    const roles = await prismaClient.role.findMany();

    return json({
        roles,
    });
};

export const action = async ({ request }: ActionArgs) => {
    if (request.method === "POST") {
        const form = await request.formData();
        const role = JSON.parse(form.get("role") as string);
        const user = await authenticator.isAuthenticated(request);

        const updatedUser = await prismaClient.user.update({
            where: {
                id: user?.id,
            },
            data: {
                roles: {
                    connect: {
                        id: role.id,
                    },
                },
            },
        });

        return json({
            updatedUser,
            success: true,
        });
    } else if (request.method === "PUT") {
        const form = await request.formData();
        const firstName = form.get("firstName") as string;
        const lastName = form.get("lastName") as string;
        const avatarUrl = form.get("avatarUrl") as string;
        const user = await authenticator.isAuthenticated(request);

        const updatedUser = await prismaClient.user.update({
            where: {
                id: user?.id,
            },
            data: {
                firstName: firstName,
                lastName: lastName,
                avatarUrl: avatarUrl,
            },
        });

        return json({
            updatedUser,
            success: true,
        });
    }
};

const UserProfilePage = () => {
    const loaderData = useLoaderData();
    const userContext = useContext(UserContext);
    const addRoleFetcher = useFetcher();
    const [editing, setEditing] = useState(false);
    const userService = new UserService(userContext.user);

    function addRole(role: Role) {
        addRoleFetcher.submit(
            {
                role: JSON.stringify(role),
            },
            {
                method: "post",
            }
        );
    }

    //toggle editing
    function toggleEditing() {
        setEditing(!editing);
    }

    return (
        <Card className="text-black  ">
            <div className="flex space-y-4 lg:space-x-3">
                <Card className="h-full flex-1">
                    <div className="flex justify-between">
                        <div className="text-3xl">User Profile</div>
                        <Button onClick={toggleEditing}>Edit</Button>
                    </div>
                    <div className="flex-col">
                        <div>
                            <Label>Email</Label>
                        </div>
                        <div>{userContext.user?.email}</div>
                    </div>

                    {editing ? (
                        <Form method="put" className="space-y-3 max-w-lg">
                            <Input
                                name="firstName"
                                label="First Name"
                                defaultValue={userContext.user?.firstName ?? ""}
                            />
                            <Input name="lastName" label="Last Name" defaultValue={userContext.user?.lastName ?? ""} />
                            <Input
                                name="avatarUrl"
                                label="Avatar Url"
                                defaultValue={userContext.user?.avatarUrl ?? ""}
                            />
                            <div className="flex space-x-5">
                                <Button type="submit">Save</Button>
                                <Button color="grey" outline onClick={toggleEditing}>
                                    Cancel
                                </Button>
                            </div>
                        </Form>
                    ) : (
                        <>
                            <div className="flex-col">
                                <div>
                                    <Label>First name</Label>
                                </div>
                                <div>{userContext.user?.firstName}</div>
                            </div>

                            <div className="flex-col">
                                <div>
                                    <Label>Last name</Label>
                                </div>
                                <div>{userContext.user?.lastName}</div>
                            </div>

                            <div className="flex-col items-start">
                                <div>
                                    <Label>Avatar</Label>
                                </div>
                                <div className="w-10">
                                    <UserAvatar user={userContext.user} />
                                </div>
                            </div>
                        </>
                    )}
                </Card>
                {userService.userIsSiteAdmin() && (
                    <Card className="h-full flex-1">
                        <span className="text-2xl">Roles</span>
                        {loaderData.roles?.map((role: Role) => {
                            return (
                                <div className="flex items-center space-x-3" key={role.id}>
                                    <span>{role.name}</span>
                                    <Button onClick={() => addRole(role)}>Add</Button>
                                </div>
                            );
                        })}
                    </Card>
                )}
            </div>
        </Card>
    );
};

export default UserProfilePage;
