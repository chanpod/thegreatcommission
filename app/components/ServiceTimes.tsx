import { format } from "date-fns";
import { Clock, MapPin, Radio } from "lucide-react";
import type { events } from "server/db/schema";
import { formatDescription, cn } from "~/lib/utils";

interface ServiceTimesProps {
	services: Array<typeof events.$inferSelect>;
	liveStreamUrl?: string | null;
	isLive?: boolean;
}

export default function ServiceTimes({
	services,
	liveStreamUrl,
	isLive = false,
}: ServiceTimesProps) {
	return (
		<section id="services" className="py-12 bg-white relative overflow-hidden">
			{/* SVG Decorations */}
			<div className="absolute top-0 right-0 w-64 h-64 opacity-10">
				<svg
					viewBox="0 0 200 200"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full text-primary"
					aria-hidden="true"
				>
					<title>Decorative blob shape</title>
					<path
						fill="currentColor"
						d="M45.3,-51.2C58.3,-40.9,68.8,-25.9,71.8,-9.2C74.9,7.5,70.5,25.9,60.1,39.3C49.7,52.7,33.3,61.1,15.8,65.2C-1.7,69.3,-20.3,69.1,-35.9,61.5C-51.5,53.9,-64.1,38.9,-70.2,21.2C-76.3,3.5,-75.9,-16.9,-67.1,-32.6C-58.3,-48.3,-41.1,-59.3,-24.4,-67.1C-7.7,-74.9,8.5,-79.5,23.2,-74.5C37.9,-69.5,51.1,-55,64.3,-40.4Z"
						transform="translate(100 100)"
					/>
				</svg>
			</div>
			<div className="absolute bottom-0 left-0 w-48 h-48 opacity-10">
				<svg
					viewBox="0 0 200 200"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full text-accent"
					aria-hidden="true"
				>
					<title>Decorative wave shape</title>
					<path
						fill="currentColor"
						d="M39.9,-46.1C52.9,-34.9,65.2,-23.4,68.1,-9.8C71,3.9,64.5,19.7,54.8,32.6C45.1,45.5,32.2,55.5,17.4,60.2C2.6,64.9,-14.1,64.3,-28.8,58C-43.5,51.7,-56.2,39.7,-62.9,24.7C-69.6,9.7,-70.3,-8.3,-63.7,-22.9C-57.1,-37.5,-43.2,-48.7,-29.1,-59.5C-15,-70.3,-0.7,-80.7,11.2,-77.9C23.1,-75.1,46.1,-59.1,58.9,-43.1Z"
						transform="translate(100 100)"
					/>
				</svg>
			</div>
			<div className="absolute top-1/2 left-1/4 w-32 h-32 opacity-10 animate-spin-slow">
				<svg
					viewBox="0 0 200 200"
					xmlns="http://www.w3.org/2000/svg"
					className="w-full h-full text-secondary"
					aria-hidden="true"
				>
					<title>Spinning decorative shape</title>
					<path
						fill="currentColor"
						d="M47.7,-57.2C59.5,-45.9,65.8,-28.9,68.2,-11.7C70.6,5.6,69.2,23,60.8,35.9C52.4,48.8,37,57.1,20.6,63.3C4.3,69.5,-13,73.5,-29.7,69.7C-46.4,65.9,-62.5,54.3,-70.8,38.4C-79.1,22.5,-79.6,2.3,-74.4,-15.6C-69.2,-33.5,-58.3,-49.1,-44.2,-59.8C-30.1,-70.5,-12.8,-76.3,3.2,-80.1C19.2,-83.9,38.4,-85.7,47.7,-57.2Z"
						transform="translate(100 100)"
					/>
				</svg>
			</div>

			<div className="container mx-auto px-4 relative z-10">
				<div className="flex justify-center items-center gap-2 mb-6 relative">
					<Clock className="h-5 w-5 text-primary" />
					<h2 className="text-2xl font-bold text-primary">Service Times</h2>
					{liveStreamUrl && isLive && (
						<a
							href={liveStreamUrl}
							target="_blank"
							rel="noopener noreferrer"
							className="absolute -top-3 -translate-y-1/2 flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300"
						>
							<span className="relative flex h-3 w-3">
								<span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
								<span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
							</span>
							<Radio className="h-4 w-4" />
							<span>LIVE</span>
						</a>
					)}
				</div>
				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{services.map((service) => (
						<div
							key={service.id}
							className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 accent-border relative overflow-hidden"
						>
							{/* Small decorative SVG for each card */}
							<div className="absolute top-0 right-0 w-16 h-16 opacity-5">
								<svg
									viewBox="0 0 200 200"
									xmlns="http://www.w3.org/2000/svg"
									className="w-full h-full text-accent"
									aria-hidden="true"
								>
									<title>Card decoration</title>
									<path
										fill="currentColor"
										d="M45.3,-51.2C58.3,-40.9,68.8,-25.9,71.8,-9.2C74.9,7.5,70.5,25.9,60.1,39.3C49.7,52.7,33.3,61.1,15.8,65.2C-1.7,69.3,-20.3,69.1,-35.9,61.5C-51.5,53.9,-64.1,38.9,-70.2,21.2C-76.3,3.5,-75.9,-16.9,-67.1,-32.6C-58.3,-48.3,-41.1,-59.3,-24.4,-67.1C-7.7,-74.9,8.5,-79.5,23.2,-74.5C37.9,-69.5,51.1,-55,64.3,-40.4Z"
										transform="translate(100 100)"
									/>
								</svg>
							</div>

							<h3 className="text-xl font-semibold mb-2 text-primary">
								{service.title}
							</h3>
							<div className="space-y-2">
								<div className="flex items-center text-sm">
									<Clock className="h-4 w-4 mr-2 text-accent" />
									<span className="text-gray-600">
										{format(service.startDate, "h:mm a")} -{" "}
										{format(service.endDate, "h:mm a")}
									</span>
								</div>
								{service.location && (
									<div className="flex items-center text-sm">
										<MapPin className="h-4 w-4 mr-2 text-accent" />
										<span className="text-gray-600">{service.location}</span>
									</div>
								)}
							</div>
							{service.description && (
								<p className="text-gray-600 mt-2">
									{formatDescription(service.description)}
								</p>
							)}
						</div>
					))}
				</div>
			</div>
		</section>
	);
}
