import React from "react";
import { ContactFormDialog } from "~/components/ContactFormDialog";
import AnimatedElement, { AnimatedGroup } from "./AnimatedElement";
import { motion } from "framer-motion";

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
		<div className={`${getContentWidthClass()} mx-auto`}>
			{title && (
				<AnimatedElement variant="fade-down" className={getTextAlignClass()}>
					<h2 className="text-3xl md:text-4xl font-bold mb-4 custom-section-title">
						{title}
					</h2>
				</AnimatedElement>
			)}
			{subtitle && (
				<AnimatedElement
					variant="fade-up"
					delay={0.1}
					className={getTextAlignClass()}
				>
					<h3 className="text-xl md:text-2xl mb-6 custom-section-subtitle">
						{subtitle}
					</h3>
				</AnimatedElement>
			)}
			{content && (
				<AnimatedElement
					variant="fade-up"
					delay={0.2}
					className={getTextAlignClass()}
				>
					<div
						className="prose prose-lg max-w-none mb-8 custom-section-content"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				</AnimatedElement>
			)}
			{buttons.length > 0 && (
				<AnimatedGroup variant="fade-up" staggerDelay={0.1}>
					{renderButtons()}
				</AnimatedGroup>
			)}
		</div>
	);

	// Text and image layout
	const renderTextImageLayout = () => {
		const imageFirst = imagePosition === "left";
		return (
			<div className={`${getContentWidthClass()} mx-auto`}>
				<div
					className={`flex flex-col ${
						imageFirst ? "md:flex-row" : "md:flex-row-reverse"
					} gap-8 md:gap-16 items-center`}
				>
					{/* Image side */}
					<div className="md:w-1/2">
						{images.length > 0 && (
							<div className="relative">
								<AnimatedElement variant="zoom-in">
									<img
										src={images[0].url}
										alt={images[0].alt || "Section image"}
										className="w-full h-auto rounded-lg shadow-lg custom-section-image"
									/>
								</AnimatedElement>
								{/* Optional decorative elements */}
								{decorativeElements && (
									<motion.div
										className="absolute -bottom-4 -right-4 w-full h-full border-4 border-primary border-opacity-20 rounded-lg z-0"
										initial={{ opacity: 0, scale: 0.9 }}
										animate={{ opacity: 1, scale: 1 }}
										transition={{ duration: 0.8, delay: 0.3 }}
									/>
								)}
							</div>
						)}
					</div>

					{/* Text side */}
					<div className="md:w-1/2">
						{title && (
							<AnimatedElement
								variant="fade-down"
								className={getTextAlignClass()}
							>
								<h2 className="text-3xl md:text-4xl font-bold mb-4 custom-section-title">
									{title}
								</h2>
							</AnimatedElement>
						)}
						{subtitle && (
							<AnimatedElement
								variant="fade-up"
								delay={0.1}
								className={getTextAlignClass()}
							>
								<h3 className="text-xl md:text-2xl mb-6 custom-section-subtitle">
									{subtitle}
								</h3>
							</AnimatedElement>
						)}
						{content && (
							<AnimatedElement
								variant="fade-up"
								delay={0.2}
								className={getTextAlignClass()}
							>
								<div
									className="prose prose-lg max-w-none mb-8 custom-section-content"
									dangerouslySetInnerHTML={{ __html: content }}
								/>
							</AnimatedElement>
						)}
						{buttons.length > 0 && (
							<AnimatedGroup variant="fade-up" staggerDelay={0.1}>
								{renderButtons()}
							</AnimatedGroup>
						)}
					</div>
				</div>
			</div>
		);
	};

	// Full width image layout
	const renderFullWidthImageLayout = () => {
		return (
			<div className="w-full">
				{/* Full width image */}
				{images.length > 0 && (
					<div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
						<motion.img
							src={images[0].url}
							alt={images[0].alt || "Section image"}
							className="w-full h-full object-cover custom-section-image"
							initial={{ scale: 1.1, opacity: 0.8 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 1.2 }}
						/>
						{/* Content overlay */}
						<motion.div
							className="absolute inset-0 bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							transition={{ duration: 0.8 }}
						>
							{title && (
								<AnimatedElement variant="fade-down">
									<h2 className="text-3xl md:text-5xl font-bold mb-4 text-center text-white custom-section-title">
										{title}
									</h2>
								</AnimatedElement>
							)}
							{subtitle && (
								<AnimatedElement variant="fade-up" delay={0.1}>
									<h3 className="text-xl md:text-2xl mb-6 text-center text-white custom-section-subtitle">
										{subtitle}
									</h3>
								</AnimatedElement>
							)}
							{content && (
								<AnimatedElement variant="fade-up" delay={0.2}>
									<div
										className="prose prose-lg prose-invert max-w-2xl mx-auto text-center mb-8 custom-section-content"
										dangerouslySetInnerHTML={{ __html: content }}
									/>
								</AnimatedElement>
							)}
							{buttons.length > 0 && (
								<AnimatedGroup variant="fade-up" staggerDelay={0.1}>
									{renderButtons()}
								</AnimatedGroup>
							)}
						</motion.div>
					</div>
				)}
			</div>
		);
	};

	// Cards layout
	const renderCardsLayout = () => (
		<div className={`${getContentWidthClass()} mx-auto`}>
			{title && (
				<AnimatedElement variant="fade-down" className={getTextAlignClass()}>
					<h2 className="text-3xl md:text-4xl font-bold mb-4 custom-section-title">
						{title}
					</h2>
				</AnimatedElement>
			)}
			{subtitle && (
				<AnimatedElement
					variant="fade-up"
					delay={0.1}
					className={getTextAlignClass()}
				>
					<h3 className="text-xl md:text-2xl mb-6 custom-section-subtitle">
						{subtitle}
					</h3>
				</AnimatedElement>
			)}
			{content && (
				<AnimatedElement
					variant="fade-up"
					delay={0.2}
					className={getTextAlignClass()}
				>
					<div
						className="prose prose-lg max-w-none mb-8 custom-section-content"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				</AnimatedElement>
			)}

			{/* Cards grid */}
			<AnimatedGroup
				variant="fade-up"
				staggerDelay={0.1}
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-8"
			>
				{cards.map((card, index) => (
					<div
						key={`card-${index}`}
						className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-2 custom-section-card"
					>
						{card.image && (
							<img
								src={card.image}
								alt={card.title || `Card ${index + 1}`}
								className="w-full h-48 object-cover"
							/>
						)}
						<div className="p-6">
							{card.title && (
								<h3 className="text-xl font-bold mb-3">{card.title}</h3>
							)}
							{card.content && (
								<div
									className="prose"
									dangerouslySetInnerHTML={{ __html: card.content }}
								/>
							)}
							{card.link && (
								<a
									href={card.link}
									className="inline-block mt-4 text-primary hover:underline"
								>
									Learn More →
								</a>
							)}
						</div>
					</div>
				))}
			</AnimatedGroup>

			{buttons.length > 0 && (
				<AnimatedElement variant="fade-up" delay={0.3} className="mt-12">
					{renderButtons()}
				</AnimatedElement>
			)}
		</div>
	);

	// Team layout
	const renderTeamLayout = () => (
		<div className={`${getContentWidthClass()} mx-auto`}>
			{title && (
				<AnimatedElement variant="fade-down" className={getTextAlignClass()}>
					<h2 className="text-3xl md:text-4xl font-bold mb-4 custom-section-title">
						{title}
					</h2>
				</AnimatedElement>
			)}
			{subtitle && (
				<AnimatedElement
					variant="fade-up"
					delay={0.1}
					className={getTextAlignClass()}
				>
					<h3 className="text-xl md:text-2xl mb-6 custom-section-subtitle">
						{subtitle}
					</h3>
				</AnimatedElement>
			)}
			{content && (
				<AnimatedElement
					variant="fade-up"
					delay={0.2}
					className={getTextAlignClass()}
				>
					<div
						className="prose prose-lg max-w-none mb-8 custom-section-content"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				</AnimatedElement>
			)}

			{/* Team members grid */}
			<AnimatedGroup
				variant="fade-up"
				staggerDelay={0.1}
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mt-8"
			>
				{teamMembers.map((member, index) => (
					<div
						key={`member-${index}`}
						className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl team-member"
					>
						<div className="relative">
							<img
								src={
									member.image ||
									`https://ui-avatars.com/api/?name=${encodeURIComponent(
										member.name,
									)}&background=random&size=256`
								}
								alt={member.name}
								className="w-full h-64 object-cover object-center"
							/>
							{/* Optional decorative overlay */}
							{decorativeElements && (
								<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
							)}
						</div>
						<div className="p-6">
							<h3 className="text-xl font-bold mb-1">{member.name}</h3>
							{member.role && (
								<p className="text-gray-600 mb-3">{member.role}</p>
							)}
							{member.bio && (
								<div
									className="prose prose-sm"
									dangerouslySetInnerHTML={{ __html: member.bio }}
								/>
							)}
						</div>
					</div>
				))}
			</AnimatedGroup>

			{buttons.length > 0 && (
				<AnimatedElement variant="fade-up" delay={0.3} className="mt-12">
					{renderButtons()}
				</AnimatedElement>
			)}
		</div>
	);

	// Render buttons
	const renderButtons = () => {
		return (
			<div
				className={`flex flex-wrap gap-4 mt-6 ${
					textAlign === "center"
						? "justify-center"
						: textAlign === "right"
							? "justify-end"
							: "justify-start"
				}`}
			>
				{buttons.map((button, index) => (
					<a
						key={`button-${index}`}
						href={button.url}
						className={`${getButtonClass(
							button.variant,
						)} custom-section-button`}
					>
						{button.label}
					</a>
				))}
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
