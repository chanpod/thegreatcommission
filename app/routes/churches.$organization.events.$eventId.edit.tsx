import {
	useNavigate,
	useLoaderData,
	useParams,
	useSubmit,
	useSearchParams,
	useActionData,
} from "react-router";
import { db } from "~/server/dbConnection";
import { events } from "server/db/schema";
import { eq } from "drizzle-orm";
import { EventDialog } from "~/components/events/EventDialog";
import type { Route } from "../+types/root";
import { useEffect } from "react";
import { toast } from "sonner";

export const loader = async ({ params }: Route.LoaderArgs) => {
	const event = await db
		.select()
		.from(events)
		.where(eq(events.id, params.eventId))
		.then((rows) => rows[0]);

	if (!event) {
		throw new Error("Event not found");
	}

	return { event };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
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

			const updatedEvent = await db
				.update(events)
				.set(eventData)
				.where(eq(events.id, params.eventId))
				.returning();

			return { success: true, event: updatedEvent[0] };
		}
		case "delete": {
			await db.delete(events).where(eq(events.id, params.eventId));

			return { success: true };
		}
		default:
			throw new Error("Invalid action");
	}
};

export default function EditEvent() {
	const { event } = useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const navigate = useNavigate();
	const params = useParams();
	const [searchParams, setSearchParams] = useSearchParams();
	const submit = useSubmit();

	// Handle successful action completion
	useEffect(() => {
		if (actionData?.success) {
			toast.success(
				actionData.event
					? "Event updated successfully"
					: "Event deleted successfully",
			);
			navigate(
				`/churches/${params.organization}/events?${searchParams.toString()}`,
			);
		}
	}, [actionData, navigate, params.organization, searchParams]);

	const handleClose = () => {
		navigate(
			`/churches/${params.organization}/events?${searchParams.toString()}`,
		);
	};

	const handleSubmit = (updatedEvent: typeof events.$inferSelect) => {
		const formData = new FormData();
		console.log(updatedEvent);
		formData.append("action", "update");
		formData.append("eventId", updatedEvent.id);
		formData.append("title", updatedEvent.title);
		formData.append("description", updatedEvent.description || "");
		formData.append("startDate", updatedEvent.startDate.toISOString());
		formData.append("endDate", updatedEvent.endDate.toISOString());
		formData.append("allDay", String(updatedEvent.allDay));
		formData.append("type", updatedEvent.type);
		formData.append("location", updatedEvent.location || "");
		formData.append("heroImageUrl", (updatedEvent as any).heroImageUrl || "");
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

		submit(formData, { method: "post" });
	};

	const handleDelete = () => {
		const formData = new FormData();
		formData.append("action", "delete");
		submit(formData, { method: "post" });
	};

	return (
		<EventDialog
			open={true}
			onOpenChange={(open) => !open && handleClose()}
			event={event}
			onSubmit={handleSubmit}
			onDelete={handleDelete}
			mode="edit"
		/>
	);
}
