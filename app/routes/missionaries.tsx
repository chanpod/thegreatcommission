import { Outlet } from "@remix-run/react";
import React from "react";

const missionaries = () => {
    return (
        <div className="rounded-md p-4">
            <Outlet />
        </div>
    );
};

export default missionaries;
