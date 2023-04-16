import { User } from "@prisma/client";
import { json, LinksFunction, LoaderArgs, MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useCatch, useLoaderData } from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import React, { useCallback, useState } from "react";
import stylesheet from "~/tailwind.css";
import { authenticator } from "./server/auth/strategies/authenticaiton";
import Header from "./src/components/header/Header";
import { Sidenav } from "./src/components/sidenav/Sidenav";
import appStyles from "./src/styles/app.css";

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    { rel: "stylesheet", href: stylesheet },
    { rel: "stylesheet", href: appStyles },
];

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "The Great Commission",
    viewport: "width=device-width,initial-scale=1",
});

export interface IUserContext {
    user: User | undefined;
}

export interface IAppContext {
    sideNavOpen: boolean;
    setSideNavOpen: (open: boolean) => void;
}

export const loader = async ({ request }: LoaderArgs) => {
    const user = await authenticator.isAuthenticated(request);

    return json({
        userContext: {
            user: user,
        },
    });
};

export const UserContext = React.createContext<IUserContext>({ user: undefined });
export const ApplicationContext = React.createContext<IAppContext>({
    sideNavOpen: false,
    setSideNavOpen: (open: boolean) => {},
});

export default function App() {
    const loaderData = useLoaderData<typeof loader>();
    const [sideNavOpen, setSideNavOpen] = useState(false);
    const [mapContainer, setMapContainer] = useState(null);
    const mapRef = useCallback((node) => {
        node && setMapContainer(node);
    }, []);

    const mapOptions = {
        // Add your map options here
        // `center` and `zoom` are required for every map to be displayed
        center: { lat: 53.5582447, lng: 9.647645 },
        zoom: 6,
    };

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
            <body style={{ minHeight: "100vh" }} className="bg-[#0a192f]">
                <div className="flex h-full relative">
                    <ApplicationContext.Provider value={{ sideNavOpen, setSideNavOpen }}>
                        <UserContext.Provider value={loaderData.userContext as IUserContext}>
                            <Sidenav />

                            <div className="flex-col w-full h-full">
                                <Header />
                                <div className="flex-col h-full  text-white pt-4 w-full ">
                                    <div className="p-0 md:p-3">
                                        <Outlet />
                                    </div>
                                </div>
                            </div>
                        </UserContext.Provider>
                    </ApplicationContext.Provider>
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
