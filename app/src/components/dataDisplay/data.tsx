import type { ReactNode } from "react";
import { Label } from "~/components/ui/label";

interface DataDisplayProps {
    label?: string;
    children: ReactNode;
}

export const DataDisplay = ({ label = "Location", children }: DataDisplayProps) => {
    return (
        <div className="flex flex-col">
            <Label>{label}</Label>
            <div className="text-gray-900 pt-0.5">{children}</div>
        </div>
    );
};