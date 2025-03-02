import { isNull, map } from "lodash-es";
import { useLoaderData } from "react-router";
import { useEffect, useState } from "react";
import {
	MapPin,
	Navigation,
	CheckCircle,
	Calendar,
	Bell,
	Layout,
	Users,
	ChevronDown,
} from "lucide-react";

import WorldMap from "~/src/components/maps/WorldMap";
import type { Route } from "./+types";
import { db } from "@/server/db/dbConnection";
import { missions } from "server/db/schema";
import { ne } from "drizzle-orm";
import { ClientOnly } from "remix-utils/client-only";

export const loader = async ({ request, params }: Route.LoaderArgs) => {
	const missionMarkers = await db
		.select()
		.from(missions)
		.where(ne(missions.lat, null));

	return { missionMarkers, googleMapsApiKey: process.env.GOOGLE_MAPS_KEY };
};

export default function Index() {
	const loaderData = useLoaderData<typeof loader>();
	const [userLocation, setUserLocation] =
		useState<google.maps.LatLngLiteral | null>(null);
	const [mapZoom, setMapZoom] = useState(3); // Default zoom level
	const [locationError, setLocationError] = useState<string | null>(null);
	const [isLocating, setIsLocating] = useState(false);
	const [showMap, setShowMap] = useState(false);

	useEffect(() => {
		// Request user's location when component mounts
		getUserLocation();
	}, []);

	const getUserLocation = () => {
		if (!("geolocation" in navigator)) {
			setLocationError("Geolocation is not supported by your browser");
			return;
		}

		setIsLocating(true);
		setLocationError(null);

		navigator.geolocation.getCurrentPosition(
			// Success callback
			(position) => {
				const { latitude, longitude } = position.coords;
				setUserLocation({
					lat: latitude,
					lng: longitude,
				});
				// Set zoom level appropriate for town/city view (typically 11-13)
				setMapZoom(12);
				setIsLocating(false);
			},
			// Error callback
			(error) => {
				setIsLocating(false);
				switch (error.code) {
					case error.PERMISSION_DENIED:
						setLocationError("Location access was denied");
						break;
					case error.POSITION_UNAVAILABLE:
						setLocationError("Location information is unavailable");
						break;
					case error.TIMEOUT:
						setLocationError("Location request timed out");
						break;
					default:
						setLocationError("An unknown error occurred");
				}
			},
			// Options
			{
				enableHighAccuracy: false, // No need for high accuracy for this use case
				timeout: 5000,
				maximumAge: 0,
			},
		);
	};

	// Convert mission markers to the format expected by WorldMap
	const missionPins = map(
		loaderData.missionMarkers,
		(missionMarker: Partial<typeof missions>) => ({
			lat: missionMarker.lat,
			lng: missionMarker.lng,
		}),
	);

	return (
		<div className="min-h-screen flex flex-col">
			{/* Hero Section */}
			<section className="bg-gradient-to-r from-blue-900 to-indigo-700 text-white py-20">
				<div className="container mx-auto px-4">
					<div className="flex flex-col md:flex-row items-center">
						<div className="md:w-1/2 mb-10 md:mb-0">
							<h1 className="text-4xl md:text-5xl font-bold mb-4">
								Empowering Churches for the Great Commission
							</h1>
							<p className="text-xl mb-8">
								A free church management platform designed to help you focus on
								what matters most - making disciples.
							</p>
							<div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
								<a
									href="/getting-started"
									className="bg-white text-blue-800 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors inline-flex items-center justify-center"
								>
									Get Started Free
								</a>
								{/* <button
									type="button"
									className="bg-transparent border-2 border-white hover:bg-white/10 font-semibold py-3 px-6 rounded-lg transition-colors"
								>
									Learn More
								</button> */}
							</div>
						</div>
						<div className="md:w-1/2 flex justify-center">
							<div className="relative w-full max-w-md">
								<div className="absolute -top-4 -left-4 w-full h-full bg-blue-500 rounded-lg" />
								<div className="relative bg-white p-6 rounded-lg shadow-lg">
									<blockquote className="text-gray-800 italic text-lg">
										"Therefore go and make disciples of all nations, baptizing
										them in the name of the Father and of the Son and of the
										Holy Spirit, and teaching them to obey everything I have
										commanded you."
										<footer className="text-gray-600 mt-2 font-semibold">
											- Matthew 28:19-20
										</footer>
									</blockquote>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section className="py-16 bg-gray-50">
				<div className="container mx-auto px-4">
					<div className="text-center mb-12">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Powerful Features for Every Church
						</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							Everything you need to manage your church effectively, available
							to all.
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
						{/* Feature 1 */}
						<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
							<div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
								<CheckCircle className="text-blue-600 h-7 w-7" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Paperless Child Check-in
							</h3>
							<p className="text-gray-600">
								Streamline your children's ministry with secure, contactless
								check-in that parents and volunteers will love.
							</p>
						</div>

						{/* Feature 2 */}
						<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
							<div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
								<Calendar className="text-blue-600 h-7 w-7" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Event Management
							</h3>
							<p className="text-gray-600">
								Create, promote, and manage church events with ease. Handle
								registrations and follow-ups all in one place.
							</p>
						</div>

						{/* Feature 3 */}
						<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
							<div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
								<Bell className="text-blue-600 h-7 w-7" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Notification System
							</h3>
							<p className="text-gray-600">
								Keep your congregation informed with automated SMS, email, and
								phone notifications for events and announcements.
							</p>
						</div>

						{/* Feature 4 */}
						<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
							<div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
								<Layout className="text-blue-600 h-7 w-7" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Customizable Website
							</h3>
							<p className="text-gray-600">
								Create a beautiful, mobile-friendly church website that's easy
								to update and customize to match your branding.
							</p>
						</div>

						{/* Feature 5 */}
						<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
							<div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
								<Users className="text-blue-600 h-7 w-7" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Church Management
							</h3>
							<p className="text-gray-600">
								Manage members, groups, and ministries with powerful tools
								designed specifically for churches of all sizes.
							</p>
						</div>

						{/* Feature 6 */}
						<div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
							<div className="bg-blue-100 p-3 rounded-full w-14 h-14 flex items-center justify-center mb-4">
								<MapPin className="text-blue-600 h-7 w-7" />
							</div>
							<h3 className="text-xl font-semibold text-gray-900 mb-2">
								Multi-Campus Support
							</h3>
							<p className="text-gray-600">
								Easily manage multiple locations or satellite churches with
								tools designed for multi-site ministries.
							</p>
						</div>
					</div>
				</div>
			</section>

			{/* Map Section */}
			<section className="py-16 bg-white">
				<div className="container mx-auto px-4">
					<div className="text-center mb-8">
						<h2 className="text-3xl font-bold text-gray-900 mb-4">
							Missions Around the World
						</h2>
						<p className="text-xl text-gray-600 max-w-3xl mx-auto">
							See how churches are fulfilling the Great Commission globally.
						</p>
					</div>

					<div className="relative">
						{!showMap ? (
							<button
								type="button"
								className="flex flex-col items-center justify-center p-10 bg-gray-100 rounded-lg w-full cursor-pointer"
								onClick={() => setShowMap(true)}
								aria-label="View missions map"
							>
								<MapPin className="h-16 w-16 text-blue-600 mb-4" />
								<h3 className="text-xl font-semibold text-gray-900 mb-2">
									Explore Our Global Missions
								</h3>
								<p className="text-gray-600 mb-4 text-center max-w-lg">
									Click to view an interactive map of mission locations around
									the world.
								</p>
								<div className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg transition-colors">
									<span>View Map</span>
									<ChevronDown className="h-5 w-5" />
								</div>
							</button>
						) : (
							<div
								className="relative rounded-lg overflow-hidden shadow-lg"
								style={{ height: "600px" }}
							>
								{/* Location Button */}
								{!userLocation && !isLocating && !locationError && (
									<div className="absolute top-4 right-4 z-10">
										<button
											type="button"
											onClick={getUserLocation}
											className="flex items-center space-x-2 bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-md shadow-md transition-colors"
										>
											<Navigation className="h-5 w-5" />
											<span>Find Missions Near Me</span>
										</button>
									</div>
								)}

								{/* Map Legend */}
								<div className="absolute bottom-4 right-4 z-10 bg-white p-3 rounded-md shadow-md">
									<h3 className="font-semibold mb-2 text-gray-900">
										Map Legend
									</h3>
									<div className="flex items-center">
										<div className="w-6 h-6 mr-2 flex items-center justify-center">
											<MapPin className="text-red-500" />
										</div>
										<span className="text-gray-900">Mission Locations</span>
									</div>
								</div>

								{isLocating && (
									<div className="absolute top-20 right-4 z-10 bg-white p-2 rounded-md shadow-md">
										<p>Finding your location...</p>
									</div>
								)}

								{locationError && (
									<div className="absolute top-20 right-4 z-10 bg-white p-2 rounded-md shadow-md">
										<p className="text-red-500">{locationError}</p>
										<button
											type="button"
											onClick={getUserLocation}
											className="mt-2 px-3 py-1 bg-blue-700 text-white rounded-md hover:bg-blue-800"
										>
											Try Again
										</button>
									</div>
								)}

								<ClientOnly>
									{() => (
										<WorldMap
											googleMapsApiKey={loaderData.googleMapsApiKey}
											pins={missionPins}
											initialCenter={userLocation || undefined}
											initialZoom={mapZoom}
										/>
									)}
								</ClientOnly>
							</div>
						)}
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-16 bg-gradient-to-r from-blue-900 to-indigo-700 text-white">
				<div className="container mx-auto px-4 text-center">
					<h2 className="text-3xl font-bold mb-4">
						Join the Great Commission Community
					</h2>
					<p className="text-xl mb-8 max-w-3xl mx-auto">
						Join thousands of churches using our free platform to grow their
						ministry and reach more people.
					</p>
					<div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
						<a
							href="/getting-started"
							className="bg-white text-blue-800 hover:bg-gray-100 font-semibold py-3 px-8 rounded-lg transition-colors inline-flex items-center justify-center"
						>
							Get Started Now
						</a>
						{/* <button
							type="button"
							className="bg-transparent border-2 border-white hover:bg-white/10 font-semibold py-3 px-8 rounded-lg transition-colors"
						>
							Learn More
						</button> */}
					</div>
				</div>
			</section>
		</div>
	);
}
