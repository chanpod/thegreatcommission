import type { DateSelectArg } from "@fullcalendar/core";
import { format, isSameDay, parseISO, addHours } from "date-fns";
import { enUS } from "date-fns/locale";
import { eq } from "drizzle-orm";
import {
	Calendar,
	CalendarDays,
	Clock,
	Edit,
	ExternalLink,
	LayoutGrid,
	MapPin,
	Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
	Link,
	Outlet,
	useLoaderData,
	useNavigate,
	useParams,
	useSearchParams,
	useSubmit,
	useActionData,
} from "react-router";
import { events } from "server/db/schema";
import { EventDialog } from "~/components/events/EventDialog";
import EventCalendar from "~/components/events/EventCalendar";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn, stripHtml } from "~/lib/utils";
import { db } from "~/server/dbConnection";

import {
	type PermissionSet,
	PermissionsService,
} from "@/server/services/PermissionsService";
import { createAuthLoader } from "~/server/auth/authLoader";
import { toast } from "sonner";

const locales = {
	"en-US": enUS,
};

type DbEvent = typeof events.$inferSelect;

export interface CalendarEvent {
	id: string;
	title: string;
	start: string; // ISO string
	end: string; // ISO string
	allDay?: boolean;
	description?: string;
	type?: "local" | "recurring" | "mission";
	location?: string;
}

export const loader = createAuthLoader(
	async ({ request, params, userContext }) => {
		const user = userContext.user;
		const organizationId = params.organization;
		if (!organizationId) {
			throw new Error("Organization ID is required");
		}

		const orgEvents = await db
			.select()
			.from(events)
			.where(eq(events.churchOrganizationId, organizationId));

		const permissionsService = new PermissionsService();
		const permissions = await permissionsService.getEventPermissions(
			user.id,
			organizationId,
		);

		// Transform the database events into calendar events
		const calendarEvents: CalendarEvent[] = orgEvents.map((event) => ({
			id: event.id,
			title: event.title,
			start: event.startDate.toISOString(),
			end: event.endDate.toISOString(),
			allDay: event.allDay,
			description: event.description || undefined,
			type: event.type as "local" | "recurring" | "mission",
			location: event.location || undefined,
		}));

		// Pre-sort events into upcoming and previous
		const now = new Date();
		const upcomingEvents = calendarEvents.filter(
			(event) => new Date(event.start) >= now,
		);
		const previousEvents = calendarEvents.filter(
			(event) => new Date(event.start) < now,
		);

		return {
			events: calendarEvents,
			upcomingEvents,
			previousEvents,
			permissions,
		};
	},
	true,
);

export const action = createAuthLoader(
	async ({ request, params, userContext }) => {
		try {
			const formData = await request.formData();
			const action = formData.get("action");
			const user = userContext.user;

			if (!user) {
				return { success: false, error: "User is not authenticated" };
			}

			const permissionsService = new PermissionsService();
			const permissions = await permissionsService.getEventPermissions(
				user.id,
				params.organization,
			);

			if (action === "create") {
				if (!permissions.canAdd) {
					return {
						success: false,
						error: "You are not authorized to create events",
					};
				}

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
					churchOrganizationId: params.organization || "",
					createdAt: new Date(),
					updatedAt: new Date(),
				};

				const newEvent = await db.insert(events).values(eventData).returning();
				return { success: true, event: newEvent[0] };
			}

			if (action === "update") {
				if (!permissions.canEdit) {
					return {
						success: false,
						error: "You are not authorized to edit events",
					};
				}

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
				if (!permissions.canDelete) {
					return {
						success: false,
						error: "You are not authorized to delete events",
					};
				}

				const eventId = formData.get("eventId") as string;
				await db.delete(events).where(eq(events.id, eventId));
				return { success: true };
			}

			return { success: false, error: "Invalid action" };
		} catch (error) {
			console.error("Error in event action:", error);
			return {
				success: false,
				error:
					error instanceof Error ? error.message : "An unknown error occurred",
			};
		}
	},
	true,
);

function EventCard({
	event,
	onEdit,
	permissions,
}: { event: CalendarEvent; onEdit: () => void; permissions: PermissionSet }) {
	const params = useParams();
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
						<CardDescription>{stripHtml(event.description)}</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<span className={typeColors[event.type as keyof typeof typeColors]}>
							{event.type}
						</span>
						{permissions.canEdit && (
							<Button
								variant="ghost"
								size="icon"
								onClick={onEdit}
								className="h-8 w-8"
							>
								<Edit className="h-4 w-4" />
								<span className="sr-only">Edit event</span>
							</Button>
						)}
						<Button variant="ghost" size="icon" className="h-8 w-8" asChild>
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
						{format(new Date(event.start), "MMM d, yyyy")}
						{!isSameDay(new Date(event.start), new Date(event.end)) &&
							` - ${format(new Date(event.end), "MMM d, yyyy")}`}
					</span>
				</div>
				<div className="flex items-center text-sm text-gray-500">
					<Clock className="w-4 h-4 mr-2" />
					<span>
						{format(new Date(event.start), "h:mm a")} -{" "}
						{format(new Date(event.end), "h:mm a")}
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

export default function EventsLayout() {
	const { events, upcomingEvents, previousEvents, permissions } =
		useLoaderData<typeof loader>();
	const actionData = useActionData<typeof action>();
	const [searchParams, setSearchParams] = useSearchParams();
	const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [listTab, setListTab] = useState("upcoming");
	const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(
		null,
	);
	const organization = useParams().organization;
	const navigate = useNavigate();
	const submit = useSubmit();

	// Get view from search params, default to calendar
	const view = searchParams.get("view") || "calendar";
	const calendarView = searchParams.get("calendarView") || "month";
	const initialDate = searchParams.get("date")
		? new Date(searchParams.get("date")!)
		: new Date();

	// Update search params when view changes
	const handleViewChange = (newView: string) => {
		searchParams.set("view", newView);
		setSearchParams(searchParams, { preventScrollReset: true });
	};

	// Handle calendar view change (month/week)
	const handleCalendarViewChange = (newCalendarView: "month" | "week") => {
		searchParams.set("calendarView", newCalendarView);
		setSearchParams(searchParams, { preventScrollReset: true });
	};

	// Handle calendar date selection
	const handleDateClick = (date: Date) => {
		searchParams.set("date", date.toISOString());
		setSearchParams(searchParams, { preventScrollReset: true });
	};

	// Handle event click
	const handleEventClick = (event: CalendarEvent) => {
		setSelectedEvent(event);
		if (permissions.canEdit) {
			navigate(
				`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
			);
		} else {
			navigate(`/events/${event.id}/details?${searchParams.toString()}`);
		}
	};

	// Add new handlers for edit and view events
	const handleEditEvent = (event: CalendarEvent) => {
		navigate(
			`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
		);
	};

	const handleViewEvent = (event: CalendarEvent) => {
		navigate(`/events/${event.id}/details?${searchParams.toString()}`);
	};

	// Handle add event click
	const handleAddEvent = (date: Date) => {
		// Store the selected date to use when creating a new event
		searchParams.set("newEventDate", date.toISOString());
		setSearchParams(searchParams, { preventScrollReset: true });
		setIsCreateDialogOpen(true);
	};

	// Handle create action from URL
	useEffect(() => {
		if (searchParams.get("action") === "create") {
			setIsCreateDialogOpen(true);
			// Remove the action param after opening dialog
			searchParams.delete("action");
			setSearchParams(searchParams, { preventScrollReset: true });
		}
	}, [searchParams, setSearchParams]);

	const handleDateSelect = (selectInfo: DateSelectArg) => {
		setIsCreateDialogOpen(true);
	};

	// Handle successful event creation
	useEffect(() => {
		if (actionData) {
			setIsSubmitting(false);

			if (actionData.success) {
				setIsCreateDialogOpen(false);

				// Clean up the newEventDate parameter
				if (searchParams.has("newEventDate")) {
					searchParams.delete("newEventDate");
					setSearchParams(searchParams, { preventScrollReset: true });
				}

				// Show success message
				toast.success("Event created successfully");
			} else if (actionData.error) {
				// Show error message
				toast.error(`Failed to create event: ${actionData.error}`);
			}
		}
	}, [actionData, searchParams, setSearchParams]);

	const handleCreateEvent = (event: DbEvent) => {
		setIsSubmitting(true);
		const formData = new FormData();
		formData.append("action", "create");
		formData.append("title", event.title);
		formData.append("description", event.description || "");
		formData.append("startDate", event.startDate.toISOString());
		formData.append("endDate", event.endDate.toISOString());
		formData.append("allDay", String(event.allDay));
		formData.append("type", event.type);
		formData.append("location", event.location || "");
		formData.append("churchOrganizationId", organization || "");

		// Add other fields if they exist
		if (event.heroImageUrl) formData.append("heroImageUrl", event.heroImageUrl);
		if (event.volunteersNeeded)
			formData.append("volunteersNeeded", String(event.volunteersNeeded));
		if (event.investment)
			formData.append("investment", String(event.investment));
		if (event.fundingRaised)
			formData.append("fundingRaised", String(event.fundingRaised));

		submit(formData, { method: "post" });
		// Dialog will be closed in the useEffect after successful submission
	};

	return (
		<div className="container mx-auto p-4 space-y-4">
			{/* Add hidden SVG definitions for the popup menu icons */}
			<svg className="hidden" aria-hidden="true" role="presentation">
				<title>UI Icons</title>
				<symbol
					id="edit-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
					<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
				</symbol>
				<symbol
					id="external-link-icon"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					strokeWidth="2"
					strokeLinecap="round"
					strokeLinejoin="round"
				>
					<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
					<polyline points="15 3 21 3 21 9" />
					<line x1="10" y1="14" x2="21" y2="3" />
				</symbol>
			</svg>
			<div className="flex justify-between items-center">
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold">Events</h1>
					<div className="flex bg-gray-200 rounded-lg p-1">
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"rounded-lg",
								view === "calendar"
									? "bg-white shadow-sm text-primary-600 font-medium"
									: "text-gray-700 hover:text-gray-300",
							)}
							onClick={() => handleViewChange("calendar")}
						>
							<CalendarDays className="h-4 w-4" />
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className={cn(
								"rounded-lg",
								view === "list"
									? "bg-white shadow-sm text-primary-600 font-medium"
									: "text-gray-700 hover:text-gray-300",
							)}
							onClick={() => handleViewChange("list")}
						>
							<LayoutGrid className="h-4 w-4" />
						</Button>
					</div>
				</div>
				{permissions.canAdd && (
					<Button onClick={() => setIsCreateDialogOpen(true)}>
						<Plus className="w-4 h-4 mr-2" />
						Create Event
					</Button>
				)}
			</div>

			{/* Wrap calendar in a key-based container to force remount */}
			<div key={view}>
				{view === "calendar" ? (
					<div className="flex-1 min-h-[600px] bg-white shadow-lg rounded-lg overflow-hidden">
						<EventCalendar
							events={events}
							onDateClick={handleDateClick}
							onEventClick={handleEventClick}
							onEditEvent={handleEditEvent}
							onViewEvent={handleViewEvent}
							onAddEvent={handleAddEvent}
							permissions={permissions}
							initialDate={initialDate}
							initialView={calendarView as "month" | "week"}
							calendarView={calendarView as "month" | "week"}
							onCalendarViewChange={handleCalendarViewChange}
							themeColors={{
								primary: "#3b82f6", // blue
								secondary: "#1e293b", // slate-900
								accent: "#8b5cf6", // purple
							}}
						/>
					</div>
				) : (
					<div className="space-y-6">
						<Tabs
							value={searchParams.get("listTab") || "upcoming"}
							onValueChange={(value) => {
								searchParams.set("listTab", value);
								setSearchParams(searchParams, { preventScrollReset: true });
								setListTab(value);
							}}
						>
							<TabsList>
								<TabsTrigger value="upcoming">Upcoming Events</TabsTrigger>
								<TabsTrigger value="previous">Previous Events</TabsTrigger>
							</TabsList>

							<TabsContent value="upcoming" className="space-y-4 mt-4">
								{upcomingEvents.length === 0 ? (
									<p className="text-center text-gray-500">
										No upcoming events
									</p>
								) : (
									upcomingEvents.map((event) => (
										<EventCard
											key={event.id}
											event={event}
											permissions={permissions}
											onEdit={() =>
												navigate(
													`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
												)
											}
										/>
									))
								)}
							</TabsContent>

							<TabsContent value="previous" className="space-y-4 mt-4">
								{previousEvents.length === 0 ? (
									<p className="text-center text-gray-500">
										No previous events
									</p>
								) : (
									previousEvents.map((event) => (
										<EventCard
											key={event.id}
											event={event}
											permissions={permissions}
											onEdit={() =>
												navigate(
													`/churches/${organization}/events/${event.id}/edit?${searchParams.toString()}`,
												)
											}
										/>
									))
								)}
							</TabsContent>
						</Tabs>
					</div>
				)}
			</div>
			<EventDialog
				open={isCreateDialogOpen}
				onOpenChange={(open) => {
					if (!isSubmitting) {
						setIsCreateDialogOpen(open);
						// Clean up the newEventDate parameter when dialog is closed
						if (!open && searchParams.has("newEventDate")) {
							searchParams.delete("newEventDate");
							setSearchParams(searchParams, { preventScrollReset: true });
						}
					}
				}}
				onSubmit={handleCreateEvent}
				mode="create"
				isSubmitting={isSubmitting}
				event={
					searchParams.get("newEventDate")
						? {
								id: "", // Add empty ID for type compatibility
								title: "",
								description: "",
								type: "local",
								location: "",
								allDay: false,
								startDate: new Date(searchParams.get("newEventDate")!),
								endDate: addHours(
									new Date(searchParams.get("newEventDate")!),
									1,
								),
								churchOrganizationId: organization || "",
								createdAt: new Date(),
								updatedAt: new Date(),
								// Add missing required fields with default values
								heroImageUrl: null,
								recurrence: null,
								lat: null,
								lng: null,
								volunteersNeeded: null,
								investment: null,
								fundingRaised: null,
								parentEventId: null,
							}
						: undefined
				}
			/>
			<Outlet />
		</div>
	);
}
