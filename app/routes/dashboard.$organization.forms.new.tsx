import { ArrowLeftIcon } from "lucide-react";
import { useState } from "react";
import {
	type ActionFunctionArgs,
	Link,
	useNavigate,
	useParams,
} from "react-router";
import { FormBuilder } from "~/components/FormBuilder";
import { Button } from "~/components/ui/button";
import { FormService } from "~/services/FormService";

import type { FormConfig } from "~/components/FormFieldTypes";

export async function action({ request, params }: ActionFunctionArgs) {
	const user = await requireUser(request);
	const organizationId = params.organization;

	if (!organizationId) {
		throw new Response("Organization ID is required", { status: 400 });
	}

	// Verify user has access to this organization
	if (!user.organizations.includes(organizationId)) {
		throw new Response("Not authorized", { status: 403 });
	}

	const formData = await request.json();
	const formService = new FormService();

	// Create the new form
	const formId = await formService.createFormConfig(organizationId, formData);

	return { success: true, formId };
}

export default function NewFormPage() {
	const navigate = useNavigate();
	const params = useParams();
	const organizationId = params.organization;
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	if (!organizationId) {
		throw new Error("Organization ID is required");
	}

	const handleSave = async (formConfig: FormConfig) => {
		try {
			setSaving(true);
			setError(null);

			// Create the new form
			const formId = await FormService.createFormConfig(
				organizationId,
				formConfig,
			);

			// Navigate to the form detail page
			navigate(`/dashboard/${organizationId}/forms/${formId}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "An error occurred");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow">
			<div className="p-4 border-b flex justify-between items-center">
				<div className="flex items-center">
					<Link to={`/dashboard/${organizationId}/forms`} className="mr-4">
						<Button variant="ghost" size="sm">
							<ArrowLeftIcon className="h-5 w-5 mr-1" />
							Back to Forms
						</Button>
					</Link>
					<h2 className="text-lg font-medium">Create New Form</h2>
				</div>
			</div>

			<div className="p-6">
				{error && (
					<div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg">
						{error}
					</div>
				)}

				<FormBuilder
					initialFormConfig={{
						name: "",
						formType: "contact",
						fields: [],
						active: true,
						emailNotifications: false,
					}}
					onSave={handleSave}
					isSubmitting={saving}
				/>
			</div>
		</div>
	);
}
