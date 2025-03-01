import { useLoaderData, Link, useOutletContext } from "react-router";
import { FormService } from "~/services/FormService";
import { db } from "@/server/db/dbConnection";
import { Button } from "~/components/ui/button";
import { FileText } from "lucide-react";
import type {
	churchOrganization,
	landingPageConfig,
	events,
} from "server/db/schema";

type LandingPageContext = {
	organization: typeof churchOrganization.$inferSelect;
	config: typeof landingPageConfig.$inferSelect | null;
	serviceTimes: Array<typeof events.$inferSelect>;
	upcomingEvents: Array<typeof events.$inferSelect>;
	isLive: boolean;
};

export const loader = async ({ params }) => {
	const { organization: organizationId } = params;

	// Get all active forms for this organization
	const forms = await FormService.getFormConfigs(db, {
		churchId: organizationId,
		activeOnly: true,
	});

	return {
		forms,
	};
};

export default function OrganizationForms() {
	const { forms } = useLoaderData();
	const { organization } = useOutletContext<LandingPageContext>();

	return (
		<main className="container mx-auto px-4 py-8">
			<div className="mb-6">
				<h1 className="text-3xl font-bold mb-2">Forms</h1>
				<p className="text-gray-600">
					Complete any of the following forms to connect with{" "}
					{organization.name}
				</p>
			</div>

			{forms.length === 0 ? (
				<div className="text-center py-12">
					<h2 className="text-2xl font-medium text-gray-500">
						No forms available
					</h2>
					<p className="mt-2 text-gray-400">Check back later for new forms.</p>
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{forms.map((form) => (
						<div
							key={form.id}
							className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
						>
							<div className="p-6">
								<h2 className="text-xl font-semibold mb-2">{form.name}</h2>
								<p className="text-gray-600 mb-4">
									{form.description ||
										"Complete this form to submit your information."}
								</p>
								<Link to={`/landing/${organization.id}/forms/${form.id}`}>
									<Button className="w-full">
										<FileText className="h-4 w-4 mr-2" />
										Complete Form
									</Button>
								</Link>
							</div>
						</div>
					))}
				</div>
			)}
		</main>
	);
}
