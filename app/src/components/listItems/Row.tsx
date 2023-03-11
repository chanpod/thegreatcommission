import React from "react";

interface Props {
    children: React.ReactNode;
}

const Row = ({ children }: Props) => {
    return <li className="p-3 sm:pb-4">{children}</li>;
};

export default Row;
