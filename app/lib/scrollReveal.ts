/**
 * A simple utility to handle scroll reveal animations
 * This can be imported and used in any component that needs scroll animations
 */

export function setupScrollReveal() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  const revealElements = document.querySelectorAll('.reveal-on-scroll');
  
  const revealOnScroll = () => {
    for (let i = 0; i < revealElements.length; i++) {
      const element = revealElements[i];
      const elementTop = element.getBoundingClientRect().top;
      const elementVisible = 150; // How many pixels from the viewport edge to start revealing
      
      if (elementTop < window.innerHeight - elementVisible) {
        element.classList.add('revealed');
      } else {
        element.classList.remove('revealed');
      }
    }
  };

  // Add event listener
  window.addEventListener('scroll', revealOnScroll);
  
  // Run once on load
  revealOnScroll();

  // Return cleanup function
  return () => {
    window.removeEventListener('scroll', revealOnScroll);
  };
}

/**
 * Apply the reveal-on-scroll class to elements
 * This can be used in useEffect to add the class to elements after component mount
 */
export function applyScrollRevealClass(selector: string, staggerDelay = 0) {
  // Only run in browser environment
  if (typeof window === 'undefined') return;

  const elements = document.querySelectorAll(selector);
  
  elements.forEach((element, index) => {
    element.classList.add('reveal-on-scroll');
    
    // Add staggered delay if specified
    if (staggerDelay > 0) {
      (element as HTMLElement).style.transitionDelay = `${index * staggerDelay}ms`;
    }
  });
} 