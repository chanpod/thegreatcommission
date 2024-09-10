import { User } from "@prisma/client";
import { json, LinksFunction, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
    Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration, useRouteError,
    isRouteErrorResponse,
    useLoaderData
} from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import React, { useCallback, useState } from "react";

import { authenticator } from "./server/auth/strategies/authenticaiton";
import Header from "./src/components/header/Header";

import "./src/styles/app.css";
import 'react-tree-graph/dist/style.css'
import Geocode from "react-geocode";
import { Sidenav } from "./components/sidenav";
import { TGCLayout } from "./components/layout";
import styles from "./tailwind.css"




export const links: LinksFunction = () => [
    { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    // { rel: "stylesheet", href: styles },
    // { rel: "stylesheet", href: appStyles },
    // { rel: "stylesheet", href: treeStyles },
    // { rel: "stylesheet", href: styles },
    //add missionRowCard.css
];

export function meta() {
    return [
        {
            title: "The Great Commission",
        },
        {
            name: "viewport",
            content: "width=device-width,initial-scale=1",
        },
        {
            charset: "utf-8",
        }
    ]
}

export interface IUserContext {
    user: User | undefined;
}

export interface IAppEnv {
    mapsApi: string;
}

export interface IAppContext {
    sideNavOpen: boolean;
    setSideNavOpen: (open: boolean) => void;
    env: IAppEnv
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
    const user = await authenticator.isAuthenticated(request);
    console.log("user", user);
    return json({
        userContext: {
            user: user,
        },
        env: {
            mapsApi: process.env.GOOGLE_MAPS_KEY
        }
    });
};

export const UserContext = React.createContext<IUserContext>({ user: undefined });
export const ApplicationContext = React.createContext<IAppContext>({
    sideNavOpen: false,
    setSideNavOpen: (open: boolean) => { },
    env: {
        mapsApi: ""
    }
});

export function Layout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body style={{ minHeight: "100vh" }} className="bg-[#0a192f]">
                {children}
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    const loaderData = useLoaderData<typeof loader>();
    const [sideNavOpen, setSideNavOpen] = useState(false);
    const [mapContainer, setMapContainer] = useState(null);
    // Geocode.setApiKey(loaderData.env?.mapsApi as string);
    const mapRef = useCallback((node: any) => {
        node && setMapContainer(node);
    }, []);

    const mapOptions = {
        // Add your map options here
        // `center` and `zoom` are required for every map to be displayed
        center: { lat: 53.5582447, lng: 9.647645 },
        zoom: 6,
    };

    return (
        <div className="flex h-full relative">
            <ApplicationContext.Provider value={{ sideNavOpen, setSideNavOpen, env: { ...loaderData.env! } }}>
                <UserContext.Provider value={loaderData.userContext as IUserContext}>
                    <TGCLayout>
                        <Outlet />
                    </TGCLayout>
                </UserContext.Provider>
            </ApplicationContext.Provider>
        </div >

    );
}

export function ErrorBoundary() {
    const error = useRouteError();

    console.error(error);

    let message;
    if (isRouteErrorResponse(error)) {
        switch (error.status) {
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
                    {error.status}: {error.statusText}
                </h1>
            </div>
        );

    }
    return <h1>Something broke</h1>;
}

