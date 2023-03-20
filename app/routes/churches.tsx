import { Outlet } from "@remix-run/react";
import React from "react";

const churches = () => {
    return (
        <div className="rounded-md p-4">
            <Outlet />
        </div>
    );
};

export default churches;
