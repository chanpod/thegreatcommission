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
	animateGradient?: boolean;
}

export default function About({
	title,
	subtitle,
	content,
	backgroundGradient = "linear-gradient(135deg, #00a99d 0%, #89d7bb 100%)",
	buttons = [],
	logoImage,
	imagePosition = "left",
	animateGradient = true,
}: AboutProps) {
	return (
		<section
			className={`py-16 px-4 md:px-8 overflow-hidden relative ${animateGradient ? 'animated-gradient' : ''}`}
			style={{ background: backgroundGradient, backgroundSize: animateGradient ? '400% 400%' : 'auto' }}
		>
			{/* Enhanced decorative wavy lines with animation */}
			<div className="absolute top-0 right-0 w-full h-full opacity-25 pointer-events-none overflow-hidden">
				<svg className="absolute -top-20 -right-20 w-[120%] h-[120%]" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
					<path
						fill="none"
						stroke="white"
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
						stroke="white"
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
						stroke="white"
						strokeWidth="3"
						strokeOpacity="0.2"
						strokeDasharray="20,15"
						strokeLinecap="round"
						d="M-100,440 C100,490 300,300 500,400 S700,600 900,500"
						transform="rotate(-15)"
						className="animate-dash"
						style={{ animationDuration: '30s' }}
					/>
				</svg>
			</div>
			<div className="absolute bottom-0 left-0 w-full h-full opacity-25 pointer-events-none overflow-hidden">
				<svg className="absolute -bottom-20 -left-20 w-[120%] h-[120%]" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
					<path
						fill="none"
						stroke="white"
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
						stroke="white"
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
						stroke="white"
						strokeWidth="3"
						strokeOpacity="0.2"
						strokeDasharray="20,15"
						strokeLinecap="round"
						d="M-100,440 C100,490 300,300 500,400 S700,600 900,500"
						transform="rotate(15)"
						className="animate-dash-reverse"
						style={{ animationDuration: '25s' }}
					/>
				</svg>
			</div>

			{/* Floating particles */}
			<div className="absolute inset-0 pointer-events-none">
				{[...Array(8)].map((_, i) => (
					<div
						key={i}
						className="absolute rounded-full bg-white opacity-30 float-animation"
						style={{
							width: `${Math.random() * 10 + 5}px`,
							height: `${Math.random() * 10 + 5}px`,
							left: `${Math.random() * 100}%`,
							top: `${Math.random() * 100}%`,
							animationDuration: `${Math.random() * 10 + 10}s`,
							animationDelay: `${Math.random() * 5}s`
						}}
					/>
				))}
			</div>

			<div className="container mx-auto relative z-10">
				<div
					className={`flex flex-col ${imagePosition === "right" ? "md:flex-row" : "md:flex-row-reverse"} items-center gap-8 md:gap-12`}
				>
					{logoImage && (
						<div className="md:w-1/3 flex-shrink-0">
							<div className="relative w-full max-w-[300px] mx-auto">
								<img
									src={logoImage}
									alt="Church logo or graphic"
									className="w-full object-contain relative z-10 reveal-on-scroll"
								/>
								{/* Enhanced decorative circle behind the image */}
								<div className="absolute inset-0 bg-white bg-opacity-10 rounded-full transform -translate-x-4 translate-y-4 z-0 pulse-animation"></div>
								{/* Additional decorative ring */}
								<div className="absolute inset-0 border-4 border-white border-opacity-20 rounded-full transform translate-x-4 -translate-y-4 z-0 spin-slow"></div>
							</div>
						</div>
					)}

					<div className={`md:w-${logoImage ? "2/3" : "full"} text-white`}>
						{title && (
							<h2 className="text-4xl md:text-5xl font-light mb-4 tracking-wider reveal-on-scroll">
								{title}
							</h2>
						)}

						{subtitle && (
							<h3 className="text-2xl md:text-3xl font-semibold mb-4 reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
								{subtitle}
							</h3>
						)}

						<div
							className="prose prose-lg prose-invert max-w-none mb-8 reveal-on-scroll"
							style={{ transitionDelay: '200ms' }}
							dangerouslySetInnerHTML={{ __html: content }}
						/>

						{buttons.length > 0 && (
							<div className="flex flex-wrap gap-4 mt-4 reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
								{buttons.map((button, index) => (
									<a
										key={index}
										href={button.url}
										className="inline-block px-6 py-3 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-full transition-all duration-200 hover:scale-105"
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
