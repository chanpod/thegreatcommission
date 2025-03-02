import React from "react";

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
}

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
}) => {
	// Background style with optional image
	const sectionStyle: React.CSSProperties = {
		backgroundColor,
		color: textColor,
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
	};

	// Render different layouts
	const renderLayout = () => {
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
	};

	// Text-only layout
	const renderTextOnlyLayout = () => (
		<div className={`${getTextAlignClass()} mx-auto ${getContentWidthClass()}`}>
			{title && (
				<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
			)}
			{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

			{content && (
				<div
					className="prose max-w-none mb-8"
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
			<div
				className={`flex ${flex} gap-8 md:gap-12 items-center mx-auto ${getContentWidthClass()}`}
			>
				{mainImage && (
					<div className="md:w-1/2">
						<img
							src={mainImage}
							alt={imageAlt}
							className="w-full h-auto rounded-lg shadow-lg"
						/>
					</div>
				)}

				<div className={`md:w-1/2 ${getTextAlignClass()}`}>
					{title && (
						<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
					)}
					{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

					{content && (
						<div
							className="prose max-w-none mb-8"
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
			<div className="mx-auto max-w-full">
				{(title || subtitle) && (
					<div
						className={`${getTextAlignClass()} mx-auto ${getContentWidthClass()} mb-8`}
					>
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
					<div
						className={`${getTextAlignClass()} mx-auto ${getContentWidthClass()}`}
					>
						<div
							className="prose max-w-none mb-8"
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
		<div className="mx-auto max-w-7xl">
			<div
				className={`${getTextAlignClass()} mx-auto ${getContentWidthClass()} mb-12`}
			>
				{title && (
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
				)}
				{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

				{content && (
					<div
						className="prose max-w-none"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				)}
			</div>

			{cards.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{cards.map((card, index) => (
						<div
							key={index}
							className="bg-white rounded-lg shadow-lg overflow-hidden flex flex-col h-full"
						>
							{card.image && (
								<div className="h-48 overflow-hidden">
									<img
										src={card.image}
										alt={card.title || `Card ${index + 1}`}
										className="w-full h-full object-cover"
									/>
								</div>
							)}
							<div className="p-6 flex-grow">
								{card.title && (
									<h3 className="text-xl font-bold mb-3">{card.title}</h3>
								)}
								{card.content && (
									<div
										className="prose"
										dangerouslySetInnerHTML={{ __html: card.content }}
									/>
								)}
							</div>
							{card.link && (
								<div className="px-6 pb-6">
									<a
										href={card.link}
										className="text-blue-600 font-medium hover:underline"
									>
										Learn More →
									</a>
								</div>
							)}
						</div>
					))}
				</div>
			)}

			<div className={`${getTextAlignClass()} mt-12`}>{renderButtons()}</div>
		</div>
	);

	// Team members layout
	const renderTeamLayout = () => (
		<div className="mx-auto max-w-7xl">
			<div
				className={`${getTextAlignClass()} mx-auto ${getContentWidthClass()} mb-12`}
			>
				{title && (
					<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
				)}
				{subtitle && <h3 className="text-xl md:text-2xl mb-6">{subtitle}</h3>}

				{content && (
					<div
						className="prose max-w-none"
						dangerouslySetInnerHTML={{ __html: content }}
					/>
				)}
			</div>

			{teamMembers.length > 0 && (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
					{teamMembers.map((member, index) => (
						<div
							key={index}
							className="bg-white rounded-lg shadow-lg overflow-hidden"
						>
							{member.image && (
								<div className="aspect-square overflow-hidden">
									<img
										src={member.image}
										alt={member.name}
										className="w-full h-full object-cover"
									/>
								</div>
							)}
							<div className="p-6">
								<h3 className="text-xl font-bold">{member.name}</h3>
								{member.role && (
									<p className="text-gray-600 mb-3">{member.role}</p>
								)}
								{member.bio && (
									<div
										className="prose text-sm"
										dangerouslySetInnerHTML={{ __html: member.bio }}
									/>
								)}
							</div>
						</div>
					))}
				</div>
			)}

			<div className={`${getTextAlignClass()} mt-12`}>{renderButtons()}</div>
		</div>
	);

	// Helper to render buttons
	const renderButtons = () => {
		if (buttons.length === 0) return null;

		return (
			<div className="flex flex-wrap gap-4 mt-6 justify-center md:justify-start">
				{buttons.map((button, index) => (
					<a
						key={index}
						href={button.url}
						className={getButtonClass(button.variant)}
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
			className={`${getPaddingClass()} px-4`}
			style={sectionStyle}
		>
			{renderLayout()}
		</section>
	);
};

export default CustomSection;
