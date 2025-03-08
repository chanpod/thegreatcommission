import React from "react";
import { ContactFormDialog } from "~/components/ContactFormDialog";

export interface CustomSectionButton {
	label: string;
	url: string;
	variant?: "primary" | "secondary" | "outline";
}

export interface CustomSectionImage {
	url: string;
	alt?: string;
}

export interface CustomSectionProps {
	id: string;
	title?: string;
	subtitle?: string;
	content?: string;
	backgroundColor?: string;
	textColor?: string;
	backgroundImage?: string;
	layout?: "text-only" | "text-image" | "full-width-image" | "cards" | "team";
	buttons?: CustomSectionButton[];
	images?: CustomSectionImage[];
	cards?: Array<{
		title?: string;
		content?: string;
		image?: string;
		link?: string;
	}>;
	teamMembers?: Array<{
		userId?: string;
		name: string;
		role?: string;
		image?: string;
		bio?: string;
	}>;
	textAlign?: "left" | "center" | "right";
	contentWidth?: "narrow" | "medium" | "wide" | "full";
	paddingY?: "small" | "medium" | "large";
	imagePosition?: "left" | "right";
	useThemeColors?: boolean;
	decorativeElements?: boolean;
}

// SVG Decorative Elements
const DecorativeElements = ({ position }: { position: "top" | "bottom" }) => {
	return position === "top" ? (
		<div className="absolute top-0 right-0 w-full h-full opacity-25 pointer-events-none overflow-hidden">
			<svg
				className="absolute -top-20 -right-20 w-[120%] h-[120%]"
				viewBox="0 0 800 800"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeOpacity="0.6"
					strokeDasharray="10,5"
					strokeLinecap="round"
					d="M-100,240 C100,290 300,100 500,200 S700,400 900,300"
					transform="rotate(-15)"
					className="animate-dash"
				/>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeOpacity="0.4"
					strokeDasharray="15,10"
					strokeLinecap="round"
					d="M-100,340 C100,390 300,200 500,300 S700,500 900,400"
					transform="rotate(-15)"
					className="animate-dash-reverse"
				/>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeOpacity="0.2"
					strokeDasharray="20,15"
					strokeLinecap="round"
					d="M-100,440 C100,490 300,300 500,400 S700,600 900,500"
					transform="rotate(-15)"
					className="animate-dash"
					style={{ animationDuration: "30s" }}
				/>

				{/* Add decorative circles */}
				<circle
					cx="200"
					cy="200"
					r="20"
					fill="currentColor"
					fillOpacity="0.1"
					className="float-animation"
					style={{ animationDuration: "15s" }}
				/>
				<circle
					cx="600"
					cy="300"
					r="15"
					fill="currentColor"
					fillOpacity="0.1"
					className="float-animation"
					style={{ animationDuration: "20s", animationDelay: "2s" }}
				/>
				<circle
					cx="400"
					cy="500"
					r="25"
					fill="currentColor"
					fillOpacity="0.1"
					className="float-animation"
					style={{ animationDuration: "18s", animationDelay: "1s" }}
				/>
			</svg>
		</div>
	) : (
		<div className="absolute bottom-0 left-0 w-full h-full opacity-25 pointer-events-none overflow-hidden">
			<svg
				className="absolute -bottom-20 -left-20 w-[120%] h-[120%]"
				viewBox="0 0 800 800"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeOpacity="0.6"
					strokeDasharray="10,5"
					strokeLinecap="round"
					d="M-100,240 C100,290 300,100 500,200 S700,400 900,300"
					transform="rotate(15)"
					className="animate-dash-reverse"
				/>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeOpacity="0.4"
					strokeDasharray="15,10"
					strokeLinecap="round"
					d="M-100,340 C100,390 300,200 500,300 S700,500 900,400"
					transform="rotate(15)"
					className="animate-dash"
				/>
				<path
					fill="none"
					stroke="currentColor"
					strokeWidth="3"
					strokeOpacity="0.2"
					strokeDasharray="20,15"
					strokeLinecap="round"
					d="M-100,440 C100,490 300,300 500,400 S700,600 900,500"
					transform="rotate(15)"
					className="animate-dash-reverse"
					style={{ animationDuration: "25s" }}
				/>

				{/* Add decorative polygons */}
				<polygon
					points="300,100 320,150 270,150"
					fill="currentColor"
					fillOpacity="0.1"
					className="float-animation"
					style={{ animationDuration: "12s" }}
				/>
				<polygon
					points="500,400 530,470 470,470"
					fill="currentColor"
					fillOpacity="0.1"
					className="float-animation"
					style={{ animationDuration: "16s", animationDelay: "3s" }}
				/>
				<polygon
					points="150,300 190,350 110,350"
					fill="currentColor"
					fillOpacity="0.1"
					className="float-animation"
					style={{ animationDuration: "14s", animationDelay: "1.5s" }}
				/>
			</svg>
		</div>
	);
};

const CustomSection: React.FC<CustomSectionProps> = ({
	id,
	title,
	subtitle,
	content,
	backgroundColor = "#ffffff",
	textColor = "#333333",
	backgroundImage,
	layout = "text-only",
	buttons = [],
	images = [],
	cards = [],
	teamMembers = [],
	textAlign = "left",
	contentWidth = "medium",
	paddingY = "medium",
	imagePosition = "right",
	useThemeColors = false,
	decorativeElements = true,
}) => {
	// Background style with optional image
	const sectionStyle: React.CSSProperties = {
		backgroundColor: useThemeColors
			? "var(--theme-secondary)"
			: backgroundColor,
		color: useThemeColors ? "white" : textColor,
		backgroundImage: backgroundImage ? `url(${backgroundImage})` : undefined,
		backgroundSize: backgroundImage ? "cover" : undefined,
		backgroundPosition: backgroundImage ? "center" : undefined,
	};

	// Determine content max width based on contentWidth
	const getContentWidthClass = () => {
		switch (contentWidth) {
			case "narrow":
				return "max-w-3xl";
			case "medium":
				return "max-w-5xl";
			case "wide":
				return "max-w-7xl";
			case "full":
				return "max-w-full";
			default:
				return "max-w-5xl";
		}
	};

	// Determine padding based on paddingY
	const getPaddingClass = () => {
		switch (paddingY) {
			case "small":
				return "py-8";
			case "medium":
				return "py-16";
			case "large":
				return "py-24";
			default:
				return "py-16";
		}
	};

	// Determine text alignment class
	const getTextAlignClass = () => {
		switch (textAlign) {
			case "left":
				return "text-left";
			case "center":
				return "text-center";
			case "right":
				return "text-right";
			default:
				return "text-left";
		}
	};

	// Get button style based on variant
	const getButtonClass = (
		variant: CustomSectionButton["variant"] = "primary",
	) => {
		const baseClass =
			"inline-block px-6 py-3 rounded-md font-medium transition-all duration-200";

		if (useThemeColors) {
			switch (variant) {
				case "primary":
					return `${baseClass} bg-white bg-opacity-20 hover:bg-opacity-30 text-white`;
				case "secondary":
					return `${baseClass} bg-white bg-opacity-10 hover:bg-opacity-20 text-white`;
				case "outline":
					return `${baseClass} border border-white hover:bg-white hover:bg-opacity-10 text-white`;
				default:
					return `${baseClass} bg-white bg-opacity-20 hover:bg-opacity-30 text-white`;
			}
		} else {
			switch (variant) {
				case "primary":
					return `${baseClass} bg-blue-600 hover:bg-blue-700 text-white`;
				case "secondary":
					return `${baseClass} bg-gray-200 hover:bg-gray-300 text-gray-800`;
				case "outline":
					return `${baseClass} border border-current hover:bg-opacity-10 hover:bg-gray-700`;
				default:
					return `${baseClass} bg-blue-600 hover:bg-blue-700 text-white`;
			}
		}
	};

	// Render different layouts
	const renderLayout = () => {
		const content = (() => {
			switch (layout) {
				case "text-image":
					return renderTextImageLayout();
				case "full-width-image":
					return renderFullWidthImageLayout();
				case "cards":
					return renderCardsLayout();
				case "team":
					return renderTeamLayout();
				case "text-only":
				default:
					return renderTextOnlyLayout();
			}
		})();

		return content;
	};

	// Text-only layout
	const renderTextOnlyLayout = () => (
		<div className={`${getTextAlignClass()}`}>
			{title && (
				<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
			)}
			{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

			{content && (
				<div
					className={`prose max-w-none mb-8 ${useThemeColors ? "prose-invert" : ""}`}
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			)}

			{renderButtons()}
		</div>
	);

	// Text and image layout
	const renderTextImageLayout = () => {
		const mainImage = images[0]?.url || "";
		const imageAlt = images[0]?.alt || "Section image";

		const flex =
			imagePosition === "left"
				? "flex-col md:flex-row"
				: "flex-col md:flex-row-reverse";

		return (
			<div className={`flex ${flex} gap-8 md:gap-12 items-center`}>
				{mainImage && (
					<div className="md:w-1/2 relative">
						<img
							src={mainImage}
							alt={imageAlt}
							className="w-full h-auto rounded-lg shadow-lg relative z-10"
						/>
						{/* Add decorative element behind image */}
						{decorativeElements && (
							<div className="absolute inset-0 bg-current opacity-5 rounded-lg transform -translate-x-4 translate-y-4 z-0"></div>
						)}
					</div>
				)}

				<div className={`md:w-1/2 ${getTextAlignClass()}`}>
					{title && (
						<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
					)}
					{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

					{content && (
						<div
							className={`prose max-w-none mb-8 ${useThemeColors ? "prose-invert" : ""}`}
							dangerouslySetInnerHTML={{ __html: content }}
						/>
					)}

					{renderButtons()}
				</div>
			</div>
		);
	};

	// Full width image layout
	const renderFullWidthImageLayout = () => {
		const mainImage = images[0]?.url || "";
		const imageAlt = images[0]?.alt || "Section image";

		return (
			<div className="relative z-10">
				{(title || subtitle) && (
					<div className={`${getTextAlignClass()} mb-8`}>
						{title && (
							<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
						)}
						{subtitle && (
							<h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>
						)}
					</div>
				)}

				{mainImage && (
					<div className="relative w-full mb-8">
						<img src={mainImage} alt={imageAlt} className="w-full h-auto" />
					</div>
				)}

				{content && (
					<div className={`${getTextAlignClass()}`}>
						<div
							className={`prose max-w-none mb-8 ${useThemeColors ? "prose-invert" : ""}`}
							dangerouslySetInnerHTML={{ __html: content }}
						/>

						{renderButtons()}
					</div>
				)}
			</div>
		);
	};

	// Cards layout
	const renderCardsLayout = () => (
		<>
			<div className={`${getTextAlignClass()}`}>
				{title && (
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
				)}
				{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

				{content && (
					<div
						className={`prose max-w-none ${useThemeColors ? "prose-invert" : ""}`}
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				)}
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8">
				{cards.map((card, index) => (
					<div
						key={index}
						className={`rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 ${
							useThemeColors ? "bg-white bg-opacity-10" : "bg-white"
						}`}
					>
						{card.image && (
							<div className="relative">
								<img
									src={card.image}
									alt={card.title || "Card image"}
									className="w-full h-48 object-cover"
								/>
								{decorativeElements && (
									<div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
								)}
							</div>
						)}
						<div className="p-6">
							{card.title && (
								<h3 className="text-xl font-bold mb-3">{card.title}</h3>
							)}
							{card.content && (
								<div
									className={`prose-sm ${useThemeColors ? "prose-invert" : ""} mb-4`}
									dangerouslySetInnerHTML={{ __html: card.content }}
								/>
							)}
							{card.link && (
								<a
									href={card.link}
									className={`inline-block mt-2 ${
										useThemeColors
											? "text-white hover:underline"
											: "text-blue-600 hover:text-blue-800"
									}`}
								>
									Learn more →
								</a>
							)}
						</div>
					</div>
				))}
			</div>

			{buttons.length > 0 && (
				<div className={`mt-12 ${getTextAlignClass()}`}>{renderButtons()}</div>
			)}
		</>
	);

	// Team layout
	const renderTeamLayout = () => (
		<>
			<div className={`${getTextAlignClass()}`}>
				{title && (
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
				)}
				{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

				{content && (
					<div
						className={`prose max-w-none ${useThemeColors ? "prose-invert" : ""}`}
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				)}
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8">
				{teamMembers.map((member, index) => (
					<div
						key={index}
						className={`text-center transition-transform duration-300 hover:-translate-y-2`}
					>
						{member.image && (
							<div className="relative mx-auto w-48 h-48 mb-4">
								<div className="w-full h-full rounded-full overflow-hidden relative z-10">
									<img
										src={member.image}
										alt={member.name}
										className="w-full h-full object-cover"
									/>
								</div>
								{decorativeElements && (
									<div
										className={`absolute inset-0 rounded-full transform translate-x-2 translate-y-2 z-0 ${
											useThemeColors ? "bg-white bg-opacity-10" : "bg-blue-100"
										}`}
									></div>
								)}
							</div>
						)}
						<h3 className="text-xl font-bold">{member.name}</h3>
						{member.role && (
							<p
								className={`${useThemeColors ? "text-white text-opacity-80" : "text-gray-600"} mb-3`}
							>
								{member.role}
							</p>
						)}
						{member.bio && (
							<div
								className={`prose-sm ${useThemeColors ? "prose-invert" : ""} mx-auto`}
								dangerouslySetInnerHTML={{ __html: member.bio }}
							/>
						)}
					</div>
				))}
			</div>

			{buttons.length > 0 && (
				<div className={`mt-12 ${getTextAlignClass()}`}>{renderButtons()}</div>
			)}
		</>
	);

	// Render buttons
	const renderButtons = () => {
		if (buttons.length === 0) return null;

		return (
			<div className="flex flex-wrap gap-4 justify-start">
				{buttons.map((button, index) => {
					// Check if the button URL is for a form
					if (button.url.includes("/forms/")) {
						// Extract form ID from URL if it's a form link
						const formIdMatch = button.url.match(/\/forms\/([^\/]+)/);
						const formId = formIdMatch ? formIdMatch[1] : null;

						// Extract organization ID from URL
						// Handle both absolute and relative paths
						let orgId;
						if (button.url.includes("/landing/")) {
							const orgIdMatch = button.url.match(/\/landing\/([^\/]+)/);
							orgId = orgIdMatch ? orgIdMatch[1] : null;
						} else {
							// For relative paths like /forms/123, try to get org ID from the current URL
							const pathParts = window.location.pathname.split("/");
							const landingIndex = pathParts.findIndex(
								(part) => part === "landing",
							);
							if (landingIndex >= 0 && landingIndex < pathParts.length - 1) {
								orgId = pathParts[landingIndex + 1];
							}
						}

						if (formId && orgId) {
							// Use ContactFormDialog for form links
							return (
								<ContactFormDialog
									key={index}
									buttonText={button.label}
									churchId={orgId}
									formId={formId}
									buttonVariant={
										button.variant === "primary"
											? "default"
											: button.variant === "secondary"
												? "secondary"
												: "outline"
									}
									buttonClassName={getButtonClass(button.variant)}
									dialogTitle="Complete Form"
									dialogDescription="Please fill out the form below"
								/>
							);
						}
					}

					// Regular link for non-form URLs
					return (
						<a
							key={index}
							href={button.url}
							className={getButtonClass(button.variant)}
						>
							{button.label}
						</a>
					);
				})}
			</div>
		);
	};

	return (
		<section
			id={id}
			className={`${getPaddingClass()} px-4 md:px-8 overflow-hidden relative`}
			style={sectionStyle}
		>
			{decorativeElements && (
				<>
					{useThemeColors ? (
						<>
							<DecorativeElements position="top" />
							<DecorativeElements position="bottom" />
						</>
					) : (
						<>
							{/* For light backgrounds, use darker lines */}
							<div className="absolute top-0 right-0 w-full h-full opacity-15 pointer-events-none overflow-hidden">
								<svg
									className="absolute -top-20 -right-20 w-[120%] h-[120%]"
									viewBox="0 0 800 800"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill="none"
										stroke="#333333"
										strokeWidth="3"
										strokeOpacity="0.3"
										d="M-100,240 C100,290 300,100 500,200 S700,400 900,300"
										transform="rotate(-15)"
									/>
									<path
										fill="none"
										stroke="#333333"
										strokeWidth="3"
										strokeOpacity="0.2"
										d="M-100,340 C100,390 300,200 500,300 S700,500 900,400"
										transform="rotate(-15)"
									/>
									<path
										fill="none"
										stroke="#333333"
										strokeWidth="3"
										strokeOpacity="0.1"
										d="M-100,440 C100,490 300,300 500,400 S700,600 900,500"
										transform="rotate(-15)"
									/>
								</svg>
							</div>
							<div className="absolute bottom-0 left-0 w-full h-full opacity-15 pointer-events-none overflow-hidden">
								<svg
									className="absolute -bottom-20 -left-20 w-[120%] h-[120%]"
									viewBox="0 0 800 800"
									xmlns="http://www.w3.org/2000/svg"
								>
									<path
										fill="none"
										stroke="#333333"
										strokeWidth="3"
										strokeOpacity="0.3"
										d="M-100,240 C100,290 300,100 500,200 S700,400 900,300"
										transform="rotate(15)"
									/>
									<path
										fill="none"
										stroke="#333333"
										strokeWidth="3"
										strokeOpacity="0.2"
										d="M-100,340 C100,390 300,200 500,300 S700,500 900,400"
										transform="rotate(15)"
									/>
									<path
										fill="none"
										stroke="#333333"
										strokeWidth="3"
										strokeOpacity="0.1"
										d="M-100,440 C100,490 300,300 500,400 S700,600 900,500"
										transform="rotate(15)"
									/>
								</svg>
							</div>
						</>
					)}
				</>
			)}
			<div className="container mx-auto relative z-10">{renderLayout()}</div>
		</section>
	);
};

export default CustomSection;
