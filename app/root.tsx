import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	isRouteErrorResponse,
	useLoaderData,
	useLocation,
} from "react-router";

import { ClerkProvider } from "@clerk/react-router";
import { rootAuthLoader } from "@clerk/react-router/ssr.server";
import { Toaster } from "~/components/ui/sonner";
import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import Header from "./src/components/header/Header";
import { Sidenav } from "./src/components/sidenav/Sidenav";
import { ApplicationProvider } from "./src/providers/appContextProvider";
import { UserProvider } from "./src/providers/userProvider";
import { createClerkClient } from "@clerk/react-router/api.server";
import { usersToRoles } from "@/server/db/schema";
import { roles } from "@/server/db/schema";
import { organizationRoles } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { db } from "./server/dbConnection";
import { usersToOrganizationRoles } from "@/server/db/schema";
import { getUser } from "@/server/dataServices/UserDataService";

export const links: Route.LinksFunction = () => [
	{ rel: "preconnect", href: "https://fonts.googleapis.com" },
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous",
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
	},
	{ rel: "stylesheet", href: stylesheet },
];

export const loader = async (args: Route.LoaderArgs) => {
	return rootAuthLoader(args, async ({ request, context, params }) => {
		const {
			userId: clerkUserId,
			getToken,
			sessionClaims,
			actor,
		} = request.auth;

		const token = await getToken();
		console.log("token", token);
		console.log("sessionClaims", sessionClaims);
		const clerkUser = await createClerkClient({
			secretKey: process.env.CLERK_SECRET_KEY,
			publishableKey: process.env.VITE_CLERK_PUBLISHABLE_KEY,
		}).users.getUser(clerkUserId);

		const userEmail = clerkUser.emailAddresses[0].emailAddress;
		console.log("user", userEmail);

		// Get user data with site-wide roles
		const getUserQuery = await getUser(userEmail, {
			roles: true,
			churches: false,
		});

		const user = getUserQuery.users;
		const userId = user.id;

		// Get all organization roles and user-to-role assignments
		const [allOrgRoles, userOrgRoles] = await Promise.all([
			db.select().from(organizationRoles),
			db
				.select()
				.from(usersToOrganizationRoles)
				.where(eq(usersToOrganizationRoles.userId, userId)),
		]);

		// Get all site-wide roles and user-to-role arssignments
		const [allSiteRoles, userSiteRoles] = await Promise.all([
			db.select().from(roles),
			db.select().from(usersToRoles).where(eq(usersToRoles.userId, userId)),
		]);

		return {
			userContext: {
				user: getUserQuery.users,
				siteRoles: allSiteRoles,
				userToSiteRoles: userSiteRoles,
				organizationRoles: allOrgRoles,
				userToOrgRoles: userOrgRoles,
			},
			env: {
				mapsApi: process.env.GOOGLE_MAPS_KEY,
			},
		};
	});
	// if (!userSession) {
	// 	return {
	// 		userContext: {
	// 			user: null,
	// 			siteRoles: null,
	// 			userToSiteRoles: null,
	// 			organizationRoles: null,
	// 			userToOrgRoles: null,
	// 		},
	// 		env: {
	// 			mapsApi: process.env.GOOGLE_MAPS_KEY,
	// 		},
	// 	};
	// }
};

export function Layout({ children }: { children: React.ReactNode }) {
	const loaderData = useLoaderData<typeof loader>();
	const location = useLocation();

	const isLanding = location.pathname.startsWith("/landing/");

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{isLanding ? (
					children
				) : (
					<ClerkProvider
						signUpFallbackRedirectUrl="/"
						signInFallbackRedirectUrl="/"
						loaderData={loaderData}
					>
						<ApplicationProvider env={loaderData?.env}>
							<UserProvider
								user={loaderData?.userContext?.user}
								roles={loaderData?.userContext?.siteRoles}
								organizationRoles={loaderData?.userContext?.organizationRoles}
								userToRoles={loaderData?.userContext?.userToSiteRoles}
							>
								<div className="flex bg-accent">
									<Sidenav />
									<div className="flex-col w-full h-full">
										<Header />
										<div className="flex-col h-full text-foreground pt-4 w-full ">
											<div className="p-0 md:p-3 ">{children}</div>
										</div>
									</div>
								</div>
							</UserProvider>
						</ApplicationProvider>
					</ClerkProvider>
				)}
				<ScrollRestoration />
				<Scripts />
				<Toaster position="top-center" />
			</body>
		</html>
	);
}

export default function App() {
	return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack: string | undefined;

	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details =
			error.status === 404
				? "The requested page could not be found."
				: error.statusText || details;
	} else if (import.meta.env.DEV && error && error instanceof Error) {
		details = error.message;
		stack = error.stack;
	}

	return (
		<main className="pt-16 p-4 container mx-auto">
			<h1>{message}</h1>
			<p>{details}</p>
			{stack && (
				<pre className="w-full p-4 overflow-x-auto">
					<code>{stack}</code>
				</pre>
			)}
		</main>
	);
}
