import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { UploadButton } from "~/utils/uploadthing";
import { toast } from "sonner";
import { X, ImagePlus } from "lucide-react";
import { Card, CardContent } from "~/components/ui/card";

export interface EventPhoto {
	id: string;
	photoUrl: string;
	caption?: string;
}

interface EventPhotoUploaderProps {
	eventId: string;
	existingPhotos: EventPhoto[];
	onPhotosChange: (photos: EventPhoto[]) => void;
	onSavePhotos: (photos: EventPhoto[]) => Promise<void>;
	isSubmitting?: boolean;
}

export function EventPhotoUploader({
	eventId,
	existingPhotos = [],
	onPhotosChange,
	onSavePhotos,
	isSubmitting = false,
}: EventPhotoUploaderProps) {
	const [photos, setPhotos] = useState<EventPhoto[]>(existingPhotos);
	const [isSaving, setIsSaving] = useState(false);

	const handlePhotoUploadComplete = (res: { url: string }[]) => {
		if (res && res.length > 0) {
			const newPhotos = res.map((file) => ({
				id: crypto.randomUUID(),
				photoUrl: file.url,
				caption: "",
			}));

			const updatedPhotos = [...photos, ...newPhotos];
			setPhotos(updatedPhotos);
			onPhotosChange(updatedPhotos);

			toast.success(
				`${res.length} photo${res.length > 1 ? "s" : ""} uploaded successfully`,
			);
		}
	};

	const handleCaptionChange = (id: string, caption: string) => {
		const updatedPhotos = photos.map((photo) =>
			photo.id === id ? { ...photo, caption } : photo,
		);
		setPhotos(updatedPhotos);
		onPhotosChange(updatedPhotos);
	};

	const handleRemovePhoto = (id: string) => {
		const updatedPhotos = photos.filter((photo) => photo.id !== id);
		setPhotos(updatedPhotos);
		onPhotosChange(updatedPhotos);
	};

	const handleSavePhotos = async () => {
		setIsSaving(true);
		try {
			await onSavePhotos(photos);
			toast.success("Event photos saved successfully");
		} catch (error) {
			toast.error("Failed to save event photos");
			console.error(error);
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex justify-between items-center">
				<h3 className="text-lg font-medium">Event Photos</h3>
				<Button onClick={handleSavePhotos} disabled={isSubmitting || isSaving}>
					{isSaving ? (
						<>
							<span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
							Saving...
						</>
					) : (
						"Save Photos"
					)}
				</Button>
			</div>

			<div className="bg-gray-50 border border-dashed border-gray-300 rounded-lg p-6 text-center">
				<UploadButton
					endpoint="eventPhotosUploader"
					onClientUploadComplete={handlePhotoUploadComplete}
					onUploadError={(error: Error) => {
						toast.error(`Upload failed: ${error.message}`);
					}}
					className="ut-button:bg-primary ut-button:ut-readying:bg-primary/80"
				/>
				<p className="text-sm text-gray-500 mt-2">
					Upload up to 10 photos (max 4MB each)
				</p>
			</div>

			{photos.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
					{photos.map((photo) => (
						<Card key={photo.id} className="overflow-hidden">
							<div className="relative aspect-video">
								<img
									src={photo.photoUrl}
									alt={photo.caption || "Event photo"}
									className="w-full h-full object-cover"
								/>
								<Button
									variant="destructive"
									size="icon"
									className="absolute top-2 right-2"
									onClick={() => handleRemovePhoto(photo.id)}
								>
									<X className="h-4 w-4" />
								</Button>
							</div>
							<CardContent className="p-3">
								<Label htmlFor={`caption-${photo.id}`} className="sr-only">
									Caption
								</Label>
								<Input
									id={`caption-${photo.id}`}
									value={photo.caption || ""}
									onChange={(e) =>
										handleCaptionChange(photo.id, e.target.value)
									}
									placeholder="Add a caption..."
									className="mt-2"
								/>
							</CardContent>
						</Card>
					))}
				</div>
			)}

			{photos.length === 0 && (
				<div className="text-center py-8">
					<ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
					<h3 className="mt-2 text-sm font-semibold text-gray-900">
						No photos
					</h3>
					<p className="mt-1 text-sm text-gray-500">
						Upload photos to showcase this event
					</p>
				</div>
			)}
		</div>
	);
}
