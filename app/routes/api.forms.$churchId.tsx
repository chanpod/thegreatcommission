import { FormService } from "~/services/FormService";
import { db } from "@/server/db";
import { data } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params, request }: LoaderFunctionArgs) {
	const { churchId } = params;

	if (!churchId) {
		return data({ error: "Church ID is required" }, { status: 400 });
	}

	try {
		const url = new URL(request.url);
		const formType = url.searchParams.get("type") || undefined;
		const activeOnly = url.searchParams.get("active") === "true";

		// Get forms for the specified church
		const forms = await FormService.getFormConfigs(db, {
			churchId,
			type: formType,
			activeOnly,
		});

		return { forms };
	} catch (error) {
		console.error("Error fetching forms:", error);
		return data({ error: "Failed to fetch forms" }, { status: 500 });
	}
}
