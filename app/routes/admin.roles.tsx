import { Form, useLoaderData } from "react-router";

import { map } from "lodash-es";

import { db } from "@/server/db/dbConnection";
import { roles } from "server/db/schema";
import type { Route } from "./+types";
import { Button } from "~/components/ui/button";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const roles = await db.select().from(roles);

	return {
		roles,
	};
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	if (request.method === "POST") {
		const form = await request.formData();
		const name = form.get("name");

		const role = await db.insert(roles).values({
			name: name as string,
			id: uuidv4(),
			updatedAt: new Date(),
			createdAt: new Date(),
		});

		return {
			role,
			success: true,
		};
	}
};

const Roles = () => {
	const loaderData = useLoaderData();
	return (
		<Card className="flex-col text-black space-y-4">
			Manage Roles
			{map(loaderData.roles, (role) => {
				return <div key={role.id}>{role.name}</div>;
			})}
			<Form method="post">
				<input type="text" name="name" />
				<Button type="submit">Add Role</Button>
			</Form>
		</Card>
	);
};

export default Roles;
