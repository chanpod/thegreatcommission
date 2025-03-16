import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { CheckCircle } from "lucide-react";

interface Child {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    notes?: string;
    allergies?: string;
    specialNeeds?: string;
    photoUrl?: string;
}

interface Room {
    id: string;
    name: string;
    minAgeMonths: number;
    maxAgeMonths: number;
}

interface ConfirmationStepProps {
    checkedInChildren: Child[];
    findRoomForChild: (child: Child, availableRooms: Room[]) => Room | null;
    onStartOver: () => void;
    qrCodeUrl: string;
    rooms: Room[];
}

export function ConfirmationStep({
    checkedInChildren,
    findRoomForChild,
    onStartOver,
    qrCodeUrl,
    rooms
}: ConfirmationStepProps) {
    return (
        <Card className="w-full">
            <CardHeader>
                <div className="flex flex-col items-center space-y-2">
                    <CheckCircle className="h-16 w-16 text-primary" />
                    <CardTitle className="text-center">Check-In Complete!</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="text-center space-y-2">
                        <p>Your check-in has been recorded and receipts have been generated.</p>

                        {checkedInChildren.length > 0 && (
                            <div className="mt-4">
                                <h3 className="font-medium mb-2">Children:</h3>
                                <ul className="space-y-2">
                                    {checkedInChildren.map(child => {
                                        const room = findRoomForChild(child, rooms);
                                        return (
                                            <li key={child.id} className="p-2 bg-primary/5 rounded-md">
                                                <span className="font-medium">{child.firstName} {child.lastName}</span>
                                                {room && (
                                                    <span className="block text-sm text-muted-foreground">
                                                        Room: {room.name}
                                                    </span>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </div>
                        )}
                    </div>

                    {qrCodeUrl && (
                        <div className="flex flex-col items-center space-y-2">
                            <p className="text-center font-medium">Your Digital Check-In Receipt</p>
                            <div className="p-2 bg-white rounded-md">
                                <img
                                    src={qrCodeUrl}
                                    alt="Check-in QR Code"
                                    className="max-w-full w-48 h-48 mx-auto"
                                />
                            </div>
                            <p className="text-sm text-center text-muted-foreground">
                                Present this QR code to check out your children.
                            </p>
                        </div>
                    )}
                </div>
            </CardContent>
            <CardFooter>
                <Button onClick={onStartOver} className="w-full">
                    Start New Check-In
                </Button>
            </CardFooter>
        </Card>
    );
} 