import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Pencil, Plus, Trash, ArrowLeft } from "lucide-react";
import { ChildCheckinActions } from "~/routes/landing.$organization.childcheckin";
import type { Family } from "@/server/db/schema";

interface Guardian {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
    photoUrl?: string;
}

interface Child {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    allergies?: string;
    specialNotes?: string;
    photoUrl?: string;
}

interface FamilyData {
    family: Family;
    name?: string;
    guardians: Guardian[];
    children: Child[];
}

interface FamilyEditorFormProps {
    familyData: FamilyData;
    onClose: () => void;
    onSave: (formData: FormData) => void;
    onEditChild: (child: Child) => void;
    onAddChild: () => void;
    isLoading: boolean;
}

export function FamilyEditorForm({
    familyData,
    onClose,
    onSave,
    onEditChild,
    onAddChild,
    isLoading
}: FamilyEditorFormProps) {
    const [activeTab, setActiveTab] = useState<string>("children");
    const [newGuardians, setNewGuardians] = useState<Partial<Guardian>[]>([]);

    if (!familyData) {
        return (
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Error Loading Family Data</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Unable to load family information.</p>
                </CardContent>
                <CardFooter>
                    <Button onClick={onClose}>Go Back</Button>
                </CardFooter>
            </Card>
        );
    }

    // Add a new guardian to the form
    const handleAddGuardian = () => {
        setNewGuardians([...newGuardians, {
            firstName: '',
            lastName: '',
            phone: '',
            email: ''
        }]);
    };

    // Remove a new guardian from the form
    const handleRemoveNewGuardian = (index: number) => {
        setNewGuardians(newGuardians.filter((_, i) => i !== index));
    };

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        formData.append("_action", ChildCheckinActions.UPDATE_FAMILY);

        // Add new guardians info to the form data
        newGuardians.forEach((guardian, index) => {
            const newGuardianIndex = familyData.guardians.length + index;
            formData.append(`newGuardians[${index}].firstName`, guardian.firstName || '');
            formData.append(`newGuardians[${index}].lastName`, guardian.lastName || '');
            formData.append(`newGuardians[${index}].phone`, guardian.phone || '');
            if (guardian.email) {
                formData.append(`newGuardians[${index}].email`, guardian.email);
            }
        });

        onSave(formData);
    };

    return (
        <Card className="w-full">
            <CardHeader>

                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={onClose}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <span>Edit Family</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="children">Children</TabsTrigger>
                        <TabsTrigger value="guardians">Guardians</TabsTrigger>
                    </TabsList>

                    <TabsContent value="children" className="mt-4 space-y-4">
                        <div className="flex justify-between">
                            <h3 className="text-lg font-medium">Children</h3>
                            <Button size="sm" onClick={onAddChild}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Child
                            </Button>
                        </div>

                        {familyData.children && familyData.children.length > 0 ? (
                            <div className="space-y-4">
                                {familyData.children.map((child) => (
                                    <div key={child.id} className="p-4 border rounded-lg">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium">{child.firstName} {child.lastName}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    DOB: {new Date(child.dateOfBirth).toLocaleDateString()}
                                                </p>
                                                {child.allergies && (
                                                    <p className="text-sm text-destructive">
                                                        Allergies: {child.allergies}
                                                    </p>
                                                )}
                                            </div>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onEditChild(child)}
                                            >
                                                <Pencil className="h-4 w-4 mr-2" />
                                                Edit
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center p-8 border border-dashed rounded-lg">
                                <p className="mb-4 text-muted-foreground">No children added yet</p>
                                <Button onClick={onAddChild}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Child
                                </Button>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="guardians" className="mt-4">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Guardians</h3>
                                <Button size="sm" onClick={handleAddGuardian}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add Guardian
                                </Button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <input type="hidden" name="familyId" value={familyData.family.id} />

                                {familyData.guardians && familyData.guardians.map((guardian, index) => (
                                    <div key={guardian.id} className="p-4 border rounded-lg space-y-4">
                                        <input type="hidden" name={`guardians[${index}].id`} value={guardian.id} />

                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="font-medium">Guardian {index + 1}</h4>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor={`firstName-${index}`}>First Name</Label>
                                                <Input
                                                    id={`firstName-${index}`}
                                                    name={`guardians[${index}].firstName`}
                                                    defaultValue={guardian.firstName}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`lastName-${index}`}>Last Name</Label>
                                                <Input
                                                    id={`lastName-${index}`}
                                                    name={`guardians[${index}].lastName`}
                                                    defaultValue={guardian.lastName}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`phone-${index}`}>Phone Number</Label>
                                            <Input
                                                id={`phone-${index}`}
                                                name={`guardians[${index}].phone`}
                                                type="tel"
                                                defaultValue={guardian.phone}
                                                required
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor={`email-${index}`}>Email (Optional)</Label>
                                            <Input
                                                id={`email-${index}`}
                                                name={`guardians[${index}].email`}
                                                type="email"
                                                defaultValue={guardian.email || ""}
                                            />
                                        </div>
                                    </div>
                                ))}

                                {newGuardians.map((guardian, index) => {
                                    const guardianIndex = familyData.guardians.length + index;
                                    return (
                                        <div key={`new-guardian-${index}`} className="p-4 border border-dashed rounded-lg space-y-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium">New Guardian</h4>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRemoveNewGuardian(index)}
                                                    className="text-destructive"
                                                >
                                                    <Trash className="h-4 w-4" />
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label htmlFor={`new-firstName-${index}`}>First Name</Label>
                                                    <Input
                                                        id={`new-firstName-${index}`}
                                                        value={guardian.firstName}
                                                        onChange={(e) => {
                                                            const updatedGuardians = [...newGuardians];
                                                            updatedGuardians[index] = { ...guardian, firstName: e.target.value };
                                                            setNewGuardians(updatedGuardians);
                                                        }}
                                                        required
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <Label htmlFor={`new-lastName-${index}`}>Last Name</Label>
                                                    <Input
                                                        id={`new-lastName-${index}`}
                                                        value={guardian.lastName}
                                                        onChange={(e) => {
                                                            const updatedGuardians = [...newGuardians];
                                                            updatedGuardians[index] = { ...guardian, lastName: e.target.value };
                                                            setNewGuardians(updatedGuardians);
                                                        }}
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`new-phone-${index}`}>Phone Number</Label>
                                                <Input
                                                    id={`new-phone-${index}`}
                                                    type="tel"
                                                    value={guardian.phone}
                                                    onChange={(e) => {
                                                        const updatedGuardians = [...newGuardians];
                                                        updatedGuardians[index] = { ...guardian, phone: e.target.value };
                                                        setNewGuardians(updatedGuardians);
                                                    }}
                                                    required
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label htmlFor={`new-email-${index}`}>Email (Optional)</Label>
                                                <Input
                                                    id={`new-email-${index}`}
                                                    type="email"
                                                    value={guardian.email || ""}
                                                    onChange={(e) => {
                                                        const updatedGuardians = [...newGuardians];
                                                        updatedGuardians[index] = { ...guardian, email: e.target.value };
                                                        setNewGuardians(updatedGuardians);
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="space-y-2">
                                    <Label htmlFor="familyName">Family Name</Label>
                                    <Input
                                        id="familyName"
                                        name="familyName"
                                        defaultValue={familyData.family.name || ""}
                                        placeholder="e.g. Smith Family"
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Saving..." : "Save Family Information"}
                                </Button>
                            </form>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
} 