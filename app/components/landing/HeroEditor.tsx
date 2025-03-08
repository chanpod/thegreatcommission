import type { ChangeEvent } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { toast } from "sonner";
import { UploadButton } from "~/utils/uploadthing";
import { X } from "lucide-react";

interface HeroEditorProps {
	heroImageUrl: string;
	setHeroImageUrl: (url: string) => void;
	heroConfig: {
		imagePosition: string;
		imageObjectFit: string;
		overlayOpacity: string;
		height: string;
	};
	updateHeroConfig: (field: string, value: string) => void;
	formData: {
		heroHeadline: string;
		heroSubheadline: string;
	};
	handleFieldChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
	) => void;
}

export function HeroEditor({
	heroImageUrl,
	setHeroImageUrl,
	heroConfig,
	updateHeroConfig,
	formData,
	handleFieldChange,
}: HeroEditorProps) {
	// Function to handle deleting the hero image
	const handleDeleteHeroImage = async () => {
		if (heroImageUrl) {
			try {
				// Call our API endpoint to delete the image from uploadthing
				const response = await fetch("/api/uploadthing/delete", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ imageUrl: heroImageUrl }),
				});

				const result = await response.json();

				if (result.success) {
					setHeroImageUrl("");
					toast.success("Hero image removed successfully");
				} else {
					// If the API call fails, still remove the URL from our state
					// but inform the user that the file might not have been deleted from storage
					setHeroImageUrl("");
					toast.warning(
						"Image removed from page, but may not have been deleted from storage",
					);
					console.error("Failed to delete image from storage:", result.error);
				}
			} catch (error) {
				// Handle any errors that occur during the API call
				setHeroImageUrl("");
				toast.warning(
					"Image removed from page, but may not have been deleted from storage",
				);
				console.error("Error deleting image:", error);
			}
		}
	};

	return (
		<div className="space-y-6">
			{/* All inputs section */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Text inputs */}
				<div className="space-y-4">
					<div>
						<Label htmlFor="heroHeadline">Hero Headline</Label>
						<Input
							id="heroHeadline"
							name="heroHeadline"
							value={formData.heroHeadline}
							onChange={handleFieldChange}
							placeholder="Welcome to Our Church"
						/>
					</div>
					<div>
						<Label htmlFor="heroSubheadline">Hero Subheadline</Label>
						<Input
							id="heroSubheadline"
							name="heroSubheadline"
							value={formData.heroSubheadline}
							onChange={handleFieldChange}
							placeholder="A place to belong, believe, and become"
						/>
					</div>
				</div>

				{/* Image upload and configuration */}
				<div className="space-y-4">
					<div>
						<Label>Hero Image</Label>
						<div className="mt-2">
							{!heroImageUrl ? (
								<div className="border border-dashed rounded-md p-8 text-center bg-muted">
									<p className="text-sm text-muted-foreground mb-4">
										Upload a hero image for your landing page
									</p>
									<UploadButton
										endpoint="imageUploader"
										onClientUploadComplete={(res) => {
											if (res && res.length > 0) {
												// If there was a previous image, delete it first
												if (heroImageUrl) {
													// Call our API endpoint to delete the previous image
													fetch("/api/uploadthing/delete", {
														method: "POST",
														headers: {
															"Content-Type": "application/json",
														},
														body: JSON.stringify({ imageUrl: heroImageUrl }),
													}).catch((error) => {
														console.error(
															"Error deleting previous image:",
															error,
														);
													});
												}

												// Set the new image URL
												setHeroImageUrl(res[0].url);
												toast.success("Your hero image has been updated");
											}
										}}
										onUploadError={(error: Error) => {
											toast.error(error.message);
										}}
									/>
								</div>
							) : (
								<div className="flex items-center justify-between">
									<div className="text-sm text-muted-foreground">
										Image uploaded successfully
									</div>
									<Button
										type="button"
										variant="destructive"
										size="sm"
										onClick={handleDeleteHeroImage}
									>
										<X className="h-4 w-4 mr-2" /> Remove Image
									</Button>
								</div>
							)}
						</div>
					</div>

					{heroImageUrl && (
						<>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="heroImagePosition">Image Position</Label>
									<select
										id="heroImagePosition"
										value={heroConfig.imagePosition}
										onChange={(e) =>
											updateHeroConfig("imagePosition", e.target.value)
										}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										<option value="center">Center</option>
										<option value="top">Top</option>
										<option value="bottom">Bottom</option>
										<option value="left">Left</option>
										<option value="right">Right</option>
									</select>
								</div>
								<div>
									<Label htmlFor="heroImageObjectFit">Image Fit</Label>
									<select
										id="heroImageObjectFit"
										value={heroConfig.imageObjectFit}
										onChange={(e) =>
											updateHeroConfig("imageObjectFit", e.target.value)
										}
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
									>
										<option value="cover">Cover (fills area, may crop)</option>
										<option value="contain">
											Contain (shows all, may have space)
										</option>
										<option value="fill">Fill (stretches to fit)</option>
									</select>
								</div>
							</div>

							<div className="grid grid-cols-2 gap-4">
								<div>
									<Label htmlFor="overlayOpacity">Overlay Opacity</Label>
									<div className="flex items-center gap-4">
										<input
											id="overlayOpacity"
											type="range"
											min="0"
											max="1"
											step="0.1"
											value={heroConfig.overlayOpacity}
											onChange={(e) =>
												updateHeroConfig("overlayOpacity", e.target.value)
											}
											className="flex-1"
										/>
										<span>
											{Number(heroConfig.overlayOpacity || 0.5).toFixed(1)}
										</span>
									</div>
								</div>
								<div>
									<Label htmlFor="height">Hero Height</Label>
									<Input
										id="height"
										value={heroConfig.height}
										onChange={(e) => updateHeroConfig("height", e.target.value)}
										placeholder="500px"
									/>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			{/* Full-width hero preview */}
			{heroImageUrl && (
				<div className="mt-8 border rounded-md overflow-hidden">
					<h3 className="text-lg font-semibold p-3 border-b bg-muted">
						Hero Preview
					</h3>
					<div
						className="relative overflow-hidden"
						style={{ height: heroConfig.height || "300px" }}
					>
						{/* Background image */}
						<div className="absolute inset-0">
							<img
								src={heroImageUrl}
								alt="Hero preview"
								className="w-full h-full"
								style={{
									objectFit:
										(heroConfig.imageObjectFit as
											| "cover"
											| "contain"
											| "fill") || "cover",
									objectPosition: (() => {
										switch (heroConfig.imagePosition) {
											case "top":
												return "center top";
											case "bottom":
												return "center bottom";
											case "left":
												return "left center";
											case "right":
												return "right center";
											default:
												return "center";
										}
									})(),
								}}
							/>
						</div>

						{/* Text overlay */}
						<div
							className="absolute inset-0 flex flex-col justify-center items-center text-white px-4 text-center"
							style={{
								backgroundColor: `rgba(0, 0, 0, ${heroConfig.overlayOpacity || 0.5})`,
							}}
						>
							{/* Decorative element */}
							<div className="absolute top-0 right-0 w-32 h-32 opacity-20 text-white pointer-events-none overflow-hidden">
								<svg
									className="w-full h-full"
									viewBox="0 0 200 200"
									xmlns="http://www.w3.org/2000/svg"
									aria-hidden="true"
								>
									<path
										fill="currentColor"
										d="M42.8,-65.2C54.9,-56.3,63.7,-43.2,70.1,-28.7C76.4,-14.2,80.3,1.8,76.7,16.2C73.1,30.6,62,43.4,48.8,53.5C35.6,63.6,20.3,71,3.1,68.1C-14.1,65.2,-33.2,52,-45.9,37.4C-58.6,22.8,-64.9,6.8,-64.2,-9.1C-63.5,-25,-55.8,-40.8,-44.1,-50.1C-32.4,-59.4,-16.2,-62.2,-0.2,-61.9C15.8,-61.7,30.7,-74.1,42.8,-65.2Z"
										transform="translate(100 100)"
									/>
								</svg>
							</div>

							<h2 className="text-3xl md:text-4xl font-bold mb-2 max-w-3xl relative z-10">
								{formData.heroHeadline || "Welcome to Our Church"}
							</h2>
							<p className="text-lg md:text-xl max-w-2xl relative z-10">
								{formData.heroSubheadline ||
									"A place to belong, believe, and become"}
							</p>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
