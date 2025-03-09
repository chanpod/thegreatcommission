import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Camera as CameraIcon, Upload as UploadIcon } from "lucide-react";
import { type Child } from "./types";

interface EditChildFormProps {
    child?: Child | null;
    onSubmit: (e: React.FormEvent) => void;
    onCancel: () => void;
    isLoading: boolean;
    openCamera: () => void;
    photoDataUrl: string | null;
}

export function EditChildForm({
    child,
    onSubmit,
    onCancel,
    isLoading,
    openCamera,
    photoDataUrl
}: EditChildFormProps) {
    const isEditing = !!child?.id;
    const title = isEditing ? "Edit Child" : "Add Child";

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="text-center">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={onSubmit} className="space-y-4">
                    {isEditing && (
                        <input type="hidden" name="childId" value={child.id} />
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                            id="firstName"
                            name="firstName"
                            defaultValue={child?.firstName || ""}
                            required
                            autoFocus
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                            id="lastName"
                            name="lastName"
                            defaultValue={child?.lastName || ""}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="dateOfBirth">Date of Birth</Label>
                        <Input
                            id="dateOfBirth"
                            name="dateOfBirth"
                            type="date"
                            defaultValue={
                                child?.dateOfBirth
                                    ? new Date(child.dateOfBirth)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                            }
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="allergies">Allergies</Label>
                        <Input
                            id="allergies"
                            name="allergies"
                            defaultValue={child?.allergies || ""}
                            placeholder="List any allergies"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="specialNeeds">Special Needs</Label>
                        <Textarea
                            id="specialNeeds"
                            name="specialNeeds"
                            defaultValue={child?.specialNeeds || ""}
                            placeholder="Any special needs or notes"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="childPhoto">
                            Child Photo (Important for Security)
                        </Label>

                        {/* Show photo preview if available */}
                        {(photoDataUrl || child?.photoUrl) && (
                            <div className="flex flex-col items-center space-y-2 mb-2">
                                <div className="relative w-32 h-32 rounded overflow-hidden border">
                                    <img
                                        src={photoDataUrl || child?.photoUrl}
                                        alt="Child Photo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Photo upload options */}
                        <div className="flex justify-center gap-2 mt-2">
                            <Button
                                type="button"
                                onClick={openCamera}
                            >
                                <CameraIcon className="h-4 w-4 mr-2" />
                                Take Photo
                            </Button>

                            <label
                                htmlFor="childPhoto"
                                className="flex items-center justify-center px-4 py-2 border border-transparent 
                text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                            >
                                <UploadIcon className="h-4 w-4 mr-2" />
                                Upload
                            </label>

                            <input
                                id="childPhoto"
                                name="childPhoto"
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(e) => {
                                    // File upload is handled by the parent component
                                }}
                            />
                        </div>

                        {/* Hidden field to submit photo data */}
                        {photoDataUrl && (
                            <input
                                type="hidden"
                                name="photoDataUrl"
                                value={photoDataUrl}
                            />
                        )}
                    </div>

                    <div className="flex gap-2 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            className="flex-1"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
} 