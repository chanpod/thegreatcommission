import { useRef } from "react";
import {
	AnimatedHeroHeading,
	AnimatedHeroSubheading,
	AnimatedHeroContent,
} from "./AnimatedHero";
import { motion } from "framer-motion";

interface HeroProps {
	imageUrl: string;
	headline: string;
	subheadline: string;
	imagePosition?: "center" | "top" | "bottom" | "left" | "right";
	imageObjectFit?: "cover" | "contain" | "fill";
	overlayOpacity?: number;
	height?: string;
}

export default function Hero({
	imageUrl,
	headline,
	subheadline,
	imagePosition = "center",
	imageObjectFit = "cover",
	overlayOpacity = 0.5,
	height = "500px",
}: HeroProps) {
	const heroRef = useRef<HTMLDivElement>(null);

	// Create object-position string based on imagePosition
	const getObjectPosition = () => {
		switch (imagePosition) {
			case "top":
				return "center top";
			case "bottom":
				return "center bottom";
			case "left":
				return "left center";
			case "right":
				return "right center";
			default:
				return "center center";
		}
	};

	// Image animation variants
	const imageVariants = {
		hidden: { scale: 1.1, opacity: 0.8 },
		visible: {
			scale: 1,
			opacity: 1,
			transition: {
				duration: 1.5,
				ease: "easeOut",
			},
		},
	};

	// Overlay animation variants
	const overlayVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				duration: 1.2,
			},
		},
	};

	return (
		<div ref={heroRef} className="relative overflow-hidden" style={{ height }}>
			<motion.div
				className="absolute inset-0"
				initial="hidden"
				animate="visible"
				variants={imageVariants}
			>
				<img
					src={imageUrl}
					alt="Church banner"
					className="w-full h-full"
					style={{
						objectFit: imageObjectFit,
						objectPosition: getObjectPosition(),
					}}
				/>
			</motion.div>
			<motion.div
				className="absolute inset-0 flex flex-col justify-center items-center text-white px-4 text-center"
				style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }}
				initial="hidden"
				animate="visible"
				variants={overlayVariants}
			>
				<AnimatedHeroContent>
					<AnimatedHeroHeading className="text-4xl md:text-5xl font-bold mb-4 max-w-3xl relative z-10">
						{headline}
					</AnimatedHeroHeading>
					<AnimatedHeroSubheading className="text-xl md:text-2xl max-w-2xl relative z-10">
						{subheadline}
					</AnimatedHeroSubheading>
				</AnimatedHeroContent>
			</motion.div>
		</div>
	);
}
