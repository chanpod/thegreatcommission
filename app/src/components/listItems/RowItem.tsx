import React from "react";
import { primaryColor } from "~/src/styles/defaultColors";

interface Props {
    children: React.ReactNode;
    className?: string;
}

const listButton = `block w-full cursor-pointer rounded-lg p-4 
text-left transition duration-500 hover:text-white
`;

export const primaryText = `font-medium truncate`;
export const secondaryText = `text-gray-500 truncate`;

const RowItem = ({ children, className }: Props) => {
    return <div className={`flex items-center space-x-4 p-2 ${className}`}>{children}</div>;
};

export default RowItem;
