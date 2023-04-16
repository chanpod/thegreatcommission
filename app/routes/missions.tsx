import { Outlet } from "@remix-run/react";
import React from "react";
import RouteWrapper from "~/src/components/navigation/RouteWrapper";

const missions = () => {
    return (
        <RouteWrapper>
            <Outlet />
        </RouteWrapper>
    );
};

export default missions;
