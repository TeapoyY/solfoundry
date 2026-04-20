import { Variants } from 'framer-motion';

/** Fade-in animation for page content */
export const fadeIn: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/** Page transition animation */
export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

/** Card hover animation (used on BountyCard) */
export const cardHover: Variants = {
  rest: { scale: 1, borderColor: 'var(--border)' },
  hover: { scale: 1.01, borderColor: 'var(--border-hover)', transition: { duration: 0.15 } },
};
