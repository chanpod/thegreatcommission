import { PermissionsService } from "@/server/services/PermissionsService";
import { eq } from "drizzle-orm";
import { useEffect, useState } from "react";
import { Form, useActionData, useLoaderData, useNavigate } from "react-router";
import { churchOrganization } from "server/db/schema";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Sheet, SheetContent } from "~/components/ui/sheet";
import { createAuthLoader } from "~/server/auth/authLoader";
import { db } from "~/server/dbConnection";
import { ChurchService } from "~/services/ChurchService";
import CreateChurchForm from "~/src/components/forms/createChurch/CreateChurchForm";
import { PageLayout } from "~/src/components/layout/PageLayout";

export const loader = createAuthLoader(
	async ({ request, auth, params, userContext }) => {
		const user = userContext?.user;

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
	},
	true,
);

export const action = createAuthLoader(
	async ({ request, auth, params, userContext }) => {
		if (request.method === "PUT") {
			const churchService = new ChurchService();
			const newChurch =
				await churchService.getChurchFormDataFromRequest(request);

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
	},
	true,
);

const Update = () => {
	const loaderData = useLoaderData<typeof loader>();
	const navigate = useNavigate();
	const actionData = useActionData();
	const [isOpen, setIsOpen] = useState(true);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		if (actionData?.success && isSubmitting) {
			toast.success("Church Updated", {
				description: "The church has been updated successfully",
			});
			setIsOpen(false);
			setTimeout(() => {
				navigate(`/churches/${loaderData?.organization?.id}`);
			}, 300); // Match sheet close animation duration
		}
	}, [actionData, isSubmitting, navigate, loaderData?.organization?.id]);

	const handleOpenChange = (open: boolean) => {
		setIsOpen(open);
		if (!open) {
			setTimeout(() => {
				navigate(`/churches/${loaderData?.organization?.id}`);
			}, 300); // Match sheet close animation duration
		}
	};

	const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
		setIsSubmitting(true);
	};

	console.log(loaderData);

	return (
		<Sheet open={isOpen} onOpenChange={handleOpenChange}>
			<SheetContent>
				<div className="overflow-auto">
					<PageLayout title="Update" className="mt-3">
						<Form method="put" className="space-y-4" onSubmit={handleSubmit}>
							<CreateChurchForm initialValues={loaderData?.organization} />

							<Button type="submit">Update</Button>
						</Form>
					</PageLayout>
				</div>
			</SheetContent>
		</Sheet>
	);
};

export default Update;
