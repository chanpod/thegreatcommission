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
import { UploadButton } from "~/utils/uploadthing";
import { toast } from "sonner";

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
				roleIds: [...(user?.roleIds || []), role.id],
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
	const updateProfileFetcher = useFetcher();
	const [editing, setEditing] = useState(false);
	const [avatarUrl, setAvatarUrl] = useState(userContext.user?.avatarUrl || "");
	const userService = new UserService(userContext.user, roles);

	function addRole(role: typeof roles.$inferSelect) {
		addRoleFetcher.submit(
			{
				role: JSON.stringify(role),
			},
			{
				method: "post",
			},
		);
	}

	function toggleEditing() {
		setEditing(!editing);
	}

	function handleAvatarUpload(url: string) {
		setAvatarUrl(url);
		// Immediately update the avatar
		const formData = new FormData();
		formData.set("firstName", userContext.user?.firstName || "");
		formData.set("lastName", userContext.user?.lastName || "");
		formData.set("avatarUrl", url);
		updateProfileFetcher.submit(formData, { method: "put" });
	}

	return (
		<PageLayout
			title="User Profile"
			actions={<Button onClick={toggleEditing}>Edit</Button>}
		>
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
							<Label>Profile Picture</Label>
							<div className="flex items-center gap-4">
								<UserAvatar user={{ ...userContext.user, avatarUrl }} />
								<UploadButton
									endpoint="imageUploader"
									onClientUploadComplete={(res) => {
										if (res?.[0]) {
											handleAvatarUpload(res[0].ufsUrl);
											toast.success("Profile picture updated successfully");
										}
									}}
									onUploadError={(error: Error) => {
										toast.error(`Upload failed: ${error.message}`);
									}}
								/>
							</div>
							<input type="hidden" name="avatarUrl" value={avatarUrl} />
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
						<div className="flex items-center gap-4">
							<UserAvatar user={userContext.user} />
							{editing && (
								<UploadButton
									endpoint="imageUploader"
									onClientUploadComplete={(res) => {
										if (res?.[0]) {
											handleAvatarUpload(res[0].ufsUrl);
											toast.success("Profile picture updated successfully");
										}
									}}
									onUploadError={(error: Error) => {
										toast.error(`Upload failed: ${error.message}`);
									}}
								/>
							)}
						</div>
					</DataDisplay>
				</Stack>
			)}
		</PageLayout>
	);
};

export default UserProfilePage;
