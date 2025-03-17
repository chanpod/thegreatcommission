import { createRequestHandler } from "@react-router/express";
import express from "express";
import "react-router";
import { db } from "@/server/db/dbConnection";
import { churchOrganization } from "server/db/schema";
import { eq } from "drizzle-orm";
import dns from "node:dns";
import { promisify } from "node:util";
import fetch from "node-fetch";

// Promisify DNS lookup
const resolveCname = promisify(dns.resolveCname);

// Extend Express Request type to include our custom properties
declare global {
	namespace Express {
		interface Request {
			customDomain?: boolean;
			organization?: typeof churchOrganization.$inferSelect;
		}
	}
}

declare module "react-router" {
	export interface AppLoadContext {
		VALUE_FROM_VERCEL: string;
		customDomain?: boolean;
		organization?: typeof churchOrganization.$inferSelect;
	}
}

const app = express();

// Health check endpoint
app.get("/api/health", (req, res) => {
	res.status(200).json({
		status: "ok",
		timestamp: new Date().toISOString(),
		environment: process.env.NODE_ENV || "development",
	});
});

// API endpoint to check if a domain is properly configured
app.get("/api/check-domain", async (req, res) => {
	try {
		const { domain } = req.query;

		if (!domain || typeof domain !== "string") {
			return res.status(400).json({
				success: false,
				error: "Domain parameter is required",
			});
		}

		// Check if domain exists in our database
		const org = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.customDomain, domain))
			.then((res) => res[0] || null);

		// Check DNS configuration
		let dnsCheck = { success: false, error: null, records: [] };
		try {
			const cnameRecords = await resolveCname(domain);
			dnsCheck = {
				success: cnameRecords.some((record) =>
					record.includes("thegreatcommission.life"),
				),
				records: cnameRecords,
				error: null,
			};
		} catch (dnsError) {
			dnsCheck = {
				success: false,
				error: dnsError.message,
				records: [],
			};
		}

		res.json({
			domain,
			exists: !!org,
			organization: org ? { id: org.id, name: org.name } : null,
			dns: dnsCheck,
			isConfigured: !!org && dnsCheck.success,
		});
	} catch (error) {
		console.error("Error checking domain:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

// API endpoint to automatically configure a domain with Vercel
app.post("/api/configure-domain", async (req, res) => {
	try {
		const { domain, organizationId } = req.body;

		if (!domain || !organizationId) {
			return res.status(400).json({
				success: false,
				error: "Domain and organizationId are required",
			});
		}

		// Check if domain exists in our database
		const org = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.id, organizationId))
			.then((res) => res[0] || null);

		if (!org) {
			return res.status(404).json({
				success: false,
				error: "Organization not found",
			});
		}

		// Update the organization with the custom domain
		await db
			.update(churchOrganization)
			.set({
				customDomain: domain,
				updatedAt: new Date(),
			})
			.where(eq(churchOrganization.id, organizationId));

		// Register domain with Vercel API
		const vercelApiToken = process.env.VERCEL_API_TOKEN;
		const vercelTeamId = process.env.VERCEL_TEAM_ID;
		const vercelProjectId = process.env.VERCEL_PROJECT_ID;

		if (vercelApiToken && vercelProjectId) {
			try {
				// Add domain to Vercel project
				const vercelResponse = await fetch(
					`https://api.vercel.com/v9/projects/${vercelProjectId}/domains${
						vercelTeamId ? `?teamId=${vercelTeamId}` : ""
					}`,
					{
						method: "POST",
						headers: {
							Authorization: `Bearer ${vercelApiToken}`,
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							name: domain,
						}),
					},
				);

				const vercelData = await vercelResponse.json();

				if (!vercelResponse.ok) {
					console.error("Vercel API error:", vercelData);
					// We still return success since the domain was updated in our database
					return res.json({
						success: true,
						message:
							"Domain configured in database, but Vercel registration failed",
						vercelError: vercelData.error?.message || "Unknown Vercel error",
					});
				}

				// Return success with Vercel verification info
				return res.json({
					success: true,
					message: "Domain configured successfully and registered with Vercel",
					vercelVerification: vercelData.verification,
				});
			} catch (vercelError) {
				console.error("Error registering domain with Vercel:", vercelError);
				// We still return success since the domain was updated in our database
				return res.json({
					success: true,
					message:
						"Domain configured in database, but Vercel registration failed",
					vercelError: vercelError.message,
				});
			}
		}

		res.json({
			success: true,
			message:
				"Domain configured successfully in database only (Vercel API token not configured)",
		});
	} catch (error) {
		console.error("Error configuring domain:", error);
		res.status(500).json({
			success: false,
			error: "Internal server error",
		});
	}
});

// Request logging middleware for debugging
app.use((req, res, next) => {
	console.log(
		`[${new Date().toISOString()}] ${req.method} ${req.url} - Host: ${req.hostname}`,
	);
	next();
});

// Custom domain middleware
app.use(async (req, res, next) => {
	try {
		// Get the hostname from the request
		const hostname = req.hostname;

		// Skip custom domain check for localhost or vercel preview URLs
		if (
			hostname === "localhost" ||
			hostname.includes("vercel.app") ||
			hostname.includes("127.0.0.1") ||
			hostname === "thegreatcommission.org" ||
			hostname === "thegreatcommission.life"
		) {
			return next();
		}

		console.log(`[CustomDomain] Checking domain: ${hostname}`);

		// Check if this is a custom domain in our database
		const org = await db
			.select()
			.from(churchOrganization)
			.where(eq(churchOrganization.customDomain, hostname))
			.then((res) => res[0] || null);

		// Store the organization in the request for use in the loader
		if (org) {
			console.log(`[CustomDomain] Found organization: ${org.name} (${org.id})`);
			req.customDomain = true;
			req.organization = org;
		} else {
			console.log(
				`[CustomDomain] No organization found for domain: ${hostname}`,
			);
		}

		next();
	} catch (error) {
		console.error("Error in custom domain middleware:", error);
		next();
	}
});

app.use(
	createRequestHandler({
		// @ts-expect-error - virtual module provided by React Router at build time
		build: () => import("virtual:react-router/server-build"),
		getLoadContext(req) {
			return {
				VALUE_FROM_VERCEL: "Hello from Vercel",
				customDomain: req.customDomain,
				organization: req.organization,
			};
		},
	}),
);

export default app;
