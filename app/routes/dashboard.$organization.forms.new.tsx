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
import {
	DEFAULT_CONTACT_FORM,
	DEFAULT_FIRST_TIME_VISITOR_FORM,
	DEFAULT_PRAYER_REQUEST_FORM,
} from "~/components/FormFieldTypes";
import { Card, CardContent } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

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
	const [activeTab, setActiveTab] = useState<"templates" | "custom">(
		"templates",
	);
	const [selectedTemplate, setSelectedTemplate] = useState<FormConfig | null>(
		null,
	);

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

	const templates = [
		{
			id: "contact",
			name: "Contact Form",
			description:
				"A simple contact form for visitors to get in touch with you.",
			template: DEFAULT_CONTACT_FORM,
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-8 w-8 text-primary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
					/>
				</svg>
			),
		},
		{
			id: "prayer",
			name: "Prayer Request",
			description:
				"Allow visitors to submit prayer requests to your prayer team.",
			template: DEFAULT_PRAYER_REQUEST_FORM,
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-8 w-8 text-primary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
					/>
				</svg>
			),
		},
		{
			id: "visitor",
			name: "First Time Visitor",
			description:
				"Collect information from first-time visitors to your church.",
			template: DEFAULT_FIRST_TIME_VISITOR_FORM,
			icon: (
				<svg
					xmlns="http://www.w3.org/2000/svg"
					className="h-8 w-8 text-primary"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
					/>
				</svg>
			),
		},
	];

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

				<Tabs
					value={activeTab}
					onValueChange={(value) =>
						setActiveTab(value as "templates" | "custom")
					}
				>
					<TabsList className="mb-6 w-full grid grid-cols-2">
						<TabsTrigger value="templates">Start with a Template</TabsTrigger>
						<TabsTrigger value="custom">Create Custom Form</TabsTrigger>
					</TabsList>

					<TabsContent value="templates" className="space-y-6">
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
							{templates.map((template) => (
								<Card
									key={template.id}
									className={`cursor-pointer transition-all hover:shadow-md ${selectedTemplate === template.template ? "ring-2 ring-primary" : ""}`}
									onClick={() => setSelectedTemplate(template.template)}
								>
									<CardContent className="p-6 flex flex-col items-center text-center">
										<div className="mb-4 p-3 rounded-full bg-primary/10">
											{template.icon}
										</div>
										<h3 className="text-lg font-medium mb-2">
											{template.name}
										</h3>
										<p className="text-sm text-muted-foreground mb-4">
											{template.description}
										</p>
										<Button
											variant={
												selectedTemplate === template.template
													? "default"
													: "outline"
											}
											onClick={(e) => {
												e.stopPropagation();
												setSelectedTemplate(template.template);
											}}
											className="w-full"
										>
											{selectedTemplate === template.template
												? "Selected"
												: "Use Template"}
										</Button>
									</CardContent>
								</Card>
							))}
						</div>

						{selectedTemplate && (
							<div className="mt-6 flex justify-end">
								<Button
									onClick={() => {
										setActiveTab("custom");
									}}
								>
									Continue with Template
								</Button>
							</div>
						)}
					</TabsContent>

					<TabsContent value="custom">
						<FormBuilder
							initialFormConfig={
								selectedTemplate || {
									name: "",
									formType: "contact",
									fields: [],
									active: true,
									emailNotifications: false,
									notificationEmails: [],
									confirmationMessage: "Thank you for your submission!",
								}
							}
							onSave={handleSave}
							isSubmitting={saving}
						/>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
