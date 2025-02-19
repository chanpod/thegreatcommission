import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import type { AppLoadContext, LoaderFunctionArgs } from "react-router";
import { AuthService, type AuthenticatedUser } from "~/services/AuthService";

export interface AuthLoaderData {
	userContext: AuthenticatedUser | null;
	env: {
		mapsApi: string | undefined;
		[key: string]: any;
	};
}

export interface AuthLoaderArgs {
	request: Request;
	auth: {
		userId: string | null;
		sessionId: string | null;
		getToken: () => Promise<string | null>;
	};
	params: {
		[key: string]: string | undefined;
	};
	context: AppLoadContext;
	userContext: AuthenticatedUser | null;
}

type LoaderFunction<T> = (args: AuthLoaderArgs) => Promise<T>;

export function createAuthLoader<T>(
	loaderFn?: LoaderFunction<T>,
	requireAuth: boolean = false,
) {
	return async (args: LoaderFunctionArgs) => {
		return rootAuthLoader(args, async ({ request, params, context }) => {
			// Get user context
			const userContext = await AuthService.getAuthenticatedUser(request.auth);

			// If auth is required and we don't have a user, this will throw
			if (requireAuth && !userContext) {
				throw new Response("Unauthorized", { status: 401 });
			}

			// Base loader data
			const baseData: AuthLoaderData = {
				userContext: userContext || {
					user: null,
					siteRoles: null,
					userToSiteRoles: null,
					organizationRoles: null,
					userToOrgRoles: null,
				},
				env: {
					mapsApi: process.env.GOOGLE_MAPS_KEY,
				},
			};

			// If no loader function provided, return base data
			if (!loaderFn) {
				return baseData;
			}

			// Call the loader function with auth context
			const loaderData = await loaderFn({
				request,
				auth: request.auth,
				params,
				context,
				userContext,
			});

			// Return combined data
			return {
				...baseData,
				...loaderData,
			};
		});
	};
}
