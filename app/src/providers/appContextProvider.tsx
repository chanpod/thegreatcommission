import { createContext, useState } from "react";

export interface IAppContext {
    sideNavOpen: boolean;
    setSideNavOpen: (open: boolean) => void;
    env: IAppEnv
}


export interface IAppEnv {
    mapsApi: string;
}

export const ApplicationContext = createContext<IAppContext>({
    sideNavOpen: false,
    setSideNavOpen: (open: boolean) => { },
    env: {
        mapsApi: ""
    }
});

export const ApplicationProvider = ({ children, env }: { children: React.ReactNode, env: IAppEnv }) => {
    const [sideNavOpen, setSideNavOpen] = useState(false);
    const [mapContainer, setMapContainer] = useState(null);
    return <ApplicationContext.Provider value={{ sideNavOpen, setSideNavOpen, env }}>{children}</ApplicationContext.Provider>;
};