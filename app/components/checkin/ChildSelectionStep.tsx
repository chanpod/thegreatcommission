import { Pencil, Plus, Trash, Check } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";

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

interface FamilyData {
    guardians: Array<{
        id: string;
        firstName: string;
        lastName: string;
        phoneNumber: string;
        email?: string;
        photoUrl?: string;
    }>;
    children: Child[];
}

interface ChildSelectionStepProps {
    familyData: FamilyData;
    selectedChildren: Child[];
    onChildToggle: (child: Child) => void;
    onEditFamily: () => void;
    onAddChild: (e?: React.MouseEvent) => void;
    findRoomForChild: (child: Child, availableRooms: any[]) => any;
    getChildAgeInMonths: (dateOfBirth: string) => number;
    onProceed: () => void;
    isLoading: boolean;
    rooms: any[];
}

export function ChildSelectionStep({
    familyData,
    selectedChildren,
    onChildToggle,
    onEditFamily,
    onAddChild,
    findRoomForChild,
    getChildAgeInMonths,
    onProceed,
    isLoading,
    rooms
}: ChildSelectionStepProps) {
    if (!familyData || !familyData.children || familyData.children.length === 0) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle className="text-center">No Children Found</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                    <p className="mb-4">You don't have any children in your family profile.</p>
                    <Button onClick={onAddChild}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Child
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex justify-between items-center">
                    <span>Select Children</span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={onEditFamily}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit Family
                        </Button>
                        <Button variant="outline" size="sm" onClick={onAddChild}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Child
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {familyData.children.map((child) => {
                        const isSelected = selectedChildren.some(sc => sc.id === child.id);
                        const room = findRoomForChild(child, rooms);
                        const ageInMonths = getChildAgeInMonths(child.dateOfBirth);
                        const ageYears = Math.floor(ageInMonths / 12);
                        const ageMonths = ageInMonths % 12;

                        let ageDisplay = "";
                        if (ageYears > 0) {
                            ageDisplay += `${ageYears}yr`;
                            if (ageMonths > 0) ageDisplay += ` ${ageMonths}mo`;
                        } else {
                            ageDisplay = `${ageMonths}mo`;
                        }

                        return (
                            <div
                                key={child.id}
                                className={`p-4 rounded-lg border ${isSelected ? 'border-primary bg-primary/5' : 'border-border'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <div className="flex items-center">
                                            <h3 className="font-medium">{child.firstName} {child.lastName}</h3>
                                            <Badge variant="outline" className="ml-2">
                                                {ageDisplay}
                                            </Badge>
                                        </div>
                                        {room ? (
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Assigned room: {room.name}
                                            </p>
                                        ) : (
                                            <p className="text-sm text-destructive mt-1">
                                                No appropriate room available for this age
                                            </p>
                                        )}
                                        {child.allergies && (
                                            <p className="text-sm text-destructive mt-1">
                                                Allergies: {child.allergies}
                                            </p>
                                        )}
                                    </div>
                                    <Button
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        className="ml-4"
                                        onClick={() => onChildToggle(child)}
                                        disabled={!room}
                                    >
                                        {isSelected && <Check className="h-4 w-4 mr-2" />}
                                        {isSelected ? "Selected" : "Select"}
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
            <CardFooter>
                <Button
                    className="w-full"
                    disabled={selectedChildren.length === 0 || isLoading}
                    onClick={onProceed}
                >
                    Check In {selectedChildren.length > 0 ? `(${selectedChildren.length})` : ""}
                </Button>
            </CardFooter>
        </Card>
    );
} 