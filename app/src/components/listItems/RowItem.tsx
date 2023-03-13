import React from "react";
import { primaryColor } from "~/src/styles/defaultColors";

interface Props {
    children: React.ReactNode;
}

const listButton = `block w-full cursor-pointer rounded-lg p-4 
text-left transition duration-500 hover:${primaryColor} hover:text-white
focus:bg-neutral-100 focus:text-neutral-500 focus:ring-0 
`;

export const primaryText = `text-sm font-medium truncate`;
export const secondaryText = `text-sm text-gray-500 truncate`;

const RowItem = ({ children }: Props) => {
    return <div className={"flex items-center space-x-4" + listButton}>{children}</div>;
};

export default RowItem;
