import {
	addMonths,
	addWeeks,
	format,
	getDay,
	isSameDay,
	parse,
	startOfDay,
	startOfWeek,
} from "date-fns";
import { enUS } from "date-fns/locale";
import { eq } from "drizzle-orm";
import {
	Calendar,
	Clock,
	Edit,
	ExternalLink,
	MapPin,
	Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { Event } from "react-big-calendar";
import {
	Calendar as BigCalendar,
	Views,
	dateFnsLocalizer,
} from "react-big-calendar";
import {
	Link,
	Outlet,
	useLoaderData,
	useNavigate,
	useParams,
	useSearchParams,
	useSubmit,
} from "react-router";
import { events, users, usersToEvents } from "server/db/schema";
import { EventDialog } from "~/components/events/EventDialog";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { db } from "~/server/dbConnection";
import type { Route } from "../+types/root";
import { authenticator } from "~/server/auth/strategies/authenticaiton";
import { PermissionsService } from "@/server/services/PermissionsService";

// Ensure you have the CSS imported
import "react-big-calendar/lib/css/react-big-calendar.css";
import { stripHtml } from "~/lib/utils";

const locales = {
	"en-US": enUS,
};

const localizer = dateFnsLocalizer({
	format,
	parse,
	startOfWeek,
	getDay,
	locales,
});

type DbEvent = typeof events.$inferSelect;

export interface CalendarEvent extends Event {
	id: string;
	title: string;
	startDate: Date;
	endDate: Date;
	allDay?: boolean;
	description?: string;
	type?: "local" | "recurring" | "mission";
	location?: string;
	originalEventId?: string;
}

export const loader = async ({ request, params }) => {
	const user = await authenticator.isAuthenticated(request);
	if (!user) {
		throw new Error("Not authenticated");
	}

	// Initialize services
	const permissionsService = new PermissionsService();

	// Get permissions and events data in parallel
	const [permissions, eventsList] = await Promise.all([
		permissionsService.getEventPermissions(user.id, params.organization),
		db
			.select({
				event: events,
				userId: usersToEvents.userId,
				eventId: usersToEvents.eventId,
				user: users,
			})
			.from(events)
			.where(eq(events.churchOrganizationId, params.organization))
			.leftJoin(usersToEvents, eq(usersToEvents.eventId, events.id))
			.leftJoin(users, eq(usersToEvents.userId, users.id)),
	]);

	// Group participants by event
	const eventsWithParticipants = eventsList.reduce((acc, curr) => {
		const existingEvent = acc.find((e) => e.event.id === curr.event.id);
		if (existingEvent) {
			if (curr.user) {
				existingEvent.participants.push({
					userId: curr.userId,
					eventId: curr.eventId,
					user: curr.user,
				});
			}
			return acc;
		}
		acc.push({
			event: curr.event,
			participants: curr.user
				? [
						{
							userId: curr.userId,
							eventId: curr.eventId,
							user: curr.user,
						},
					]
				: [],
		});
		return acc;
	}, [] as EventWithParticipants[]);

	const now = new Date();
	const sixMonthsFromNow = addMonths(now, 6);

	// Transform events for calendar view with expanded recurring events
	const calendarEvents: CalendarEvent[] = [];
	for (const { event } of eventsWithParticipants) {
		if (event.type === "recurring") {
			// For recurring events, create instances for the next 6 months
			let currentDate = startOfDay(event.startDate);
			const endTime = event.endDate;
			const duration = endTime.getTime() - event.startDate.getTime();

			while (currentDate <= sixMonthsFromNow) {
				if (currentDate >= now) {
					const eventEndDate = new Date(currentDate.getTime() + duration);
					calendarEvents.push({
						id: `${event.id}-${currentDate.toISOString()}`,
						title: event.title,
						startDate: currentDate,
						endDate: eventEndDate,
						allDay: event.allDay,
						description: event.description || undefined,
						type: event.type,
						location: event.location || undefined,
						originalEventId: event.id,
					});
				}
				currentDate = addWeeks(currentDate, 1);
			}
		} else {
			// For non-recurring events, add them directly
			calendarEvents.push({
				id: event.id,
				title: event.title,
				startDate: event.startDate,
				endDate: event.endDate,
				allDay: event.allDay,
				description: event.description || undefined,
				type: event.type as "local" | "recurring" | "mission",
				location: event.location || undefined,
			});
		}
	}

	// Pre-sort events into upcoming and previous
	const upcomingEvents = eventsWithParticipants.filter(
		({ event }) => new Date(event.startDate) >= now,
	);
	const previousEvents = eventsWithParticipants.filter(
		({ event }) =>
			new Date(event.startDate) < now && event.type !== "recurring",
	);

	return {
		events: calendarEvents,
		upcomingEvents,
		previousEvents,
		permissions,
	};
};

type EventWithParticipants = {
	event: typeof events.$inferSelect;
	participants: {
		userId: string;
		eventId: string;
		user: typeof users.$inferSelect;
	}[];
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	const formData = await request.formData();
	const action = formData.get("action");

	if (action === "create") {
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
			churchOrganizationId: params.organization,
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		const newEvent = await db.insert(events).values(eventData).returning();
		return { success: true, event: newEvent[0] };
	}

	if (action === "update") {
		const eventId = formData.get("eventId") as string;
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
			.where(eq(events.id, eventId))
			.returning();

		return { success: true, event: updatedEvent[0] };
	}

	if (action === "delete") {
		const eventId = formData.get("eventId") as string;
		await db.delete(events).where(eq(events.id, eventId));
		return { success: true };
	}

	throw new Error("Invalid action");
};

function EventCard({
	event,
	onEdit,
	organizationId,
}: {
	event: CalendarEvent;
	onEdit: () => void;
	organizationId: string;
}) {
	const typeColors = {
		local: "rounded px-2 py-1 bg-blue-100 text-blue-800",
		recurring: "rounded px-2 py-1 bg-green-100 text-green-800",
		mission: "rounded px-2 py-1 bg-purple-100 text-purple-800",
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-start">
					<div>
						<CardTitle>{event.title}</CardTitle>
						<CardDescription>
							{stripHtml(event.description || "").slice(0, 200)}
						</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<span className={typeColors[event.type as keyof typeof typeColors]}>
							{event.type}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onClick={onEdit}
							className="h-8 w-8"
						>
							<Edit className="h-4 w-4" />
							<span className="sr-only">Edit event</span>
						</Button>
						<Button variant="ghost" size="icon" asChild className="h-8 w-8">
							<Link to={`/events/${event.id}/details`}>
								<ExternalLink className="h-4 w-4" />
								<span className="sr-only">View details</span>
							</Link>
						</Button>
					</div>
				</div>
			</CardHeader>
			<CardContent className="space-y-2">
				<div className="flex items-center text-sm text-gray-500">
					<Calendar className="w-4 h-4 mr-2" />
					<span>
						{format(event.startDate, "MMM d, yyyy")}
						{!isSameDay(event.startDate, event.endDate) &&
							` - ${format(event.endDate, "MMM d, yyyy")}`}
					</span>
				</div>
				<div className="flex items-center text-sm text-gray-500">
					<Clock className="w-4 h-4 mr-2" />
					<span>
						{format(event.startDate, "h:mm a")} -{" "}
						{format(event.endDate, "h:mm a")}
					</span>
				</div>
				{event.location && (
					<div className="flex items-center text-sm text-gray-500">
						<MapPin className="w-4 h-4 mr-2" />
						<span>{event.location}</span>
					</div>
				)}
			</CardContent>
		</Card>
	);
}

function CalendarEventComponent({
	event,
}: { event: CalendarEvent & { title: string } }) {
	const navigate = useNavigate();
	const eventId = event.originalEventId || event.id;

	return (
		<div className="relative group">
			<div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity">
				<Button
					variant="secondary"
					size="sm"
					className="h-6 w-6 p-0"
					onClick={(e) => {
						e.stopPropagation(); // Prevent calendar event selection
						navigate(`/events/${eventId}/details`);
					}}
				>
					<ExternalLink className="h-3 w-3" />
				</Button>
			</div>
			<div className="p-1">
				<strong>{event.title}</strong>
				{event.location && (
					<div className="text-xs flex items-center mt-1 text-gray-600">
						<MapPin className="h-3 w-3 mr-1" />
						{event.location}
					</div>
				)}
			</div>
		</div>
	);
}

export default function EventsLayout() {
	const { events, upcomingEvents, previousEvents, permissions } =
		useLoaderData<typeof loader>();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [selectedEvent, setSelectedEvent] = useState<
		(typeof events)[number] | null
	>(null);
	const organization = useParams().organization;
	const submit = useSubmit();

	const view = searchParams.get("view") || "calendar";

	const handleSelectEvent = (event: (typeof events)[number]) => {
		setSelectedEvent(event);
	};

	const handleCreateEvent = () => {
		setIsCreateDialogOpen(true);
	};

	return (
		<div className="container mx-auto py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold">Events</h1>
				{permissions.canAdd && (
					<Button onClick={handleCreateEvent}>Create Event</Button>
				)}
			</div>

			<Tabs
				defaultValue={view}
				className="w-full"
				onValueChange={(value) => {
					setSearchParams({ view: value });
				}}
			>
				<TabsList className="grid w-full grid-cols-3 mb-4">
					<TabsTrigger value="calendar">Calendar</TabsTrigger>
					<TabsTrigger value="upcoming">Upcoming</TabsTrigger>
					<TabsTrigger value="previous">Previous</TabsTrigger>
				</TabsList>

				<TabsContent value="calendar">
					<Calendar
						events={events}
						onSelectEvent={handleSelectEvent}
						permissions={permissions}
					/>
				</TabsContent>

				<TabsContent value="upcoming" className="space-y-4 mt-4">
					{upcomingEvents.length === 0 ? (
						<p className="text-center text-gray-500">No upcoming events</p>
					) : (
						upcomingEvents.map(({ event, participants }) => (
							<EventCard
								key={event.id}
								event={event}
								participants={participants}
								onEdit={() => handleSelectEvent(event)}
								organizationId={organization}
								permissions={permissions}
							/>
						))
					)}
				</TabsContent>

				<TabsContent value="previous" className="space-y-4 mt-4">
					{previousEvents.length === 0 ? (
						<p className="text-center text-gray-500">No previous events</p>
					) : (
						previousEvents.map(({ event, participants }) => (
							<EventCard
								key={event.id}
								event={event}
								participants={participants}
								onEdit={() => handleSelectEvent(event)}
								organizationId={organization}
								permissions={permissions}
							/>
						))
					)}
				</TabsContent>
			</Tabs>

			<EventDialog
				event={selectedEvent}
				open={!!selectedEvent}
				onOpenChange={(open) => !open && setSelectedEvent(null)}
				organizationId={organization}
				permissions={permissions}
			/>
			<EventDialog
				open={isCreateDialogOpen}
				onOpenChange={setIsCreateDialogOpen}
				organizationId={organization}
				permissions={permissions}
			/>
		</div>
	);
}
