interface AboutSectionButton {
	label: string;
	url: string;
}

export interface AboutProps {
	title: string;
	subtitle?: string;
	content: string;
	backgroundGradient?: string;
	buttons?: AboutSectionButton[];
	logoImage?: string;
	imagePosition?: "left" | "right";
}

export default function About({
	title,
	subtitle,
	content,
	backgroundGradient = "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
	buttons = [],
	logoImage,
	imagePosition = "left",
}: AboutProps) {
	return (
		<section
			className="py-16 px-4 md:px-8 overflow-hidden relative"
			style={{ background: backgroundGradient }}
		>
			<div className="container mx-auto">
				<div
					className={`flex flex-col ${imagePosition === "right" ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-12`}
				>
					{logoImage && (
						<div className="md:w-1/3 flex-shrink-0">
							<div className="relative w-full max-w-[300px] mx-auto">
								<img
									src={logoImage}
									alt="Church logo or graphic"
									className="w-full object-contain"
								/>
							</div>
						</div>
					)}

					<div className={`md:w-${logoImage ? "2/3" : "full"} text-white`}>
						{title && (
							<h2 className="text-4xl md:text-5xl font-light mb-4 tracking-wider">
								{title}
							</h2>
						)}

						{subtitle && (
							<h3 className="text-2xl md:text-3xl font-semibold mb-4">
								{subtitle}
							</h3>
						)}

						<div
							className="prose prose-lg prose-invert max-w-none mb-8"
							dangerouslySetInnerHTML={{ __html: content }}
						/>

						{buttons.length > 0 && (
							<div className="flex flex-wrap gap-4 mt-4">
								{buttons.map((button, index) => (
									<a
										key={index}
										href={button.url}
										className="inline-block px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all duration-200"
									>
										{button.label}
									</a>
								))}
							</div>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
