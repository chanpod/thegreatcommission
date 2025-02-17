import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "react-router";

import { Toaster } from "~/components/ui/sonner";

import { getUser } from "@/server/dataServices/UserDataService";
import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import { authenticator } from "./server/auth/strategies/authenticaiton";
import Header from "./src/components/header/Header";
import { Sidenav } from "./src/components/sidenav/Sidenav";
import { ApplicationProvider } from "./src/providers/appContextProvider";
import { UserProvider } from "./src/providers/userProvider";
import { db } from "./server/dbConnection";
import {
	usersToOrganizationRoles,
	organizationRoles,
	roles,
	usersToRoles,
} from "server/db/schema";
import { eq } from "drizzle-orm";

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

export const loader = async ({ request }: Route.LoaderArgs) => {
	const userSession = await authenticator.isAuthenticated(request);

	if (!userSession) {
		return {
			userContext: {
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
	}

	// Get user data with site-wide roles
	const getUserQuery = await getUser(userSession.email, {
		roles: true,
		churches: false,
	});

	// Get all organization roles and user-to-role assignments
	const [allOrgRoles, userOrgRoles] = await Promise.all([
		db.select().from(organizationRoles),
		db
			.select()
			.from(usersToOrganizationRoles)
			.where(eq(usersToOrganizationRoles.userId, userSession.id)),
	]);

	// Get all site-wide roles and user-to-role assignments
	const [allSiteRoles, userSiteRoles] = await Promise.all([
		db.select().from(roles),
		db
			.select()
			.from(usersToRoles)
			.where(eq(usersToRoles.userId, userSession.id)),
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
};

export function Layout({ children }: { children: React.ReactNode }) {
	const loaderData = useLoaderData<typeof loader>();

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
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
