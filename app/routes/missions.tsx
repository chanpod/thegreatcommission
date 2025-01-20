import { Outlet } from "react-router";
import RouteWrapper from "~/src/components/navigation/RouteWrapper";

const missions = () => {
    return (
        <RouteWrapper>
            <Outlet />
        </RouteWrapper>
    );
};

export default missions;
