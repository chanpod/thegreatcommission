import React from "react";

interface Props {
    children: React.ReactNode;
}

const RowItem = ({ children }: Props) => {
    return <div className="flex items-center space-x-4">{children}</div>;
};

export default RowItem;
