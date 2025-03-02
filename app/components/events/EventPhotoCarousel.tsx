import { useState } from "react";
import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent } from "~/components/ui/dialog";

interface EventPhoto {
	id: string;
	photoUrl: string;
	caption?: string;
}

interface EventPhotoCarouselProps {
	photos: EventPhoto[];
}

export function EventPhotoCarousel({ photos }: EventPhotoCarouselProps) {
	const [currentIndex, setCurrentIndex] = useState(0);
	const [viewFullscreen, setViewFullscreen] = useState(false);

	if (photos.length === 0) {
		return null;
	}

	const nextPhoto = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === photos.length - 1 ? 0 : prevIndex + 1,
		);
	};

	const prevPhoto = () => {
		setCurrentIndex((prevIndex) =>
			prevIndex === 0 ? photos.length - 1 : prevIndex - 1,
		);
	};

	return (
		<div className="relative w-full">
			<div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
				<img
					src={photos[currentIndex].photoUrl}
					alt={
						photos[currentIndex].caption || `Event photo ${currentIndex + 1}`
					}
					className="w-full h-full object-cover cursor-pointer"
					onClick={() => setViewFullscreen(true)}
				/>

				{photos.length > 1 && (
					<>
						<Button
							variant="secondary"
							size="icon"
							className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
							onClick={prevPhoto}
						>
							<ChevronLeft className="h-5 w-5" />
						</Button>
						<Button
							variant="secondary"
							size="icon"
							className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 hover:bg-white"
							onClick={nextPhoto}
						>
							<ChevronRight className="h-5 w-5" />
						</Button>
					</>
				)}

				{/* Photo counter */}
				{photos.length > 1 && (
					<div className="absolute bottom-2 right-2 bg-black/60 text-white px-2 py-1 rounded-md text-sm">
						{currentIndex + 1} / {photos.length}
					</div>
				)}
			</div>

			{/* Caption */}
			{photos[currentIndex].caption && (
				<p className="text-sm text-gray-600 mt-2 italic">
					{photos[currentIndex].caption}
				</p>
			)}

			{/* Thumbnail navigation */}
			{photos.length > 1 && (
				<div className="flex mt-2 space-x-2 overflow-x-auto pb-2">
					{photos.map((photo, index) => (
						<button
							key={photo.id}
							className={`relative w-16 h-16 rounded-md overflow-hidden flex-shrink-0 ${
								index === currentIndex ? "ring-2 ring-primary" : ""
							}`}
							onClick={() => setCurrentIndex(index)}
						>
							<img
								src={photo.photoUrl}
								alt={photo.caption || `Thumbnail ${index + 1}`}
								className="w-full h-full object-cover"
							/>
						</button>
					))}
				</div>
			)}

			{/* Fullscreen view */}
			<Dialog open={viewFullscreen} onOpenChange={setViewFullscreen}>
				<DialogContent className="max-w-5xl p-0 bg-black/95">
					<Button
						variant="ghost"
						size="icon"
						className="absolute right-2 top-2 z-10 text-white"
						onClick={() => setViewFullscreen(false)}
					>
						<X className="h-5 w-5" />
					</Button>

					<div className="relative h-[80vh] flex items-center justify-center">
						<img
							src={photos[currentIndex].photoUrl}
							alt={
								photos[currentIndex].caption ||
								`Event photo ${currentIndex + 1}`
							}
							className="max-h-full max-w-full object-contain"
						/>

						{photos.length > 1 && (
							<>
								<Button
									variant="ghost"
									size="icon"
									className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 hover:bg-white/40 text-white"
									onClick={prevPhoto}
								>
									<ChevronLeft className="h-6 w-6" />
								</Button>
								<Button
									variant="ghost"
									size="icon"
									className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 hover:bg-white/40 text-white"
									onClick={nextPhoto}
								>
									<ChevronRight className="h-6 w-6" />
								</Button>
							</>
						)}
					</div>

					{photos[currentIndex].caption && (
						<div className="p-4 text-white">
							<p>{photos[currentIndex].caption}</p>
						</div>
					)}
				</DialogContent>
			</Dialog>
		</div>
	);
}
