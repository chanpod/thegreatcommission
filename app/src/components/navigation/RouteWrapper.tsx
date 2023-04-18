import React from "react";

const RouteWrapper = ({ children }: any) => {
    return <div className="bg-white rounded-lg p-2 flex-col p-1 text-black space-y-4">{children}</div>;
};

export default RouteWrapper;
