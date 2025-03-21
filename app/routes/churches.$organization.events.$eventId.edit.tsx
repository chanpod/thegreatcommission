import {
	useNavigate,
	useLoaderData,
	useParams,
	useSubmit,
	useSearchParams,
	useActionData,
} from "react-router";
import { db } from "@/server/db/dbConnection";
import { events, usersToEvents, users } from "server/db/schema";
import { eq, and } from "drizzle-orm";
import { EventDialog } from "~/components/events/EventDialog";
import type { Route } from "../+types/root";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Organizer } from "~/components/events/EventOrganizerSelector";

export const loader = async ({ params }: Route.LoaderArgs) => {
	// Get the event
	const event = await db
		.select()
		.from(events)
		.where(eq(events.id, params.eventId))
		.then((rows) => rows[0]);

	if (!event) {
		throw new Error("Event not found");
	}

	// Get event organizers
	const organizers = await db
		.select({
			id: users.id,
			firstName: users.firstName,
			lastName: users.lastName,
			email: users.email,
			avatarUrl: users.avatarUrl,
		})
		.from(usersToEvents)
		.innerJoin(users, eq(usersToEvents.userId, users.id))
		.where(
			and(
				eq(usersToEvents.eventId, params.eventId),
				eq(usersToEvents.role, "organizer")
			)
		);

	return {
		event: {
			...event,
			organizers
		}
	};
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	try {
		const formData = await request.formData();
		const action = formData.get("action");

		switch (action) {
			case "update": {
				const eventData = {
					title: formData.get("title") as string,
					description: formData.get("description") as string,
					startDate: new Date(formData.get("startDate") as string),
					endDate: new Date(formData.get("endDate") as string),
					allDay: formData.get("allDay") === "true",
					type: formData.get("type") as string,
					location: formData.get("location") as string,
					heroImageUrl: (formData.get("heroImageUrl") as string) || null,
					volunteersNeeded: Number(formData.get("volunteersNeeded")) || null,
					investment: Number(formData.get("investment")) || null,
					fundingRaised: Number(formData.get("fundingRaised")) || null,
					updatedAt: new Date(),
				};

				// Update the event
				const updatedEvent = await db
					.update(events)
					.set(eventData)
					.where(eq(events.id, params.eventId))
					.returning();

				// Handle organizers
				const organizersJson = formData.get("organizers") as string;
				if (organizersJson) {
					const organizers = JSON.parse(organizersJson) as Organizer[];

					// First, remove all existing organizers
					await db
						.delete(usersToEvents)
						.where(
							and(
								eq(usersToEvents.eventId, params.eventId),
								eq(usersToEvents.role, "organizer")
							)
						);

					// Then add the new organizers
					if (organizers.length > 0) {
						const organizerValues = organizers.map(organizer => ({
							userId: organizer.id,
							eventId: params.eventId,
							role: "organizer",
							status: null,
							createdAt: new Date(),
							updatedAt: new Date(),
						}));

						await db.insert(usersToEvents).values(organizerValues);
					}
				}

				return { success: true, event: updatedEvent[0] };
			}
			case "delete": {
				// First delete all user-to-event relationships
				await db
					.delete(usersToEvents)
					.where(eq(usersToEvents.eventId, params.eventId));

				// Then delete the event
				await db.delete(events).where(eq(events.id, params.eventId));

				return { success: true };
			}
			default:
				return { success: false, error: "Invalid action" };
		}
	} catch (error) {
		console.error("Error in event action:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		};
	}
};

export function EditEvent() {
	const { event } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
	const [open, setOpen] = useState(true);
	const navigate = useNavigate();
	const params = useParams();
	const [searchParams] = useSearchParams();
	const submit = useSubmit();

	// Handle successful action completion
	useEffect(() => {
		if (actionData) {
			setIsSubmitting(false);

			if (actionData.success) {
				// Close the dialogs
				setOpen(false);
				setShowDeleteConfirm(false);

				const message = actionData.event
					? "Event updated successfully"
					: "Event deleted successfully";
				const description = actionData.event
					? "Your event has been updated."
					: "Your event has been deleted.";

				toast.success(message, {
					description: description,
				});

				navigate(
					`/churches/${params.organization}/events?${searchParams.toString()}`,
				);
			} else if (actionData.error) {
				toast.error(`Error: ${actionData.error}`);
			}
		}
	}, [actionData, navigate, params.organization, searchParams]);

	const handleClose = () => {
		if (!isSubmitting) {
			navigate(
				`/churches/${params.organization}/events?${searchParams.toString()}`,
			);
		}
	};

	const handleUpdateEvent = (updatedEvent: typeof events.$inferSelect & { organizers?: Organizer[] }) => {
		setIsSubmitting(true);
		const formData = new FormData();
		formData.append("action", "update");
		formData.append("eventId", updatedEvent.id);
		formData.append("title", updatedEvent.title);
		formData.append("description", updatedEvent.description || "");
		formData.append("startDate", updatedEvent.startDate.toISOString());
		formData.append("endDate", updatedEvent.endDate.toISOString());
		formData.append("allDay", String(updatedEvent.allDay));
		formData.append("type", updatedEvent.type);
		formData.append("location", updatedEvent.location || "");
		const eventWithHeroImage = updatedEvent as typeof events.$inferSelect & {
			heroImageUrl?: string;
		};
		formData.append("heroImageUrl", eventWithHeroImage.heroImageUrl || "");
		if (updatedEvent.volunteersNeeded) {
			formData.append(
				"volunteersNeeded",
				String(updatedEvent.volunteersNeeded),
			);
		}
		if (updatedEvent.investment) {
			formData.append("investment", String(updatedEvent.investment));
		}
		if (updatedEvent.fundingRaised) {
			formData.append("fundingRaised", String(updatedEvent.fundingRaised));
		}

		// Include organizers
		if (updatedEvent.organizers) {
			formData.append("organizers", JSON.stringify(updatedEvent.organizers));
		}

		submit(formData, { method: "post" });
	};

	const handleDeleteEvent = () => {
		// Set isSubmitting to true immediately to prevent race conditions
		setIsSubmitting(true);

		// Create and submit the form data directly
		const formData = new FormData();
		formData.append("action", "delete");
		formData.append("eventId", event.id);
		submit(formData, { method: "post" });
	};

	return (
		<>
			<EventDialog
				open={open}
				onOpenChange={(isOpen) => {
					// Prevent closing the dialog when submitting
					if (isSubmitting) {
						return;
					}

					// Only handle closing (not opening)
					if (!isOpen) {
						handleClose();
					}
				}}
				event={event}
				onSubmit={handleUpdateEvent}
				onDelete={handleDeleteEvent}
				mode="edit"
				isSubmitting={isSubmitting}
				showDeleteConfirm={showDeleteConfirm}
				setShowDeleteConfirm={setShowDeleteConfirm}
				churchOrganizationId={event.churchOrganizationId}
			/>
		</>
	);
}

export default EditEvent;
