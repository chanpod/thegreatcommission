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
import { ChurchService } from "~/services/ChurchService";
import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";
import { churchOrganization, missions } from "server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "./+types";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { PermissionsService } from "@/server/services/PermissionsService";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

	const permissionsService = new PermissionsService();
	const permissions = await permissionsService.getOrganizationPermissions(
		user.id,
		params.organization,
	);

	if (!permissions.canEdit) {
		throw new Error("You are not authorized to edit this organization");
	}

	const organization = await db
		.select()
		.from(churchOrganization)
		.where(eq(churchOrganization.id, params.organization))
		.then((data) => {
			return data[0];
		});

	return {
		organization,
	};
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	if (request.method === "PUT") {
		const user = await authenticator.isAuthenticated(request);
		if (!user) return data({ message: "Not Authenticated" }, { status: 401 });

		const churchService = new ChurchService();
		const newChurch = await churchService.getChurchFormDataFromRequest(request);

		const response = await db
			.update(churchOrganization)
			.set(newChurch)
			.where(eq(churchOrganization.id, params.organization))
			.returning();

		return {
			organization: response[0],
			success: true,
		};
	}
};

const Update = () => {
	const loaderData = useLoaderData();
	const navigate = useNavigate();
	const actionData = useActionData();
	const [isOpen, setIsOpen] = useState(true);

	useEffect(() => {
		if (actionData?.success) {
			toast.success("Church Updated", {
				description: "The church has been updated successfully",
			});
			setIsOpen(false);
			toast("The church has been updated successfully");
			setTimeout(() => {
				navigate("/churches/" + loaderData?.organization?.id);
			}, 300); // Match sheet close animation duration
		}
	}, [actionData]);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setTimeout(() => {
				navigate("/churches/" + loaderData?.organization?.id);
			}, 300); // Match sheet close animation duration
		}
	};

	return (
		<Sheet open={isOpen} onOpenChange={handleOpenChange}>
			<SheetContent>
				<PageLayout title="Update" className="mt-3">
					<Form method="put" className="space-y-4">
						<CreateChurchForm initialValues={loaderData?.organization} />
						<Button type="submit">Update</Button>
					</Form>
				</PageLayout>
			</SheetContent>
		</Sheet>
	);
};

export default Update;
