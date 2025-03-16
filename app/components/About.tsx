import { useRef } from "react";
import AnimatedElement, { AnimatedGroup } from "./AnimatedElement";
import { motion } from "framer-motion";

export interface AboutProps {
	title?: string;
	subtitle?: string;
	content: string;
	backgroundGradient?: string;
	buttons?: Array<{ label: string; url: string }>;
	logoImage?: string;
	imagePosition?: "left" | "right";
	animateGradient?: boolean;
}

export default function About({
	title,
	subtitle,
	content,
	backgroundGradient,
	buttons = [],
	logoImage,
	imagePosition = "left",
	animateGradient = true,
}: AboutProps) {
	const sectionRef = useRef<HTMLElement>(null);

	// Animation variants for decorative elements
	const decorativeCircleVariants = {
		hidden: { scale: 0.8, opacity: 0 },
		visible: {
			scale: 1,
			opacity: 0.1,
			transition: {
				duration: 1.2,
				ease: "easeOut",
			},
		},
	};

	const decorativeRingVariants = {
		hidden: { scale: 0.8, opacity: 0 },
		visible: {
			scale: 1,
			opacity: 0.2,
			transition: {
				duration: 1.2,
				delay: 0.3,
				ease: "easeOut",
			},
		},
	};

	return (
		<section
			ref={sectionRef}
			className={`py-16 px-4 md:px-8 overflow-hidden relative ${animateGradient ? "animated-gradient" : ""}`}
			style={{
				background:
					backgroundGradient ||
					"linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-accent) 50%, var(--theme-secondary) 100%)",
				backgroundSize: animateGradient ? "400% 400%" : "auto",
			}}
		>
			{/* Enhanced decorative wavy lines with animation */}
			<div className="absolute top-0 left-0 w-full overflow-hidden">
				<svg
					className="relative block w-full h-[50px]"
					preserveAspectRatio="none"
					viewBox="0 0 1200 120"
					xmlns="http://www.w3.org/2000/svg"
					aria-hidden="true"
				>
					<motion.path
						d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
						fill="rgba(255, 255, 255, 0.1)"
						initial={{ opacity: 0, y: -20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.2 }}
					/>
				</svg>
			</div>

			<div className="container mx-auto relative z-10">
				{/* Main title at the top */}
				{title && (
					<AnimatedElement variant="fade-down" className="text-center">
						<h2 className="text-4xl md:text-5xl font-light mb-12 tracking-wider text-white">
							{title}
						</h2>
					</AnimatedElement>
				)}

				<div className="flex flex-col md:flex-row items-center gap-8 md:gap-16">
					{/* Left side - Logo/Image with decorative elements */}
					{logoImage && (
						<div className="md:w-1/3 flex-shrink-0">
							<div className="relative w-full max-w-[300px] mx-auto">
								<AnimatedElement variant="zoom-in" delay={0.2}>
									<img
										src={logoImage}
										alt="Church logo or graphic"
										className="w-full object-contain relative z-10"
									/>
								</AnimatedElement>
								{/* Enhanced decorative circle behind the image */}
								<motion.div
									className="absolute inset-0 bg-white bg-opacity-10 rounded-full transform -translate-x-4 translate-y-4 z-0 pulse-animation"
									variants={decorativeCircleVariants}
									initial="hidden"
									animate="visible"
								/>
								{/* Additional decorative ring */}
								<motion.div
									className="absolute inset-0 border-4 border-white border-opacity-20 rounded-full transform translate-x-4 -translate-y-4 z-0 spin-slow"
									variants={decorativeRingVariants}
									initial="hidden"
									animate="visible"
								/>
							</div>
						</div>
					)}

					{/* Right side - Content */}
					<div className={`md:w-${logoImage ? "2/3" : "full"} text-white`}>
						{/* Subtitle as a heading */}
						{subtitle && (
							<AnimatedElement variant="fade-up" delay={0.1}>
								<h3 className="text-2xl md:text-3xl font-semibold mb-6">
									{subtitle}
								</h3>
							</AnimatedElement>
						)}

						{/* Content with rich text */}
						<AnimatedElement variant="fade-up" delay={0.2}>
							<div
								className="prose text-2xl prose-lg prose-invert max-w-none mb-8"
								// Using dangerouslySetInnerHTML is necessary here for rich text content
								// The content is sanitized by the RichTextEditor component before saving
								dangerouslySetInnerHTML={{ __html: content }}
							/>
						</AnimatedElement>

						{/* Buttons in a row */}
						{buttons.length > 0 && (
							<AnimatedGroup
								variant="fade-up"
								staggerDelay={0.1}
								className="flex flex-wrap gap-4 mt-8 justify-start buttons-container"
							>
								{buttons.map((button, index) => (
									<a
										key={`button-${button.label}-${index}`}
										href={button.url}
										className="inline-block px-6 py-3 bg-white text-primary font-medium rounded-full transition-all duration-200 hover:bg-opacity-90 hover:scale-105"
									>
										{button.label}
									</a>
								))}
							</AnimatedGroup>
						)}
					</div>
				</div>
			</div>
		</section>
	);
}
