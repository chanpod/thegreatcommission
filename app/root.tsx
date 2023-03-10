import type { LinksFunction, MetaFunction } from "@remix-run/node";
import { Links, LiveReload, Meta, Outlet, Scripts, ScrollRestoration } from "@remix-run/react";
import { Analytics } from "@vercel/analytics/react";
import stylesheet from "~/tailwind.css";
import Header from "./src/components/header/Header";
import { Sidenav } from "./src/components/sidenav/Sidenav";
import { useCatch } from "@remix-run/react";

export const links: LinksFunction = () => [
    { rel: "stylesheet", href: "https://rsms.me/inter/inter.css" },
    { rel: "stylesheet", href: stylesheet },
];

export const meta: MetaFunction = () => ({
    charset: "utf-8",
    title: "New Remix App",
    viewport: "width=device-width,initial-scale=1",
});

export default function App() {
    return (
        <html lang="en">
            <head>
                <Meta />
                <Links />
            </head>
            <body style={{ minHeight: "100vh" }}>
                <div className="flex h-full">
                    <div className="w-60 max-w-5xl">
                        <Sidenav />
                    </div>
                    <div className="flex-col w-full">
                        <Header />
                        <div className="flex-col h-full bg-gray-200 pl-8 pt-4 w-full">
                            <Outlet />
                        </div>
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

    return (
        <h1>Something broke</h1>
    );
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
