import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import stylesheet from "./app.css?url"; 
import { authenticator } from "./server/auth/strategies/authenticaiton";
import { createContext, useCallback, useState } from "react";
import type { users } from "server/db/schema";
import {setKey} from "react-geocode";
import { Sidenav } from "./src/components/sidenav/Sidenav";
import Header from "./src/components/header/Header";

export interface IUserContext {
  user: typeof users.$inferSelect | undefined;    
}

export interface IAppEnv {
  mapsApi: string;
}

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
  const user = await authenticator.isAuthenticated(request);
  
  return {
      userContext: {
          user: user,
      },
      env: {
          mapsApi: process.env.GOOGLE_MAPS_KEY
      }
  };
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
export interface IAppContext {
  sideNavOpen: boolean;
  setSideNavOpen: (open: boolean) => void;
  env: IAppEnv
}
export const UserContext = createContext<IUserContext>({ user: undefined });
export const ApplicationContext = createContext<IAppContext>({
    sideNavOpen: false,
    setSideNavOpen: (open: boolean) => {},
    env: {
        mapsApi: ""
    }
});

export default function App() {
  const loaderData = useLoaderData<typeof loader>();
  const [sideNavOpen, setSideNavOpen] = useState(false);
    const [mapContainer, setMapContainer] = useState(null);
    setKey(loaderData.env?.mapsApi as string);
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
  <ApplicationContext.Provider value={{ sideNavOpen, setSideNavOpen, env: {...loaderData.env} }}>
    <UserContext.Provider value={loaderData.userContext as IUserContext}>
      <div className="flex">

        <Sidenav />

        <div className="flex-col w-full h-full">
            <Header />
            <div className="flex-col h-full  text-white pt-4 w-full ">
                <div className="p-0 md:p-3">
                    <Outlet />
                </div>
            </div>
        </div>
      </div>
    </UserContext.Provider>
  </ApplicationContext.Provider>
)
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
