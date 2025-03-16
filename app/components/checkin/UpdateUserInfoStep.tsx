import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { type Guardian, type FamilyData } from "./types";

interface UpdateUserInfoStepProps {
    familyData: FamilyData;
    isNewUser: boolean;
    userId: string | null;
    onSubmit: (e: React.FormEvent) => void;
    onStartOver: () => void;
    isLoading: boolean;
}

export function UpdateUserInfoStep({
    familyData,
    isNewUser,
    userId,
    onSubmit,
    onStartOver,
    isLoading
}: UpdateUserInfoStepProps) {
    // If we don't have valid family data, show an error
    if (!familyData || !familyData.guardians || familyData.guardians.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center">Error</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <p className="text-center">
                            We couldn't find your family information. Please try again.
                        </p>
                        <Button className="w-full" onClick={onStartOver}>
                            Start Over
                        </Button>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Get the guardian with the matching ID or the first guardian
    const guardianId = userId || familyData.guardians[0].id;
    const guardian = familyData.guardians.find(g => g.id === guardianId) || familyData.guardians[0];

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center">
                    {isNewUser ? "Welcome!" : "Update Your Information"}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    <input type="hidden" name="intent" value="update-user-info" />
                    <input type="hidden" name="userId" value={guardianId} />

                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            placeholder="First Name"
                            defaultValue={guardian.firstName}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            placeholder="Last Name"
                            defaultValue={guardian.lastName}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email (Optional)</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="Email"
                            defaultValue={guardian.email || ""}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="familyName">Family Name</Label>
                        <Input
                            id="familyName"
                            name="familyName"
                            placeholder="Family Name"
                            defaultValue={familyData.name || ""}
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? "Saving..." : "Continue"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        className="w-full mt-2"
                        onClick={onStartOver}
                    >
                        Start Over
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
} 