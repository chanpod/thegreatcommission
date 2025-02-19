import { createClerkClient } from "@clerk/remix/api.server";
import { getAuth } from "@clerk/remix/ssr.server";
import type { LoaderFunctionArgs } from "react-router";

const publicPaths = ["/landing", "/sign-in", "/sign-up"];

export async function authMiddleware(args: LoaderFunctionArgs) {
	const { auth, userId } = await getAuth(args);

	// Check if the path is public
	const isPublicPath = publicPaths.some((path) =>
		args.request.url.includes(path),
	);

	// Allow access to public paths
	if (isPublicPath) {
		return null;
	}

	// Redirect to sign in if not authenticated
	if (!auth.userId) {
		const searchParams = new URLSearchParams([
			["redirect_url", args.request.url],
		]);
		return new Response(null, {
			status: 302,
			headers: { Location: `/sign-in?${searchParams}` },
		});
	}

	return null;
}

// Helper to get the current user's data
export async function getCurrentUser(args: LoaderFunctionArgs) {
	const { userId } = await getAuth(args);
	if (!userId) return null;

	const clerk = createClerkClient({
		secretKey: process.env.CLERK_SECRET_KEY!,
	});

	return clerk.users.getUser(userId);
}

// Helper to sync Clerk user with database
export async function syncUserWithDatabase(userId: string) {
	const clerk = createClerkClient({
		secretKey: process.env.CLERK_SECRET_KEY!,
	});

	const user = await clerk.users.getUser(userId);
	if (!user) return null;

	// TODO: Sync user data with your database
	// This will be implemented based on your database schema
	return user;
}
