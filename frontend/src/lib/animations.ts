import type { Variants } from 'framer-motion';

/** Card hover animation — scale + glow on hover */
export const cardHover: Variants = {
  rest: { scale: 1, boxShadow: '0 0 0 0 transparent' },
  hover: {
    scale: 1.02,
    boxShadow: '0 0 20px rgba(0, 230, 118, 0.15)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
};

/** Standard fade-in animation */
export const fadeIn: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};

/** Stagger children animation */
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.07 },
  },
};

/** Fade + slide up for list items */
export const listItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
};

/** Alias for listItem — used as staggerItem */
export const staggerItem: Variants = listItem;

/** Page transition — fade + slight upward slide */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: 'easeIn' } },
};

/** Button hover animation */
export const buttonHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.04, transition: { duration: 0.15, ease: 'easeOut' } },
  tap: { scale: 0.97, transition: { duration: 0.1 } },
};

/** Slide in from right */
export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
};
