import React from "react";
import { primaryColor, primaryTextColor, secondaryColor } from "~/src/styles/defaultColors";

interface Props {
    children: React.ReactNode;
}

const Row = ({ children }: Props) => {
    const hoverState = `hover:${secondaryColor}`;
    return (
        // <div
        //     className={`block w-full cursor-pointer hover:shadow-[rgb(96, 231, 34)] rounded-lg ${primaryColor} p-2 ${primaryTextColor}`}
        // >
        <div className={`w-full ${primaryColor} rounded-lg hover:bg-slate-800 ${primaryTextColor} p-2`}>
            {children}
        </div>
    );
};

export default Row;
