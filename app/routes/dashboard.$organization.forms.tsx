import { useParams, Link, Outlet } from "react-router";
import { useState, useEffect } from "react";
import { FormService } from "~/services/FormService";
import { db } from "@/server/db/dbConnection";
import { Button } from "~/components/ui/button";
import { PlusIcon } from "lucide-react";

export default function FormsPage() {
	const params = useParams();
	const organizationId = params.organization;
	const [forms, setForms] = useState([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchForms = async () => {
			if (!organizationId) return;

			try {
				// Get forms for this organization
				const formsList = await FormService.getFormConfigs(db, {
					churchId: organizationId,
				});

				setForms(formsList);
			} catch (error) {
				console.error("Error fetching forms:", error);
			} finally {
				setIsLoading(false);
			}
		};

		fetchForms();
	}, [organizationId]);

	// Check if we're on the main forms page or a nested route
	const isMainFormsPage = params["*"] === undefined || params["*"] === "";

	if (isLoading) {
		return <div className="container py-6">Loading...</div>;
	}

	return (
		<div className="container py-6">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Forms Management</h1>
				<Link to={`/dashboard/${organizationId}/forms/new`}>
					<Button>
						<PlusIcon className="h-5 w-5 mr-2" />
						Create New Form
					</Button>
				</Link>
			</div>

			{isMainFormsPage ? (
				<div className="bg-white rounded-lg shadow">
					<div className="p-4 border-b">
						<h2 className="text-lg font-medium">Your Forms</h2>
						<p className="text-sm text-gray-500">
							Manage your form configurations
						</p>
					</div>

					{forms.length === 0 ? (
						<div className="p-8 text-center">
							<p className="text-gray-500">
								You haven't created any forms yet.
							</p>
							<Link
								to={`/dashboard/${organizationId}/forms/new`}
								className="mt-4 inline-block"
							>
								<Button>
									<PlusIcon className="h-5 w-5 mr-2" />
									Create Your First Form
								</Button>
							</Link>
						</div>
					) : (
						<div className="divide-y">
							{forms.map((form) => (
								<div key={form.id} className="p-4 hover:bg-gray-50">
									<Link
										to={`/dashboard/${organizationId}/forms/${form.id}`}
										className="block"
									>
										<div className="flex justify-between items-center">
											<div>
												<h3 className="font-medium">{form.name}</h3>
												<p className="text-sm text-gray-500">
													Type: {form.formType}
												</p>
											</div>
											<div className="flex items-center">
												<span
													className={`px-2 py-1 text-xs rounded-full ${form.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}
												>
													{form.active ? "Active" : "Inactive"}
												</span>
											</div>
										</div>
									</Link>
								</div>
							))}
						</div>
					)}
				</div>
			) : (
				<Outlet />
			)}
		</div>
	);
}
