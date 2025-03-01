import React from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { ClientOnly } from "remix-utils/client-only";
import { RichTextEditor } from "~/components/messaging/RichTextEditor";
import { toast } from "sonner";
import { UploadButton } from "~/utils/uploadthing";
import { X } from "lucide-react";
import type { CustomSectionProps } from "~/components/CustomSection";

interface CustomSectionsEditorProps {
	customSections: CustomSectionProps[];
	forms: Array<{ id: string; name: string }>;
	organization: { id: string };
	addCustomSection: () => void;
	updateCustomSection: (
		index: number,
		field: string,
		value: string | number | boolean | object,
	) => void;
	removeCustomSection: (index: number) => void;
	moveCustomSection: (index: number, direction: "up" | "down") => void;
}

export function CustomSectionsEditor({
	customSections,
	forms,
	organization,
	addCustomSection,
	updateCustomSection,
	removeCustomSection,
	moveCustomSection,
}: CustomSectionsEditorProps) {
	return (
		<div className="space-y-6">
			{forms.length > 0 && (
				<div className="bg-blue-50 p-4 rounded-md mb-4">
					<h3 className="text-sm font-medium text-blue-800 mb-1">
						Form Integration Available
					</h3>
					<p className="text-sm text-blue-700">
						You can now link buttons in custom sections directly to your forms.
						Add a button to any section and use the dropdown to select a form.
					</p>
				</div>
			)}

			{customSections.length === 0 ? (
				<div className="text-center p-8 border border-dashed rounded-lg">
					<h3 className="text-lg font-medium mb-2">No Custom Sections Yet</h3>
					<p className="text-muted-foreground mb-4">
						Create custom sections for staff, ministries, testimonials, and
						more.
					</p>
					<Button type="button" onClick={addCustomSection}>
						Add Your First Section
					</Button>
				</div>
			) : (
				customSections.map((section, index) => (
					<div
						key={section.id || `section-${index}`}
						className="border rounded-lg p-4 bg-slate-50 border-l-4 border-l-blue-500 shadow-sm"
					>
						<div className="flex justify-between items-center mb-4">
							<h3 className="text-lg font-medium flex items-center">
								<span className="bg-blue-500 text-white rounded-full w-6 h-6 inline-flex items-center justify-center mr-2 text-sm">
									{index + 1}
								</span>
								{section.title || `Section ${index + 1}`}
							</h3>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => moveCustomSection(index, "up")}
									disabled={index === 0}
								>
									Move Up
								</Button>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => moveCustomSection(index, "down")}
									disabled={index === customSections.length - 1}
								>
									Move Down
								</Button>
								<Button
									type="button"
									variant="destructive"
									size="sm"
									onClick={() => removeCustomSection(index)}
								>
									Remove
								</Button>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
							<div>
								<Label htmlFor={`section-${index}-title`}>Section Title</Label>
								<Input
									id={`section-${index}-title`}
									value={section.title || ""}
									onChange={(e) =>
										updateCustomSection(index, "title", e.target.value)
									}
								/>
							</div>

							<div>
								<Label htmlFor={`section-${index}-subtitle`}>Subtitle</Label>
								<Input
									id={`section-${index}-subtitle`}
									value={section.subtitle || ""}
									onChange={(e) =>
										updateCustomSection(index, "subtitle", e.target.value)
									}
								/>
							</div>

							<div>
								<Label htmlFor={`section-${index}-layout`}>Layout Type</Label>
								<select
									id={`section-${index}-layout`}
									value={section.layout || "text-only"}
									onChange={(e) =>
										updateCustomSection(index, "layout", e.target.value)
									}
									className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
								>
									<option value="text-only">Text Only</option>
									<option value="text-image">Text & Image</option>
									<option value="full-width-image">Full Width Image</option>
									<option value="cards">Cards/Grid</option>
									<option value="team">Team Members</option>
								</select>
							</div>

							<div>
								<Label htmlFor={`section-${index}-background`}>
									Background Color
								</Label>
								<div className="flex gap-2 items-center">
									<input
										type="color"
										value={section.backgroundColor || "#ffffff"}
										onChange={(e) =>
											updateCustomSection(
												index,
												"backgroundColor",
												e.target.value,
											)
										}
										className="w-10 h-10"
									/>
									<Input
										value={section.backgroundColor || "#ffffff"}
										onChange={(e) =>
											updateCustomSection(
												index,
												"backgroundColor",
												e.target.value,
											)
										}
									/>
								</div>
							</div>
						</div>

						<div>
							<Label htmlFor={`section-${index}-content`}>Content</Label>
							<ClientOnly>
								{() => (
									<RichTextEditor
										name={`section-${index}-content`}
										defaultValue={section.content || ""}
										onContentChange={(content) => {
											updateCustomSection(index, "content", content);
										}}
									/>
								)}
							</ClientOnly>
						</div>

						{/* Add image upload for layouts that need images */}
						{(section.layout === "text-image" ||
							section.layout === "full-width-image" ||
							section.layout === "cards") && (
							<div className="mt-4">
								<Label>Section Images</Label>
								<div className="mt-2 space-y-4">
									{/* Display current images if they exist */}
									{section.images && section.images.length > 0 ? (
										<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
											{section.images.map((image, imageIndex) => (
												<div
													key={`image-${imageIndex}`}
													className="relative group"
												>
													<div className="aspect-video rounded-md overflow-hidden border bg-muted">
														<img
															src={image.url}
															alt={image.alt || "Section image"}
															className="w-full h-full object-cover"
														/>
													</div>
													<div className="absolute top-2 right-2">
														<Button
															type="button"
															variant="destructive"
															size="sm"
															className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
															onClick={() => {
																const updatedImages = [...section.images];
																updatedImages.splice(imageIndex, 1);
																updateCustomSection(
																	index,
																	"images",
																	updatedImages,
																);
															}}
														>
															<X className="h-4 w-4" />
														</Button>
													</div>
													<div className="mt-1">
														<Input
															placeholder="Image alt text"
															value={image.alt || ""}
															onChange={(e) => {
																const updatedImages = [...section.images];
																updatedImages[imageIndex] = {
																	...updatedImages[imageIndex],
																	alt: e.target.value,
																};
																updateCustomSection(
																	index,
																	"images",
																	updatedImages,
																);
															}}
															className="text-xs"
														/>
													</div>
												</div>
											))}
										</div>
									) : (
										<p className="text-sm text-muted-foreground italic mb-2">
											No images added yet
										</p>
									)}

									{/* Image upload button */}
									<UploadButton
										endpoint="imageUploader"
										onClientUploadComplete={(res) => {
											if (res && res.length > 0) {
												const newImage = {
													url: res[0].url,
													alt: "",
												};
												const updatedImages = [
													...(section.images || []),
													newImage,
												];
												updateCustomSection(index, "images", updatedImages);
												toast({
													title: "Image uploaded successfully",
													description:
														"Your image has been added to the section",
												});
											}
										}}
										onUploadError={(error: Error) => {
											toast({
												title: "Error uploading photo",
												description: error.message,
												variant: "destructive",
											});
										}}
									/>
								</div>
							</div>
						)}

						{/* Cards layout specific fields */}
						{section.layout === "cards" && (
							<div className="mt-6">
								<div className="flex justify-between items-center mb-2">
									<Label>Cards</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											const newCard = {
												title: "Card Title",
												content: "Card content goes here",
												image: section.images?.[0]?.url || "",
											};
											const updatedCards = [...(section.cards || []), newCard];
											updateCustomSection(index, "cards", updatedCards);
										}}
									>
										Add Card
									</Button>
								</div>

								<div className="space-y-4 mt-2">
									{section.cards && section.cards.length > 0 ? (
										section.cards.map((card, cardIndex) => (
											<div
												key={`card-${cardIndex}`}
												className="border rounded-md p-4"
											>
												<div className="flex justify-between items-center mb-2">
													<h4 className="font-medium">Card {cardIndex + 1}</h4>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={() => {
															const updatedCards = [...section.cards];
															updatedCards.splice(cardIndex, 1);
															updateCustomSection(index, "cards", updatedCards);
														}}
													>
														Remove
													</Button>
												</div>

												<div className="grid grid-cols-1 gap-3">
													<div>
														<Label>Title</Label>
														<Input
															value={card.title || ""}
															onChange={(e) => {
																const updatedCards = [...section.cards];
																updatedCards[cardIndex] = {
																	...updatedCards[cardIndex],
																	title: e.target.value,
																};
																updateCustomSection(
																	index,
																	"cards",
																	updatedCards,
																);
															}}
														/>
													</div>
													<div>
														<Label>Content</Label>
														<Input
															value={card.content || ""}
															onChange={(e) => {
																const updatedCards = [...section.cards];
																updatedCards[cardIndex] = {
																	...updatedCards[cardIndex],
																	content: e.target.value,
																};
																updateCustomSection(
																	index,
																	"cards",
																	updatedCards,
																);
															}}
														/>
													</div>
													<div>
														<Label>Image</Label>
														<select
															className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
															value={card.image || ""}
															onChange={(e) => {
																const updatedCards = [...section.cards];
																updatedCards[cardIndex] = {
																	...updatedCards[cardIndex],
																	image: e.target.value,
																};
																updateCustomSection(
																	index,
																	"cards",
																	updatedCards,
																);
															}}
														>
															<option value="">Select an image</option>
															{section.images.map((image, i) => (
																<option key={i} value={image.url}>
																	Image {i + 1}{" "}
																	{image.alt ? `- ${image.alt}` : ""}
																</option>
															))}
														</select>
													</div>
													<div>
														<Label>Link URL (Optional)</Label>
														<Input
															value={card.link || ""}
															onChange={(e) => {
																const updatedCards = [...section.cards];
																updatedCards[cardIndex] = {
																	...updatedCards[cardIndex],
																	link: e.target.value,
																};
																updateCustomSection(
																	index,
																	"cards",
																	updatedCards,
																);
															}}
															placeholder="https://..."
														/>
													</div>
												</div>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground italic">
											No cards added yet. Add cards to display in a grid layout.
										</p>
									)}
								</div>
							</div>
						)}

						{/* Team layout specific fields */}
						{section.layout === "team" && (
							<div className="mt-6">
								<div className="flex justify-between items-center mb-2">
									<Label>Team Members</Label>
									<Button
										type="button"
										variant="outline"
										size="sm"
										onClick={() => {
											const newMember = {
												name: "Team Member Name",
												role: "Role/Position",
												bio: "Short bio",
												image: "",
											};
											const updatedMembers = [
												...(section.teamMembers || []),
												newMember,
											];
											updateCustomSection(index, "teamMembers", updatedMembers);
										}}
									>
										Add Team Member
									</Button>
								</div>

								<div className="space-y-4 mt-2">
									{section.teamMembers && section.teamMembers.length > 0 ? (
										section.teamMembers.map((member, memberIndex) => (
											<div
												key={`member-${memberIndex}`}
												className="border rounded-md p-4"
											>
												<div className="flex justify-between items-center mb-2">
													<h4 className="font-medium">
														{member.name || `Member ${memberIndex + 1}`}
													</h4>
													<Button
														type="button"
														variant="destructive"
														size="sm"
														onClick={() => {
															const updatedMembers = [...section.teamMembers];
															updatedMembers.splice(memberIndex, 1);
															updateCustomSection(
																index,
																"teamMembers",
																updatedMembers,
															);
														}}
													>
														Remove
													</Button>
												</div>

												<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
													<div>
														<Label>Name</Label>
														<Input
															value={member.name || ""}
															onChange={(e) => {
																const updatedMembers = [...section.teamMembers];
																updatedMembers[memberIndex] = {
																	...updatedMembers[memberIndex],
																	name: e.target.value,
																};
																updateCustomSection(
																	index,
																	"teamMembers",
																	updatedMembers,
																);
															}}
														/>
													</div>
													<div>
														<Label>Role/Position</Label>
														<Input
															value={member.role || ""}
															onChange={(e) => {
																const updatedMembers = [...section.teamMembers];
																updatedMembers[memberIndex] = {
																	...updatedMembers[memberIndex],
																	role: e.target.value,
																};
																updateCustomSection(
																	index,
																	"teamMembers",
																	updatedMembers,
																);
															}}
														/>
													</div>
													<div className="md:col-span-2">
														<Label>Bio</Label>
														<Input
															value={member.bio || ""}
															onChange={(e) => {
																const updatedMembers = [...section.teamMembers];
																updatedMembers[memberIndex] = {
																	...updatedMembers[memberIndex],
																	bio: e.target.value,
																};
																updateCustomSection(
																	index,
																	"teamMembers",
																	updatedMembers,
																);
															}}
														/>
													</div>
													<div className="md:col-span-2">
														<Label>Photo</Label>
														{member.image ? (
															<div className="mt-2 relative w-24 h-24 rounded-full overflow-hidden border">
																<img
																	src={member.image}
																	alt={member.name}
																	className="w-full h-full object-cover"
																/>
																<Button
																	type="button"
																	variant="destructive"
																	size="sm"
																	className="absolute top-0 right-0"
																	onClick={() => {
																		const updatedMembers = [
																			...section.teamMembers,
																		];
																		updatedMembers[memberIndex] = {
																			...updatedMembers[memberIndex],
																			image: "",
																		};
																		updateCustomSection(
																			index,
																			"teamMembers",
																			updatedMembers,
																		);
																	}}
																>
																	<X className="h-4 w-4" />
																</Button>
															</div>
														) : (
															<div className="mt-2">
																<UploadButton
																	endpoint="imageUploader"
																	onClientUploadComplete={(res) => {
																		if (res && res.length > 0) {
																			const updatedMembers = [
																				...section.teamMembers,
																			];
																			updatedMembers[memberIndex] = {
																				...updatedMembers[memberIndex],
																				image: res[0].url,
																			};
																			updateCustomSection(
																				index,
																				"teamMembers",
																				updatedMembers,
																			);
																		}
																	}}
																	onUploadError={(error: Error) => {
																		toast({
																			title: "Error uploading photo",
																			description: error.message,
																			variant: "destructive",
																		});
																	}}
																/>
															</div>
														)}
													</div>
												</div>
											</div>
										))
									) : (
										<p className="text-sm text-muted-foreground italic">
											No team members added yet. Add team members to display in
											this section.
										</p>
									)}
								</div>
							</div>
						)}

						<div className="mt-4">
							<div className="flex justify-between items-center mb-2">
								<Label>Section Buttons</Label>
								<Button
									type="button"
									variant="outline"
									size="sm"
									onClick={() => {
										const newButton = {
											label: "Button",
											url: "#",
										};
										const updatedButtons = [
											...(section.buttons || []),
											newButton,
										];
										updateCustomSection(index, "buttons", updatedButtons);
									}}
								>
									Add Button
								</Button>
							</div>

							<div className="space-y-3">
								{section.buttons &&
									section.buttons.map((button, buttonIndex) => (
										<div
											key={`section-${index}-button-${buttonIndex}`}
											className="flex gap-2 items-start"
										>
											<div className="grid grid-cols-2 gap-2 flex-1">
												<Input
													value={button.label}
													onChange={(e) => {
														const updatedButtons = [...(section.buttons || [])];
														updatedButtons[buttonIndex] = {
															...updatedButtons[buttonIndex],
															label: e.target.value,
														};
														updateCustomSection(
															index,
															"buttons",
															updatedButtons,
														);
													}}
													placeholder="Button Label"
												/>
												<Input
													value={button.url}
													onChange={(e) => {
														const updatedButtons = [...(section.buttons || [])];
														updatedButtons[buttonIndex] = {
															...updatedButtons[buttonIndex],
															url: e.target.value,
														};
														updateCustomSection(
															index,
															"buttons",
															updatedButtons,
														);
													}}
													placeholder="Button URL"
												/>
											</div>
											<div className="flex gap-2">
												<select
													className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
													value=""
													onChange={(e) => {
														if (e.target.value) {
															const formId = e.target.value;
															const updatedButtons = [
																...(section.buttons || []),
															];
															updatedButtons[buttonIndex] = {
																...updatedButtons[buttonIndex],
																url: `/landing/${organization.id}/forms/${formId}`,
															};
															updateCustomSection(
																index,
																"buttons",
																updatedButtons,
															);
														}
													}}
												>
													<option value="">Link to form...</option>
													{forms.map((form) => (
														<option key={form.id} value={form.id}>
															{form.name}
														</option>
													))}
												</select>
												<Button
													type="button"
													variant="destructive"
													onClick={() => {
														const updatedButtons = [...(section.buttons || [])];
														updatedButtons.splice(buttonIndex, 1);
														updateCustomSection(
															index,
															"buttons",
															updatedButtons,
														);
													}}
												>
													Remove
												</Button>
											</div>
											{button.url.includes("/forms/") && (
												<p className="text-xs text-green-600 mt-1">
													This button links to a form
												</p>
											)}
										</div>
									))}

								{(!section.buttons || section.buttons.length === 0) && (
									<p className="text-sm text-muted-foreground italic">
										No buttons added yet. Add buttons to link to other pages or
										forms.
									</p>
								)}
							</div>
						</div>

						{/* Additional styling options */}
						<div className="mt-4 border-t pt-4">
							<h4 className="font-medium mb-2">Additional Styling Options</h4>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<Label>Text Color</Label>
									<div className="flex gap-2 items-center">
										<input
											type="color"
											value={section.textColor || "#333333"}
											onChange={(e) =>
												updateCustomSection(index, "textColor", e.target.value)
											}
											className="w-10 h-10"
										/>
										<Input
											value={section.textColor || "#333333"}
											onChange={(e) =>
												updateCustomSection(index, "textColor", e.target.value)
											}
										/>
									</div>
								</div>
								<div>
									<Label>Text Alignment</Label>
									<select
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										value={section.textAlign || "left"}
										onChange={(e) =>
											updateCustomSection(index, "textAlign", e.target.value)
										}
									>
										<option value="left">Left</option>
										<option value="center">Center</option>
										<option value="right">Right</option>
									</select>
								</div>
								<div>
									<Label>Padding</Label>
									<select
										className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
										value={section.paddingY || "medium"}
										onChange={(e) =>
											updateCustomSection(index, "paddingY", e.target.value)
										}
									>
										<option value="small">Small</option>
										<option value="medium">Medium</option>
										<option value="large">Large</option>
									</select>
								</div>
							</div>
						</div>
					</div>
				))
			)}
		</div>
	);
}
