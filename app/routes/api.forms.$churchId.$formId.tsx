import type { LoaderFunctionArgs } from "react-router";
import { data } from "react-router";
import { FormService } from "~/services/FormService";
import { db } from "@/server/db";

export async function loader({ params }: LoaderFunctionArgs) {
	const { churchId, formId } = params;

	if (!churchId || !formId) {
		return data(
			{ error: "Church ID and Form ID are required" },
			{ status: 400 },
		);
	}

	try {
		// Get the specific form by ID
		const form = await FormService.getFormConfigById(formId);

		if (!form) {
			return data({ error: "Form not found" }, { status: 404 });
		}

		// Verify the form belongs to the specified church
		if (form.churchOrganizationId !== churchId) {
			return data(
				{ error: "Form does not belong to this church" },
				{ status: 403 },
			);
		}

		// Transform the form data to match the expected format
		let fields = [];
		try {
			// Parse the formFields JSON string and add it as a fields property
			if (form.formFields) {
				fields = JSON.parse(form.formFields);
				// Validate that fields is an array
				if (!Array.isArray(fields)) {
					console.error("Form fields is not an array:", fields);
					fields = [];
				}
			}
		} catch (error) {
			console.error("Error parsing form fields:", error, form.formFields);
			// Return a more specific error
			return data(
				{
					error: "Invalid form configuration: Could not parse form fields",
					details: String(error),
				},
				{ status: 500 },
			);
		}

		const transformedForm = {
			...form,
			fields: fields,
		};

		// Log the transformed form for debugging
		console.log("Transformed form:", {
			id: transformedForm.id,
			name: transformedForm.name,
			fieldsCount: transformedForm.fields.length,
		});

		return Response.json({ form: transformedForm });
	} catch (error) {
		console.error("Error fetching form:", error);
		return data({ error: "Failed to fetch form" }, { status: 500 });
	}
}
