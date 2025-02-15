import type { users, userPreferences } from "@/server/db/schema";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
    Bell,
    Bold,
    Italic,
    List,
    Mail,
    MessageSquare,
    Phone,
    AlertTriangle
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Toggle } from "~/components/ui/toggle";
import { Alert, AlertDescription } from "~/components/ui/alert";
const MAX_ALERT_LENGTH = 160;

interface MessageComposerProps {
    onSend: (data: {
        message: string;
        type: "alert" | "email" | "sms" | "phone";
        format?: {
            bold?: boolean;
            italic?: boolean;
            list?: boolean;
        };
    }) => void;
    onCancel: () => void;
    selectedMembers: Array<typeof users.$inferSelect & {
        preferences: typeof userPreferences.$inferSelect;
    }>;
}

export function MessageComposer({ onSend, onCancel, selectedMembers }: MessageComposerProps) {
    const [messageType, setMessageType] = useState<"alert" | "custom">("alert");
    const [customType, setCustomType] = useState<"email" | "sms" | "phone">("email");
    const [message, setMessage] = useState("");
    const [format, setFormat] = useState({
        bold: false,
        italic: false,
        list: false,
    });

    const [isOpen, setIsOpen] = useState(false);
    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: selectedMembers.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 80,
        overscan: 5,
    });

    // Force virtualizer to update when popover opens
    useEffect(() => {
        if (isOpen) {
            virtualizer.measure();
        }
    }, [isOpen, virtualizer]);

    const handleSend = () => {
        if (!message.trim()) return;

        onSend({
            message,
            type: messageType === "alert" ? "alert" : customType,
            format: messageType === "custom" && customType === "email" ? format : undefined,
        });
    };

    const isAlertTooLong = messageType === "alert" && message.length > MAX_ALERT_LENGTH;

    // Add warning check function
    const getWarnings = () => {

        const warnings = [];
        const unreachableMembers = selectedMembers.filter(member => {
            if (customType === "email") {
                return !member.email || !member.preferences.emailNotifications;
            }
            if (customType === "sms" || customType === "phone") {
                return !member.phone ||
                    (customType === "sms" && !member.preferences.smsNotifications) ||
                    (customType === "phone" && !member.preferences.phoneNotifications);
            }
            return false;
        });

        if (unreachableMembers.length > 0) {
            warnings.push({
                type: customType,
                members: unreachableMembers,
                count: unreachableMembers.length
            });
        }
        return warnings;

        return [];
    };

    const warnings = getWarnings();

    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">

                    <h2 className="text-lg font-semibold">Send Message to</h2>
                    <Popover open={isOpen} onOpenChange={setIsOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" className="font-medium">
                                {selectedMembers.length} Members
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="p-3 border-b">
                                <h3 className="font-medium">Selected Members</h3>
                            </div>
                            <div
                                ref={parentRef}
                                className="max-h-[300px] overflow-auto"
                            >
                                <div
                                    style={{
                                        height: `${virtualizer.getTotalSize()}px`,
                                        width: '100%',
                                        position: 'relative',
                                    }}
                                >
                                    {virtualizer.getVirtualItems().map((virtualRow) => {
                                        const member = selectedMembers[virtualRow.index];
                                        return (
                                            <div
                                                key={virtualRow.index}
                                                style={{
                                                    position: 'absolute',
                                                    top: 0,
                                                    left: 0,
                                                    width: '100%',
                                                    height: `${virtualRow.size}px`,
                                                    transform: `translateY(${virtualRow.start}px)`,
                                                }}
                                                className="p-3 border-b last:border-0"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {member.firstName} {member.lastName}
                                                        <div className="flex flex-row space-x-1">
                                                            <div>
                                                                {member.preferences.emailNotifications && (
                                                                    <Mail className="h-4 w-4 text-blue-500" />
                                                                )}
                                                            </div>
                                                            <div>

                                                                {member.preferences.smsNotifications && (
                                                                    <Phone className="h-4 w-4 text-blue-500" />
                                                                )}
                                                            </div>
                                                            {member.preferences.phoneNotifications && (
                                                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                                            )}
                                                        </div>
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        <div className="flex items-center gap-2">
                                                            <span>{member.email}</span>
                                                            {member.phone && <span>{member.phone}</span>}

                                                        </div>
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
                {warnings.map((warning, index) => (
                    <Alert variant="warning" key={index}>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="flex flex-col">
                            <span>
                                {warning.count} member{warning.count > 1 ? 's' : ''} cannot receive {warning.type} messages:
                            </span>
                            <div className="mt-2 text-sm">
                                {warning.members.map((member, i) => (
                                    <div key={i} className="text-muted-foreground">
                                        {member.firstName} {member.lastName}
                                        {warning.type === "email" && !member.email && " (no email)"}
                                        {warning.type === "email" && member.email && !member.preferences.emailNotifications && " (opted out)"}
                                        {(warning.type === "sms" || warning.type === "phone") && !member.phone && " (no phone)"}
                                        {warning.type === "sms" && member.phone && !member.preferences.smsNotifications && " (opted out)"}
                                        {warning.type === "phone" && member.phone && !member.preferences.phoneNotifications && " (opted out)"}
                                    </div>
                                ))}
                            </div>
                        </AlertDescription>
                    </Alert>
                ))}
            </div>

            <Tabs defaultValue="alert" onValueChange={(v) => setMessageType(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="alert" className="flex items-center gap-2">
                        <Bell className="h-4 w-4" />
                        Quick Alert
                    </TabsTrigger>
                    <TabsTrigger value="custom" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Custom Message
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="alert" className="space-y-4">
                    <div className="space-y-2">
                        <Label>Alert Message</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter a brief alert message..."
                            className={isAlertTooLong ? "border-red-500" : ""}
                        />
                        <p className={`text-sm ${isAlertTooLong ? "text-red-500" : "text-gray-500"}`}>
                            {message.length}/{MAX_ALERT_LENGTH} characters
                        </p>
                    </div>
                </TabsContent>

                <TabsContent value="custom" className="space-y-4">
                    <RadioGroup
                        value={customType}
                        onValueChange={(v) => setCustomType(v as any)}
                        className="flex space-x-4"
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="email" id="email" />
                            <Label htmlFor="email" className="flex items-center gap-1">
                                <Mail className="h-4 w-4" /> Email
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="sms" id="sms" />
                            <Label htmlFor="sms" className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" /> Text
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="phone" id="phone" />
                            <Label htmlFor="phone" className="flex items-center gap-1">
                                <Phone className="h-4 w-4" /> Phone
                            </Label>
                        </div>
                    </RadioGroup>

                    {customType === "email" && (
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <Toggle
                                    pressed={format.bold}
                                    onPressedChange={(pressed) => setFormat({ ...format, bold: pressed })}
                                >
                                    <Bold className="h-4 w-4" />
                                </Toggle>
                                <Toggle
                                    pressed={format.italic}
                                    onPressedChange={(pressed) => setFormat({ ...format, italic: pressed })}
                                >
                                    <Italic className="h-4 w-4" />
                                </Toggle>
                                <Toggle
                                    pressed={format.list}
                                    onPressedChange={(pressed) => setFormat({ ...format, list: pressed })}
                                >
                                    <List className="h-4 w-4" />
                                </Toggle>
                            </div>
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Compose your email message..."
                                className="min-h-[200px]"
                            />
                        </div>
                    )}

                    {customType === "sms" && (
                        <div className="space-y-2">
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter your text message..."
                            />
                        </div>
                    )}

                    {customType === "phone" && (
                        <div className="space-y-2">
                            <Textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Enter the message to be read by phone..."
                            />
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button
                    onClick={handleSend}
                    disabled={!message.trim() || isAlertTooLong}
                >
                    Send Message
                </Button>
            </div>
        </div>
    );
} 