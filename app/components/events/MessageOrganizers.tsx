import { useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner"
import { Loader2 } from "lucide-react";
import { useFetcher } from "react-router";
import type { Organizer } from "./EventOrganizers";
import useFetch from "~/hooks/useFetch";

interface MessageOrganizersProps {
    eventId: string;
    organizerCount: number;
    organizers: Organizer[];
    churchOrganizationId: string;
}

export function MessageOrganizers({ eventId, organizerCount, organizers, churchOrganizationId }: MessageOrganizersProps) {
    const [subject, setSubject] = useState("");
    const [message, setMessage] = useState("");
    const { data, error, loading, callFetch } = useFetch(async (formData: FormData) => {
        const response = await fetch(`/churches/${churchOrganizationId}/message`, {
            method: "post",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Failed to send message to organizers.");
        }

        return response.json();
    });

    const fetcher = useFetcher();
    const isSubmitting = fetcher.state === "submitting";

    useEffect(() => {
        if (data) {
            if (data.details.summary.success > 0) {
                toast.success(`Successfully sent message to ${data.details.summary.success} organizer${organizerCount !== 1 ? 's' : ''}.`);
            } else {
                toast.error(data.error || "Failed to send message to organizers.");
            }

            if (data.details.skippedRecipients.length > 0) {
                data.details.skippedRecipients.forEach(recipient => {
                    toast.warning(`Skipped ${recipient.recipient.firstName} ${recipient.recipient.lastName} because ${recipient.reason}.`);
                });
            }
        }
    }, [data]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim()) {
            toast.error("Please enter a subject for your message.");
            return;
        }

        if (!message.trim()) {
            toast.error("Please enter a message to send to the organizers.");
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

        callFetch(formData);
    };

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
                    <Button loading={loading} type="submit" disabled={isSubmitting}>
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