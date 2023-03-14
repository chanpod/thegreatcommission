import { User } from "@prisma/client";
import { json, LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import React from "react";
import stylesheet from "~/tailwind.css";
import { getSession } from "./server/auth/session.server";
import { authenticator } from "./server/auth/strategies/authenticaiton";
import Header from "./src/components/header/Header";
import { Sidenav } from "./src/components/sidenav/Sidenav";

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "The Great Commission",
    viewport: "width=device-width,initial-scale=1",
});

export interface IUserContext {
    user: User | undefined;
}

export const loader = async ({ request }: LoaderArgs) => {
    const user = await authenticator.isAuthenticated(request);
    const session = await getSession(request.headers.get("Cookie") || "");
    console.log(session.get("idToken"))
    console.log("authenticated user", user);

    return json({
        userContext: {
            user: user,
        },
    });
};

export const UserContext = React.createContext<IUserContext>({ user: undefined });

export default function App() {
    const loaderData = useLoaderData<typeof loader>();
    console.log("root loader", loaderData);
    return (
        <html lang="en">
            <head>
                <meta
                    name="google-signin-client_id"
                    content="1034070132753-gv1tbh0sop6rr0sqlst0e6rcp8ajdv0n.apps.googleusercontent.com"
                ></meta>
                <Meta />

                <Links />
            </head>
            <body style={{ minHeight: "100vh" }}>
                <div className="flex h-full">
                    <div className="w-60 max-w-5xl">
                        <Sidenav />
                    </div>
                    <div className="flex-col w-full">
                        <UserContext.Provider value={loaderData.userContext}>
                            <Header />
                            <div className="flex-col h-full bg-gray-200 pl-8 pt-4 w-full ">
                                <div className="bg-white rounded-md p-3">
                                    <Outlet />
                                </div>
                            </div>
                        </UserContext.Provider>
                    </div>
                </div>
                <ScrollRestoration />
                <Scripts />

                <LiveReload />
                <Analytics />
            </body>
        </html>
    );
}

export function ErrorBoundary({ error }: { error: Error }) {
    console.error(error);

    return <h1>Something broke</h1>;
}

export function CatchBoundary() {
    const caught = useCatch();

    let message;
    switch (caught.status) {
        case 401:
            message = <p>Oops! Looks like you tried to visit a page that you do not have access to.</p>;
            break;
        case 404:
            message = <p>Oops! Looks like you tried to visit a page that does not exist.</p>;
            break;

        default:
            throw new Error(caught.data || caught.statusText);
    }

    return (
        <div>
            <h1>Add Event Error </h1>
            <h1>
                {caught.status}: {caught.statusText}
            </h1>
        </div>
    );
}
