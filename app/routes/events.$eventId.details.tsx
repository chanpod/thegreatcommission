import { useLoaderData, useSubmit } from "react-router";
import { db } from "~/server/dbConnection";
import { events, eventPhotos } from "server/db/schema";
import { eq } from "drizzle-orm";
import type { Route } from "../+types/root";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import {
	Calendar,
	Clock,
	MapPin,
	Users,
	DollarSign,
	ArrowLeft,
	Edit,
	Camera,
} from "lucide-react";
import { format, isSameDay, isPast } from "date-fns";
import { Button } from "~/components/ui/button";
import { Link } from "react-router";
import { usePermissions } from "~/lib/hooks/usePermissions";
import { EventPhotoCarousel } from "~/components/events/EventPhotoCarousel";
import { EventPhotoUploader } from "~/components/events/EventPhotoUploader";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from "~/components/ui/carousel";

export const loader = async ({ params }: Route.LoaderArgs) => {
	const event = await db
		.select()
		.from(events)
		.where(eq(events.id, params.eventId))
		.then((rows) => rows[0]);

	if (!event) {
		throw new Error("Event not found");
	}

	// Load event photos
	const photos = await db
		.select()
		.from(eventPhotos)
		.where(eq(eventPhotos.eventId, params.eventId));

	return { event, photos };
};

export const action = async ({ request, params }: Route.ActionArgs) => {
	try {
		const formData = await request.formData();
		const action = formData.get("action");

		switch (action) {
			case "savePhotos": {
				const photosData = JSON.parse(formData.get("photos") as string);

				// Delete existing photos first
				await db
					.delete(eventPhotos)
					.where(eq(eventPhotos.eventId, params.eventId));

				// Insert new photos
				if (photosData.length > 0) {
					const photosToInsert = photosData.map((photo: any) => ({
						eventId: params.eventId,
						photoUrl: photo.photoUrl,
						caption: photo.caption || null,
						createdAt: new Date(),
						updatedAt: new Date(),
					}));

					await db.insert(eventPhotos).values(photosToInsert);
				}

				return { success: true };
			}
			default:
				return { success: false, error: "Invalid action" };
		}
	} catch (error) {
		console.error("Error in event photos action:", error);
		return {
			success: false,
			error:
				error instanceof Error ? error.message : "An unknown error occurred",
		};
	}
};

export default function EventDetails() {
	const { event, photos } = useLoaderData<typeof loader>();
	const { hasPermission } = usePermissions();
	const canEditEvents = hasPermission(
		"events.edit",
		event.churchOrganizationId,
	);
	const startDate = new Date(event.startDate);
	const endDate = new Date(event.endDate);
	const isEventPast = isPast(endDate);

	const [showPhotoUploader, setShowPhotoUploader] = useState(false);
	const [eventPhotos, setEventPhotos] = useState(photos);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const submit = useSubmit();

	const typeColors = {
		local: "bg-blue-100 text-blue-800",
		recurring: "bg-green-100 text-green-800",
		mission: "bg-purple-100 text-purple-800",
	};

	const handleSavePhotos = async (updatedPhotos: any[]) => {
		setIsSubmitting(true);

		const formData = new FormData();
		formData.append("action", "savePhotos");
		formData.append("photos", JSON.stringify(updatedPhotos));

		submit(formData, { method: "post" });
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* Hero Section with Image */}
			<div className="relative w-full bg-gray-900">
				{event.heroImageUrl ? (
					<div className="w-full h-[40vh] relative">
						<div className="absolute inset-0 bg-black/30 z-10" />
						<img
							src={event.heroImageUrl}
							alt={event.title}
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 z-20 flex flex-col justify-end p-8 text-white">
							<div className="flex justify-between items-start">
								<div>
									<h1 className="text-4xl font-bold mb-2">{event.title}</h1>
									<span
										className={`inline-block px-3 py-1 rounded-full text-sm font-medium w-fit ${
											typeColors[event.type as keyof typeof typeColors]
										}`}
									>
										{event.type.charAt(0).toUpperCase() + event.type.slice(1)}{" "}
										Event
									</span>
								</div>
								{canEditEvents && (
									<div className="flex gap-2">
										{isEventPast && (
											<Button
												variant="secondary"
												size="sm"
												className="gap-2"
												onClick={() => setShowPhotoUploader(!showPhotoUploader)}
											>
												<Camera className="h-4 w-4" />
												{showPhotoUploader
													? "Hide Photo Manager"
													: "Manage Photos"}
											</Button>
										)}
										<Button
											variant="secondary"
											size="sm"
											asChild
											className="gap-2"
										>
											<Link
												to={`/churches/${event.churchOrganizationId}/events/${event.id}/edit`}
											>
												<Edit className="h-4 w-4" />
												Edit Event
											</Link>
										</Button>
									</div>
								)}
							</div>
						</div>
					</div>
				) : (
					<div className="w-full py-16 px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
						<div className="flex justify-between items-start">
							<div>
								<h1 className="text-4xl font-bold text-white mb-2">
									{event.title}
								</h1>
								<span
									className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
										typeColors[event.type as keyof typeof typeColors]
									}`}
								>
									{event.type.charAt(0).toUpperCase() + event.type.slice(1)}{" "}
									Event
								</span>
							</div>
							{canEditEvents && (
								<div className="flex gap-2">
									{isEventPast && (
										<Button
											variant="secondary"
											size="sm"
											className="gap-2"
											onClick={() => setShowPhotoUploader(!showPhotoUploader)}
										>
											<Camera className="h-4 w-4" />
											{showPhotoUploader
												? "Hide Photo Manager"
												: "Manage Photos"}
										</Button>
									)}
									<Button
										variant="secondary"
										size="sm"
										asChild
										className="gap-2"
									>
										<Link
											to={`/churches/${event.churchOrganizationId}/events/${event.id}/edit`}
										>
											<Edit className="h-4 w-4" />
											Edit Event
										</Link>
									</Button>
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Navigation Bar */}
			<div className="container mx-auto px-4 -mt-4 relative z-30 flex justify-between items-center">
				<Button
					variant="outline"
					size="sm"
					asChild
					className="bg-white shadow-sm"
				>
					<Link
						className="text-black"
						to={`/churches/${event.churchOrganizationId}/events`}
					>
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Events
					</Link>
				</Button>
			</div>

			{/* Main Content */}
			<div className="container mx-auto p-4 max-w-4xl">
				{/* Photo Uploader for Past Events */}
				{showPhotoUploader && isEventPast && canEditEvents && (
					<Card className="mb-6">
						<CardHeader>
							<CardTitle className="text-lg">Event Photos</CardTitle>
						</CardHeader>
						<CardContent>
							<EventPhotoUploader
								eventId={event.id}
								existingPhotos={eventPhotos}
								onPhotosChange={setEventPhotos}
								onSavePhotos={handleSavePhotos}
								isSubmitting={isSubmitting}
							/>
						</CardContent>
					</Card>
				)}

				{/* Event Photos Carousel (only show if there are photos) */}
				{!showPhotoUploader && eventPhotos.length > 0 && (
					<Card className="mb-6 p-3">
						<CardHeader>
							<CardTitle className="text-lg">Event Photos</CardTitle>
						</CardHeader>
						<CardContent className="m-5">
							<Carousel>
								<CarouselContent>
									{eventPhotos.map((photo) => (
										<CarouselItem key={photo.id}>
											<img
												src={photo.photoUrl}
												alt={photo.caption || "Event Photo"}
											/>
										</CarouselItem>
									))}
								</CarouselContent>
								<CarouselPrevious />
								<CarouselNext />
							</Carousel>
						</CardContent>
					</Card>
				)}

				<div className="grid gap-6 md:grid-cols-3">
					{/* Event Details Sidebar */}
					<div className="md:col-span-1 space-y-4">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">Event Details</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="space-y-2">
									<div className="flex items-center text-gray-500">
										<Calendar className="w-5 h-5 mr-2" />
										<span>
											{format(startDate, "MMMM d, yyyy")}
											{!isSameDay(startDate, endDate) &&
												` - ${format(endDate, "MMMM d, yyyy")}`}
										</span>
									</div>
									<div className="flex items-center text-gray-500">
										<Clock className="w-5 h-5 mr-2" />
										<span>
											{format(startDate, "h:mm a")} -{" "}
											{format(endDate, "h:mm a")}
										</span>
									</div>
									{event.location && (
										<div className="flex items-center text-gray-500">
											<MapPin className="w-5 h-5 mr-2" />
											<span>{event.location}</span>
										</div>
									)}
								</div>

								{event.type === "mission" && (
									<div className="space-y-2 pt-4 border-t">
										{event.volunteersNeeded && (
											<div className="flex items-center text-gray-500">
												<Users className="w-5 h-5 mr-2" />
												<span>
													{event.volunteersNeeded} Volunteer
													{event.volunteersNeeded !== 1 ? "s" : ""} Needed
												</span>
											</div>
										)}
										{event.investment && (
											<div className="flex items-center text-gray-500">
												<DollarSign className="w-5 h-5 mr-2" />
												<span>
													Investment Goal: ${event.investment.toLocaleString()}
												</span>
											</div>
										)}
										{event.fundingRaised && (
											<div className="flex items-center text-gray-500">
												<DollarSign className="w-5 h-5 mr-2" />
												<span>
													Raised: ${event.fundingRaised.toLocaleString()}
												</span>
											</div>
										)}
									</div>
								)}
							</CardContent>
						</Card>
					</div>

					{/* Event Description */}
					<div className="md:col-span-2">
						<Card>
							<CardHeader>
								<CardTitle className="text-lg">About This Event</CardTitle>
							</CardHeader>
							<CardContent>
								{event.description ? (
									<div className="prose max-w-none">
										<div
											dangerouslySetInnerHTML={{
												__html: event.description,
											}}
										/>
									</div>
								) : (
									<p className="text-gray-500 italic">
										No description provided.
									</p>
								)}
							</CardContent>
						</Card>
					</div>
				</div>
			</div>
		</div>
	);
}
