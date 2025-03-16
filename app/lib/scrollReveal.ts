/**
 * A simple utility to handle scroll reveal animations
 * This can be imported and used in any component that needs scroll animations
 */

// Animation variants for different elements
export type AnimationVariant =
	| "fade-up"
	| "fade-down"
	| "fade-left"
	| "fade-right"
	| "zoom-in"
	| "zoom-out"
	| "flip-up"
	| "flip-down";

export function setupScrollReveal() {
	// Only run in browser environment
	if (typeof window === "undefined") return () => {};

	// Create IntersectionObserver to handle reveal animations
	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				// Add revealed class when element enters viewport
				if (entry.isIntersecting) {
					entry.target.classList.add("revealed");

					// Optional: Stop observing after element is revealed
					// This is useful for one-time animations
					// observer.unobserve(entry.target);
				} else {
					// Optional: Remove class when element leaves viewport
					// Comment this out if you want the animation to happen only once
					// entry.target.classList.remove('revealed');
				}
			});
		},
		{
			threshold: 0.1, // Trigger when at least 10% of the element is visible
			rootMargin: "0px 0px -100px 0px", // Slightly before element enters viewport
		},
	);

	// Function to handle initial reveal for elements already in viewport on load
	const handleInitialReveal = () => {
		const revealElements = document.querySelectorAll(".reveal-on-scroll");

		revealElements.forEach((element) => {
			const rect = element.getBoundingClientRect();
			const isInViewport = rect.top < window.innerHeight && rect.bottom >= 0;

			if (isInViewport) {
				// Add a small delay to elements visible on load to create a nice sequence
				setTimeout(() => {
					element.classList.add("revealed");
				}, 100);
			}

			// Start observing the element for scroll reveals
			observer.observe(element);
		});
	};

	// Run initial reveal after a small delay to ensure DOM is ready
	// This is important for SSR where elements might be hydrated after JS loads
	setTimeout(handleInitialReveal, 100);

	// Add event listener for scroll to handle any new elements
	window.addEventListener(
		"scroll",
		() => {
			const newRevealElements = document.querySelectorAll(
				".reveal-on-scroll:not(.observed)",
			);
			newRevealElements.forEach((element) => {
				element.classList.add("observed");
				observer.observe(element);
			});
		},
		{ passive: true },
	);

	// Return cleanup function
	return () => {
		const revealElements = document.querySelectorAll(".reveal-on-scroll");
		revealElements.forEach((element) => {
			observer.unobserve(element);
		});
	};
}

/**
 * Apply the reveal-on-scroll class to elements
 * This can be used in useEffect to add the class to elements after component mount
 */
export function applyScrollRevealClass(
	selector: string,
	staggerDelay = 0,
	variant: AnimationVariant = "fade-up",
) {
	// Only run in browser environment
	if (typeof window === "undefined") return;

	const elements = document.querySelectorAll(selector);

	elements.forEach((element, index) => {
		// Add the base reveal class
		element.classList.add("reveal-on-scroll");

		// Add the animation variant class
		element.classList.add(`reveal-${variant}`);

		// Add staggered delay if specified
		if (staggerDelay > 0) {
			(element as HTMLElement).style.transitionDelay =
				`${index * staggerDelay}ms`;
		}
	});
}
