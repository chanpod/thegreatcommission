import { motion, useInView, type Variant } from "framer-motion";
import { useRef } from "react";

export type AnimationVariant =
	| "fade-up"
	| "fade-down"
	| "fade-left"
	| "fade-right"
	| "zoom-in"
	| "zoom-out"
	| "flip-up"
	| "flip-down";

interface AnimatedElementProps {
	children: React.ReactNode;
	variant?: AnimationVariant;
	delay?: number;
	duration?: number;
	className?: string;
	once?: boolean;
	threshold?: number;
}

// Animation variants
const variants = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: {
			duration: 0.6,
		},
	},
};

// Specific transform properties for each variant
const getTransformVariant = (
	variant: AnimationVariant,
): { hidden: Variant; visible: Variant } => {
	switch (variant) {
		case "fade-up":
			return {
				hidden: { y: 40 },
				visible: { y: 0 },
			};
		case "fade-down":
			return {
				hidden: { y: -40 },
				visible: { y: 0 },
			};
		case "fade-left":
			return {
				hidden: { x: -40 },
				visible: { x: 0 },
			};
		case "fade-right":
			return {
				hidden: { x: 40 },
				visible: { x: 0 },
			};
		case "zoom-in":
			return {
				hidden: { scale: 0.9 },
				visible: { scale: 1 },
			};
		case "zoom-out":
			return {
				hidden: { scale: 1.1 },
				visible: { scale: 1 },
			};
		case "flip-up":
			return {
				hidden: {
					rotateX: 25,
					transformPerspective: 800,
					transformOrigin: "center bottom",
				},
				visible: {
					rotateX: 0,
					transformPerspective: 800,
					transformOrigin: "center bottom",
				},
			};
		case "flip-down":
			return {
				hidden: {
					rotateX: -25,
					transformPerspective: 800,
					transformOrigin: "center top",
				},
				visible: {
					rotateX: 0,
					transformPerspective: 800,
					transformOrigin: "center top",
				},
			};
		default:
			return {
				hidden: { y: 40 },
				visible: { y: 0 },
			};
	}
};

export default function AnimatedElement({
	children,
	variant = "fade-up",
	delay = 0,
	duration = 0.6,
	className = "",
	once = true,
	threshold = 0.1,
}: AnimatedElementProps) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once, amount: threshold });

	// Get transform variant
	const transformVariant = getTransformVariant(variant);

	// Combine base variants with transform variants
	const combinedVariants = {
		hidden: {
			...variants.hidden,
			...transformVariant.hidden,
		},
		visible: {
			...variants.visible,
			...transformVariant.visible,
			transition: {
				duration,
				delay,
			},
		},
	};

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			variants={combinedVariants}
			className={className}
		>
			{children}
		</motion.div>
	);
}

// For animating a group of elements with staggered delays
export function AnimatedGroup({
	children,
	variant = "fade-up",
	staggerDelay = 0.1,
	duration = 0.6,
	className = "",
	once = true,
	threshold = 0.1,
}: Omit<AnimatedElementProps, "delay"> & { staggerDelay?: number }) {
	const ref = useRef(null);
	const isInView = useInView(ref, { once, amount: threshold });

	// Get transform variant
	const transformVariant = getTransformVariant(variant);

	// Container variant
	const containerVariants = {
		hidden: { opacity: 1 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: staggerDelay,
			},
		},
	};

	// Child variant
	const childVariants = {
		hidden: {
			...variants.hidden,
			...transformVariant.hidden,
		},
		visible: {
			...variants.visible,
			...transformVariant.visible,
			transition: {
				duration,
			},
		},
	};

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={isInView ? "visible" : "hidden"}
			variants={containerVariants}
			className={className}
		>
			{Array.isArray(children)
				? children.map((child, index) => (
						<motion.div key={index} variants={childVariants}>
							{child}
						</motion.div>
					))
				: children}
		</motion.div>
	);
}
