import { motion } from "framer-motion";

interface AnimatedHeroProps {
	children: React.ReactNode;
	className?: string;
}

// Hero text animation variants
const heroHeadingVariants = {
	hidden: {
		opacity: 0,
		y: 20,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.8,
			ease: [0.22, 1, 0.36, 1],
		},
	},
};

const heroSubheadingVariants = {
	hidden: {
		opacity: 0,
		y: 20,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.8,
			delay: 0.2,
			ease: [0.22, 1, 0.36, 1],
		},
	},
};

export function AnimatedHeroHeading({
	children,
	className = "",
}: AnimatedHeroProps) {
	return (
		<motion.h2
			initial="hidden"
			animate="visible"
			variants={heroHeadingVariants}
			className={className}
		>
			{children}
		</motion.h2>
	);
}

export function AnimatedHeroSubheading({
	children,
	className = "",
}: AnimatedHeroProps) {
	return (
		<motion.p
			initial="hidden"
			animate="visible"
			variants={heroSubheadingVariants}
			className={className}
		>
			{children}
		</motion.p>
	);
}

// For animating the entire hero section with a reveal effect
export function AnimatedHeroContent({
	children,
	className = "",
}: AnimatedHeroProps) {
	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.2,
				delayChildren: 0.1,
			},
		},
	};

	return (
		<motion.div
			initial="hidden"
			animate="visible"
			variants={containerVariants}
			className={className}
		>
			{children}
		</motion.div>
	);
}
