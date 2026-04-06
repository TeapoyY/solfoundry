import type { Variants } from 'framer-motion';

/** Card hover animation variants */
export const cardHover: Variants = {
  rest: { scale: 1, y: 0, boxShadow: '0 0 0 0 transparent' },
  hover: { scale: 1.02, y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.4)' },
};

/** Page transition wrapper variants */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease: 'easeIn' } },
};

/** Stagger container for grid animations */
export const staggerContainer: Variants = {
  initial: {},
  animate: { transition: { staggerChildren: 0.06 } },
};

/** Stagger item variants */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/** Simple fade-in animation */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.3, ease: 'easeIn' } },
};
