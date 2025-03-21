import { useLoaderData } from "react-router";
import { db } from "@/server/db/dbConnection";
import { churchOrganization } from "server/db/schema";
import { createAuthLoader } from "~/server/auth/authLoader";
import { PageLayout } from "~/src/components/layout/PageLayout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { Button } from "~/components/ui/button";
import { ExternalLink } from "lucide-react";
import { isNotNull } from "drizzle-orm";

export const loader = createAuthLoader(async ({ request, userContext }) => {
	// Get all organizations with custom domains
	const organizations = await db
		.select()
		.from(churchOrganization)
		.where(isNotNull(churchOrganization.customDomain));

	return { organizations };
}, true);

export default function AdminDomains() {
	const data = useLoaderData<typeof loader>();
	const { organizations } = data;

	return (
		<PageLayout title="Custom Domains">
			<Card>
				<CardHeader>
					<CardTitle>Custom Domain Management</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="mb-4 text-muted-foreground">
						This page shows all organizations with custom domains. Use this to
						monitor and manage custom domain configurations.
					</p>

					{organizations.length === 0 ? (
						<div className="text-center py-8">
							<p className="text-muted-foreground">
								No custom domains configured yet.
							</p>
						</div>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Organization</TableHead>
									<TableHead>Custom Domain</TableHead>
									<TableHead>Created</TableHead>
									<TableHead>Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{organizations.map((org) => (
									<TableRow key={org.id}>
										<TableCell>{org.name}</TableCell>
										<TableCell>{org.customDomain}</TableCell>
										<TableCell>
											{new Date(org.createdAt).toLocaleDateString()}
										</TableCell>
										<TableCell>
											<div className="flex gap-2">
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														window.open(`https://${org.customDomain}`, "_blank")
													}
												>
													<ExternalLink className="h-4 w-4 mr-2" />
													Visit
												</Button>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														window.open(
															`/churches/${org.id}/landing/config`,
															"_blank",
														)
													}
												>
													Edit
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</PageLayout>
	);
}
