import { redirect } from "react-router";

import { createAuthLoader } from "~/server/auth/authLoader";

export const loader = createAuthLoader(
	async ({ params, request, userContext }) => {
		throw redirect("submissions");
	},
);
