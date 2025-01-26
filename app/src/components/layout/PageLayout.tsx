import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";

interface PageLayoutProps {
    children: ReactNode;
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export const PageLayout = ({ children, title, description, actions, className }: PageLayoutProps) => {
    return (
        <Card className={cn("bg-white", className)}>
            <CardContent>
                <CardHeader>
                    <div className="flex items-center">
                        <div className="flex">
                            <CardTitle className="text-gray-900">{title}</CardTitle>
                            <CardDescription className="text-gray-500">{description}</CardDescription>
                        </div>
                        <div className="flex items-center justify-end flex-1">
                            {actions}
                        </div>
                    </div>
                </CardHeader>
                <hr className="border-gray-200" />
                {children}

            </CardContent>
        </Card>
    );
};
