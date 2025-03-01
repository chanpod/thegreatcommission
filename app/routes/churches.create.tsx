import { Button } from "~/components/ui/button";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { data, Form, useActionData } from "react-router";
import { useEffect } from "react";
import CreateChurchForm, {
	type IChurchFormData,
} from "~/src/components/forms/createChurch/CreateChurchForm";
import { ChurchService } from "~/services/ChurchService";
import { Card, CardContent, CardHeader } from "~/components/ui/card";
import { redirect } from "react-router";
import type { Route } from "./+types";
import {
	churchOrganization,
	usersTochurchOrganization,
	organizationRoles,
	usersToOrganizationRoles,
} from "server/db/schema";
import { db } from "@/server/db/dbConnection";
import { eq } from "drizzle-orm";
import { getAllPermissions } from "~/lib/permissions";

export const action = async ({ request }: Route.ActionArgs) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		return data({ status: 401, message: "Not authorized" }, { status: 401 });
	}

	if (request.method === "POST") {
		const churchService = new ChurchService();
		const formData = await churchService.getChurchFormDataFromRequest(request);

		// Begin transaction to ensure all operations succeed or fail together
		const response = await db.transaction(async (tx) => {
			// Create the organization
			const [org] = await tx
				.insert(churchOrganization)
				.values({
					name: formData.name,
					street: formData.street,
					city: formData.city,
					state: formData.state,
					zip: formData.zip,
					churchBannerUrl: formData.churchBannerUrl,
					mainChurchWebsite: formData.mainChurchWebsite,
					createdById: user.id,
					updatedAt: new Date(),
					email: null,
					phone: null,
					description: null,
					avatarUrl: null,
					parentOrganizationId: null,
				})
				.returning();

			// Create admin role
			const [adminRole] = await tx
				.insert(organizationRoles)
				.values({
					name: "Admin",
					description: "Full administrative control",
					permissions: getAllPermissions(),
					isDefault: false,
					isActive: true,
					churchOrganizationId: org.id,
					updatedAt: new Date(),
					createdAt: new Date(),
				})
				.returning();

			// Assign creator to admin role
			await tx.insert(usersToOrganizationRoles).values({
				userId: user.id,
				organizationRoleId: adminRole.id,
				churchOrganizationId: org.id,
				updatedAt: new Date(),
				createdAt: new Date(),
			});

			// Make creator an admin in the organization
			await tx.insert(usersTochurchOrganization).values({
				userId: user.id,
				churchOrganizationId: org.id,
				isAdmin: true,
			});

			return org;
		});

		return redirect(`/churches/${response.id}`);
	}

	return { message: "Hello World" };
};

export default function CreateChurch() {
	const actionData = useActionData<typeof action>();

	useEffect(() => {
		if (actionData?.message) {
			console.log(actionData.message);
		}
	}, [actionData]);

	return (
		<div className="container mx-auto p-4">
			<Card>
				<CardHeader>
					<h1 className="text-2xl font-bold">Create a New Church</h1>
				</CardHeader>
				<CardContent>
					<CreateChurchForm />
				</CardContent>
			</Card>
		</div>
	);
}
