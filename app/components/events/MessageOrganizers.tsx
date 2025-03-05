import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { useToast } from "~/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { useFetcher } from "react-router";
import type { Organizer } from "./EventOrganizers";

interface MessageOrganizersProps {
    eventId: string;
    organizerCount: number;
    organizers: Organizer[];
    churchOrganizationId: string;
}

export function MessageOrganizers({ eventId, organizerCount, organizers, churchOrganizationId }: MessageOrganizersProps) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const { toast } = useToast();
    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim()) {
            toast({
                title: "Subject Required",
                description: "Please enter a subject for your message.",
                variant: "destructive",
            });
            return;
        }

        if (!message.trim()) {
            toast({
                title: "Message Required",
                description: "Please enter a message to send to the organizers.",
                variant: "destructive",
            });
            return;
        }

        const formData = new FormData();
        formData.append("subject", subject);
        formData.append("message", message);
        formData.append("type", "email");
        formData.append("format", JSON.stringify({ html: true }));

        // Add each organizer as a recipient
        organizers.forEach(organizer => {
            formData.append("recipientIds[]", `user:${organizer.id}`);
        });

        fetcher.submit(formData, {
            method: "post",
            action: `/churches/${churchOrganizationId}/message`
        });
    };

    // Handle response
    useEffect(() => {
        if (fetcher.data && fetcher.state === "idle") {
            if (fetcher.data.success) {
                toast({
                    title: "Message Sent",
                    description: fetcher.data.message || `Successfully sent message to ${organizerCount} organizer${organizerCount !== 1 ? 's' : ''}.`,
                });
                setSubject("");
                setMessage("");
            } else {
                toast({
                    title: "Error",
                    description: fetcher.data.error || "Failed to send message to organizers.",
                    variant: "destructive",
                });
            }
        }
    }, [fetcher.data, fetcher.state, organizerCount, toast]);

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Message Organizers</CardTitle>
                <CardDescription>
                    Send a message to all {organizerCount} organizer{organizerCount !== 1 ? 's' : ''} of this event.
                </CardDescription>
            </CardHeader>
            <fetcher.Form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="subject">Subject</Label>
                        <Input
                            id="subject"
                            placeholder="Enter message subject"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={isSubmitting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                            id="message"
                            placeholder="Enter your message to the organizers"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            rows={5}
                            disabled={isSubmitting}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            "Send Message"
                        )}
                    </Button>
                </CardFooter>
            </fetcher.Form>
        </Card>
    );
} 