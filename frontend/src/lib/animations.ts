import type { Variants } from 'framer-motion';

export const cardHover: Variants = {
  rest: { scale: 1, boxShadow: '0 0 0 0 transparent' },
  hover: { scale: 1.02, boxShadow: '0 8px 30px rgba(0,230,118,0.1)' },
};

export const fadeIn: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
};

export const pageTransition: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 15 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const slideInRight: Variants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const buttonHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.05 },
  tap: { scale: 0.97 },
};
