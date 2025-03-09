import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent } from "~/components/ui/card";

interface PhoneVerificationStepProps {
    phoneNumber: string;
    onPhoneNumberChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    isLoading: boolean;
}

export function PhoneVerificationStep({
    phoneNumber,
    onPhoneNumberChange,
    onSubmit,
    isLoading
}: PhoneVerificationStepProps) {
    // Format phone number as user types
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 10) {
            onPhoneNumberChange(value);
        }
    };

    // Format phone number for display
    const formatPhoneForDisplay = (phone: string) => {
        if (phone.length === 0) return "";
        if (phone.length <= 3) return phone;
        if (phone.length <= 6) return `(${phone.slice(0, 3)}) ${phone.slice(3)}`;
        return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
    };

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <form onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="(123) 456-7890"
                                value={formatPhoneForDisplay(phoneNumber)}
                                onChange={handlePhoneChange}
                                autoComplete="tel"
                                autoFocus
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={phoneNumber.length !== 10 || isLoading}
                        >
                            {isLoading ? "Sending Code..." : "Next"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 