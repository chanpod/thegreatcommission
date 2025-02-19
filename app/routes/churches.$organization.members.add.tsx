import {
	data,
	Form,
	useActionData,
	useLoaderData,
	useNavigate,
} from "react-router";
import { Button } from "~/components/ui/button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { db } from "~/server/dbConnection";
import {
	churchOrganization,
	users,
	usersTochurchOrganization,
} from "server/db/schema";
import { eq } from "drizzle-orm";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "~/src/components/layout/PageLayout";
import UsersForm from "~/src/components/forms/users/UsersForm";
import { getUser, updateUser } from "@/server/dataServices/UserDataService";
import { createAuthLoader } from "~/server/auth/authLoader";

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext?.user;
		const organization = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, params.organization))
			.then((data) => data[0]);

		return {
			organization,
		};
	},
	true,
);

export const action = async ({ request, params }) => {
	if (request.method === "POST") {
		const authUser = await authenticator.isAuthenticated(request);
		if (!authUser)
			return data({ message: "Not Authenticated" }, { status: 401 });

		const formData = await request.formData();
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
		};

		const existingUser = await getUser(user.email);

		if (existingUser.users) {
			const response = await db
				.insert(usersTochurchOrganization)
				.values({
					churchOrganizationId: params.organization,
					userId: existingUser.users.id,
					isAdmin: false,
				})
				.returning();

			return {
				success: true,
				message: "User added to organization",
			};
		}

		const newUser = await db
			.insert(users)
			.values({
				...user,
			})
			.returning();

		const response = await db
			.insert(usersTochurchOrganization)
			.values({
				churchOrganizationId: params.organization,
				userId: newUser[0].id,
			})
			.returning();

		return {
			member: response[0],
			success: true,
		};
	}

	if (request.method === "DELETE") {
		const authUser = await authenticator.isAuthenticated(request);
		if (!authUser)
			return data({ message: "Not Authenticated" }, { status: 401 });

		const response = await db
			.delete(usersTochurchOrganization)
			.where(eq(usersTochurchOrganization.userId, params.userId));
		return {
			success: true,
		};
	}

	if (request.method === "PUT") {
		const authUser = await authenticator.isAuthenticated(request);
		if (!authUser)
			return data({ message: "Not Authenticated" }, { status: 401 });

		const formData = await request.formData();
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
		} as typeof users;

		const response = await updateUser(params.userId, user);

		return {
			success: true,
		};
	}
};

const AddMember = () => {
	const loaderData = useLoaderData();
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
				navigate("/churches/" + loaderData?.organization?.id + "/members");
			}, 300); // Match sheet close animation duration
		}
	}, [actionData]);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setTimeout(() => {
				navigate("/churches/" + loaderData?.organization?.id + "/members");
			}, 300); // Match sheet close animation duration
		}
	};

	return (
		<Sheet open={isOpen} onOpenChange={handleOpenChange}>
			<SheetContent>
				<PageLayout title="Add Member" className="mt-3">
					<Form method="post" className="space-y-4">
						<UsersForm defaultValues={{}} />
						<Button type="submit">Add Member</Button>
					</Form>
				</PageLayout>
			</SheetContent>
		</Sheet>
	);
};

export default AddMember;
