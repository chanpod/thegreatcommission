import type { ReactNode } from "react";

interface StackProps {
    children: ReactNode;
    spacing?: number;
    direction?: "row" | "column";
}

export const Stack = ({
    children,
    spacing = 4,
    direction = "column"
}: StackProps) => {
    return (
        <div
            className={`flex ${direction === "column" ? "flex-col" : "flex-row"
                } space-${direction === "column" ? "y" : "x"}-${spacing}`}
        >
            {children}
        </div>
    );
};
