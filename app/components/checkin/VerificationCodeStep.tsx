import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardFooter } from "~/components/ui/card";

interface VerificationCodeStepProps {
    verificationCode: string;
    onVerificationCodeChange: (value: string) => void;
    onSubmit: (e: React.FormEvent) => void;
    onResendCode: () => void;
    isLoading: boolean;
    phoneNumber: string;
}

export function VerificationCodeStep({
    verificationCode,
    onVerificationCodeChange,
    onSubmit,
    onResendCode,
    isLoading,
    phoneNumber
}: VerificationCodeStepProps) {
    // Handle input change to only allow numbers
    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.replace(/\D/g, "");
        if (value.length <= 6) {
            onVerificationCodeChange(value);
        }
    };

    // Format phone number for display
    const formatPhoneForDisplay = (phone: string) => {
        if (phone.length === 10) {
            return `(${phone.slice(0, 3)}) ${phone.slice(3, 6)}-${phone.slice(6, 10)}`;
        }
        return phone;
    };

    return (
        <Card className="w-full">
            <CardContent className="pt-6">
                <form onSubmit={onSubmit}>
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-sm text-muted-foreground">
                                We sent a verification code to
                            </p>
                            <p className="font-medium">{formatPhoneForDisplay(phoneNumber)}</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="code">Verification Code</Label>
                            <Input
                                id="code"
                                type="text"
                                placeholder="123456"
                                value={verificationCode}
                                onChange={handleCodeChange}
                                autoFocus
                                inputMode="numeric"
                                required
                            />
                        </div>
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={verificationCode.length !== 6 || isLoading}
                        >
                            {isLoading ? "Verifying..." : "Verify"}
                        </Button>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center pb-6">
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onResendCode}
                    disabled={isLoading}
                >
                    Didn't get a code? Send again
                </Button>
            </CardFooter>
        </Card>
    );
} 