import { Outlet } from "react-router";
import React from "react";
import RouteWrapper from "~/src/components/navigation/RouteWrapper";

const churches = () => {
    return (
        <RouteWrapper>
            <Outlet />
        </RouteWrapper>
    );
};

export default churches;
