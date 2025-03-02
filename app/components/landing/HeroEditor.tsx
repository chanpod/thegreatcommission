import React from "react";
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
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
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
	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

				<div className="space-y-4">
					<div>
						<Label>Hero Image</Label>
						<div className="mt-2">
							{heroImageUrl ? (
								<div className="relative">
									<div className="aspect-video rounded-md overflow-hidden border bg-muted">
										<img
											src={heroImageUrl}
											alt="Hero background"
											className="w-full h-full object-cover"
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
									<Button
										type="button"
										variant="destructive"
										size="sm"
										className="absolute top-2 right-2"
										onClick={() => setHeroImageUrl("")}
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							) : (
								<div className="border border-dashed rounded-md p-8 text-center bg-muted">
									<p className="text-sm text-muted-foreground mb-4">
										Upload a hero image for your landing page
									</p>
									<UploadButton
										endpoint="imageUploader"
										onClientUploadComplete={(res) => {
											if (res && res.length > 0) {
												setHeroImageUrl(res[0].url);
												toast.success("Your hero image has been updated");
											}
										}}
										onUploadError={(error: Error) => {
											toast.error(error.message);
										}}
									/>
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
									<p className="text-xs text-muted-foreground mt-1">
										Use px, vh, or other valid CSS units (e.g., 500px, 80vh)
									</p>
								</div>
							</div>
						</>
					)}
				</div>
			</div>

			<div className="bg-slate-50 p-4 rounded-md border">
				<h3 className="font-medium mb-2">Hero Section Preview</h3>
				<div className="relative rounded-md overflow-hidden">
					<div
						className="aspect-[21/9] bg-gradient-to-r from-blue-900 to-indigo-800"
						style={{
							backgroundImage: heroImageUrl
								? `url(${heroImageUrl})`
								: undefined,
							backgroundSize: "cover",
							backgroundPosition: (() => {
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
							height: heroConfig.height || "auto",
						}}
					>
						<div
							className="absolute inset-0 bg-black flex flex-col items-center justify-center text-white p-6 text-center"
							style={{
								backgroundColor: `rgba(0, 0, 0, ${heroConfig.overlayOpacity || 0.5})`,
							}}
						>
							<h1 className="text-3xl md:text-4xl font-bold mb-2">
								{formData.heroHeadline || "Welcome to Our Church"}
							</h1>
							<p className="text-xl md:text-2xl max-w-2xl">
								{formData.heroSubheadline ||
									"A place to belong, believe, and become"}
							</p>
							<p className="mt-4 text-xs uppercase tracking-wide opacity-80">
								Preview - This is how your hero section will appear
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
