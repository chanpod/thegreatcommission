import { Outlet } from "react-router";

import RouteWrapper from "~/src/components/navigation/RouteWrapper";

const missionaries = () => {
    return (
        <RouteWrapper>
            <Outlet />
        </RouteWrapper>
    );
};

export default missionaries;
