import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Trash2, UserPlus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { toast } from "sonner";

export type Organizer = {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    avatarUrl?: string | null;
};

interface EventOrganizerSelectorProps {
    churchOrganizationId: string;
    organizers: Organizer[];
    onChange: (organizers: Organizer[]) => void;
}

export function EventOrganizerSelector({
    churchOrganizationId,
    organizers,
    onChange,
}: EventOrganizerSelectorProps) {
    const [availableMembers, setAvailableMembers] = useState<Organizer[]>([]);
    const [selectedOrganizerId, setSelectedOrganizerId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Load organization members when component mounts
    useEffect(() => {
        loadOrganizationMembers();
    }, [churchOrganizationId]);

    const loadOrganizationMembers = async () => {
        if (!churchOrganizationId) return;

        setIsLoading(true);
        try {
            const response = await fetch(`/api/organizations/${churchOrganizationId}/members`);
            if (response.ok) {
                const data = await response.json();
                // Filter out users who are already organizers
                const filteredMembers = data.members.filter(
                    (member: Organizer) => !organizers.some((org) => org.id === member.id)
                );
                setAvailableMembers(filteredMembers);
            } else {
                toast.error("Failed to load organization members");
            }
        } catch (error) {
            toast.error("An error occurred while loading members");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddOrganizer = () => {
        if (!selectedOrganizerId) return;

        const selectedMember = availableMembers.find(
            (member) => member.id === selectedOrganizerId
        );

        if (selectedMember) {
            // Add to organizers list
            const updatedOrganizers = [...organizers, selectedMember];
            onChange(updatedOrganizers);

            // Remove from available members
            setAvailableMembers(availableMembers.filter(
                (member) => member.id !== selectedOrganizerId
            ));

            // Reset selection
            setSelectedOrganizerId(null);
        }
    };

    const handleRemoveOrganizer = (organizerId: string) => {
        // Find the organizer to remove
        const organizerToRemove = organizers.find(org => org.id === organizerId);

        if (organizerToRemove) {
            // Remove from organizers list
            const updatedOrganizers = organizers.filter(org => org.id !== organizerId);
            onChange(updatedOrganizers);

            // Add back to available members
            setAvailableMembers([...availableMembers, organizerToRemove]);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col space-y-2">
                <Label>Event Organizers</Label>
                <p className="text-sm text-muted-foreground">
                    Organizers can manage this event and will receive messages sent to event organizers.
                </p>
            </div>

            {/* Current organizers list */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
                {organizers.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic">No organizers assigned yet.</p>
                ) : (
                    organizers.map((organizer) => (
                        <div
                            key={organizer.id}
                            className="flex items-center justify-between p-2 rounded-md border"
                        >
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={organizer.avatarUrl || undefined} />
                                    <AvatarFallback>
                                        {organizer.firstName?.[0]}
                                        {organizer.lastName?.[0]}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-sm font-medium">
                                        {organizer.firstName} {organizer.lastName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{organizer.email}</p>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveOrganizer(organizer.id)}
                                title="Remove organizer"
                            >
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </div>
                    ))
                )}
            </div>

            {/* Add organizer controls */}
            <div className="flex items-end gap-2">
                <div className="flex-1">
                    <Label htmlFor="member-select" className="mb-2 block">Add Organizer</Label>
                    <Select
                        value={selectedOrganizerId || ""}
                        onValueChange={setSelectedOrganizerId}
                        disabled={isLoading || availableMembers.length === 0}
                    >
                        <SelectTrigger id="member-select">
                            <SelectValue placeholder="Select a member" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    {member.firstName} {member.lastName}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <Button
                    type="button"
                    onClick={handleAddOrganizer}
                    disabled={!selectedOrganizerId || isLoading}
                    className="flex-shrink-0"
                >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add
                </Button>
            </div>

            {availableMembers.length === 0 && !isLoading && (
                <p className="text-xs text-muted-foreground">
                    No more members available to add as organizers.
                </p>
            )}
        </div>
    );
} 