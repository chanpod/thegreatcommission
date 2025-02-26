import { createRequestHandler } from "@react-router/express";
import express from "express";
import "react-router";
import { db } from "~/server/dbConnection";
import { churchOrganization } from "server/db/schema";
import { eq } from "drizzle-orm";
import dns from "node:dns";
import { promisify } from "node:util";

// Promisify DNS lookup
const resolveCname = promisify(dns.resolveCname);

// Extend Express Request type to include our custom properties
declare global {
	namespace Express {
		interface Request {
			customDomain?: boolean;
			organization?: any;
		}
	}
}

declare module "react-router" {
	export interface AppLoadContext {
		VALUE_FROM_VERCEL: string;
		customDomain?: boolean;
		organization?: any;
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
				success: cnameRecords.some(
					(record) =>
						record.includes("thegreatcommission.org") ||
						record.includes("vercel.app"),
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
			hostname === "thegreatcommission.org"
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
