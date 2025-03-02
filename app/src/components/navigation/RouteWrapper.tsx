import React from "react";

const RouteWrapper = ({ children }: any) => {
	return (
		<div className="bg-white rounded-lg  flex-col text-black space-y-4">
			{children}
		</div>
	);
};

export default RouteWrapper;
