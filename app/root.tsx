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
import { Toaster } from "~/components/ui/sonner";
import type { Route } from "./+types/root";
import stylesheet from "./app.css?url";
import Header from "./src/components/header/Header";
import { Sidenav } from "./src/components/sidenav/Sidenav";
import {
	ApplicationContext,
	ApplicationProvider,
} from "./src/providers/appContextProvider";
import { UserProvider } from "./src/providers/userProvider";
import { createAuthLoader } from "~/server/auth/authLoader";
import { useContext, useState, useEffect } from "react";

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

export const loader = createAuthLoader();

export function Layout({ children }: { children: React.ReactNode }) {
	const loaderData = useLoaderData<typeof loader>();
	const location = useLocation();

	const isLanding = location.pathname.startsWith("/landing/");
	const isAuth =
		location.pathname.startsWith("/sign-in") ||
		location.pathname.startsWith("/sign-up");

	return (
		<html lang="en">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<Links />
			</head>
			<body>
				{isLanding || isAuth ? (
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
								siteRoles={loaderData?.userContext?.siteRoles}
								userToSiteRoles={loaderData?.userContext?.userToSiteRoles}
								organizationRoles={loaderData?.userContext?.organizationRoles}
								userToOrgRoles={loaderData?.userContext?.userToOrgRoles}
							>
								<MainLayout>{children}</MainLayout>
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

function MainLayout({ children }: { children: React.ReactNode }) {
	const { sideNavOpen } = useContext(ApplicationContext);
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia("(max-width: 1024px)");
		setIsMobile(mediaQuery.matches);

		const handleResize = () => {
			setIsMobile(mediaQuery.matches);
		};

		mediaQuery.addEventListener("change", handleResize);
		return () => {
			mediaQuery.removeEventListener("change", handleResize);
		};
	}, []);

	const sidebarVisible = isMobile ? sideNavOpen : true;

	return (
		<div className="flex bg-accent">
			<Sidenav />
			<div
				className="flex-col w-full h-full transition-all duration-300"
				style={{
					marginLeft: sidebarVisible ? "250px" : "0",
				}}
			>
				<Header />
				<hr className="border-t border-gray-200" />
				<div className="flex-col h-full text-foreground w-full ">
					<div className="">{children}</div>
				</div>
			</div>
		</div>
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
