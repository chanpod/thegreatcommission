import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Trash2, UserPlus, Mail } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "~/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { toast } from "sonner";
import { useFetcher } from "react-router";
import { MessageOrganizers } from "./MessageOrganizers";

export type Organizer = {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl?: string;
};

type EventOrganizersProps = {
    eventId: string;
    churchOrganizationId: string;
    organizers: Organizer[];
    isAdmin: boolean;
    onOrganizersChange?: (organizers: Organizer[]) => void;
};

export function EventOrganizers({
    eventId,
    churchOrganizationId,
    organizers,
    isAdmin,
    onOrganizersChange,
}: EventOrganizersProps) {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showMessageDialog, setShowMessageDialog] = useState(false);
    const [selectedOrganizerId, setSelectedOrganizerId] = useState<string | null>(null);
    const [availableMembers, setAvailableMembers] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [currentOrganizers, setCurrentOrganizers] = useState<Organizer[]>(organizers);

    const fetcher = useFetcher();

    // Load organization members when add dialog opens
    useEffect(() => {
        if (showAddDialog) {
            loadOrganizationMembers();
        }
    }, [showAddDialog]);

    const loadOrganizationMembers = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/organizations/${churchOrganizationId}/members`);
            if (response.ok) {
                const data = await response.json();
                // Filter out users who are already organizers
                const filteredMembers = data.members.filter(
                    (member: any) => !currentOrganizers.some((org) => org.id === member.id)
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

    const handleAddOrganizer = (userId: string) => {
        if (!userId) return;

        fetcher.submit(
            {
                action: "addOrganizer",
                userId,
            },
            { method: "post", action: `/api/events/${eventId}/organizers` }
        );

        setShowAddDialog(false);
    };

    const handleRemoveOrganizer = (organizerId: string) => {
        fetcher.submit(
            {
                action: "removeOrganizer",
                userId: organizerId,
            },
            { method: "post", action: `/api/events/${eventId}/organizers` }
        );
    };

    // Update state when fetcher data changes
    useEffect(() => {
        if (fetcher.data) {
            if (fetcher.data.success && fetcher.data.organizers) {
                setCurrentOrganizers(fetcher.data.organizers);
                if (onOrganizersChange) {
                    onOrganizersChange(fetcher.data.organizers);
                }
            } else if (fetcher.data.error) {
                toast.error(fetcher.data.error);
            }
        }
    }, [fetcher.data, onOrganizersChange]);

    // Initialize with props
    useEffect(() => {
        setCurrentOrganizers(organizers);
    }, [organizers]);

    return (
        <Card>
            <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
                <CardTitle className="text-lg">Event Organizers</CardTitle>
                <div className="flex flex-wrap justify-end gap-2 pl-3 w-full sm:w-auto">
                    {isAdmin && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAddDialog(true)}
                            className="flex-grow sm:flex-grow-0"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Add Organizer
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMessageDialog(true)}
                        className="flex-grow sm:flex-grow-0"
                    >
                        <Mail className="h-4 w-4 mr-2" />
                        Contact Organizers
                    </Button>
                </div>
            </CardHeader>
            <CardContent>
                {currentOrganizers.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                        No organizers assigned to this event yet.
                    </p>
                ) : (
                    <div className="space-y-3">
                        {currentOrganizers.map((organizer) => (
                            <div
                                key={organizer.id}
                                className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50"
                            >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                    <Avatar>
                                        <AvatarImage src={organizer.avatarUrl} />
                                        <AvatarFallback>
                                            {organizer.firstName?.[0]}
                                            {organizer.lastName?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium truncate">
                                            {organizer.firstName} {organizer.lastName}
                                        </p>
                                        <p className="text-sm text-gray-500 truncate">{organizer.email}</p>
                                    </div>
                                </div>
                                {isAdmin && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleRemoveOrganizer(organizer.id)}
                                        className="flex-shrink-0 ml-2"
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>

            {/* Add Organizer Dialog */}
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Event Organizer</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="member-select">Select Organization Member</Label>
                        <Select onValueChange={setSelectedOrganizerId}>
                            <SelectTrigger id="member-select" className="w-full">
                                <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                                {availableMembers.map((member) => (
                                    <SelectItem key={member.id} value={member.id}>
                                        {member.firstName} {member.lastName} - {member.email}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {availableMembers.length === 0 && !isLoading && (
                            <p className="text-sm text-gray-500 mt-2">
                                No available members found. All members are already organizers.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowAddDialog(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => handleAddOrganizer(selectedOrganizerId!)}
                            disabled={!selectedOrganizerId || fetcher.state === "submitting"}
                        >
                            {fetcher.state === "submitting" ? "Adding..." : "Add Organizer"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Message Organizers Dialog */}
            <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Message Event Organizers</DialogTitle>
                    </DialogHeader>
                    <MessageOrganizers
                        eventId={eventId}
                        organizerCount={currentOrganizers.length}
                        organizers={currentOrganizers}
                        churchOrganizationId={churchOrganizationId}
                    />
                </DialogContent>
            </Dialog>
        </Card>
    );
} 