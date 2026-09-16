import type { StudioMotionPreset } from './types';

export interface MotionConfig {
  initial: Record<string, any>;
  animate: Record<string, any>;
  transition: Record<string, any>;
}

export function getMotionConfig(
  preset: StudioMotionPreset = 'none',
  enabled: boolean = true,
  direction: 'ltr' | 'rtl' = 'ltr'
): MotionConfig {
  if (!enabled || preset === 'none') {
    return {
      initial: { opacity: 1 },
      animate: { opacity: 1 },
      transition: { duration: 0 },
    };
  }

  const isRtl = direction === 'rtl';

  switch (preset) {
    case 'fadeReveal':
      return {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
      };

    case 'fadeSettle':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.4, ease: 'easeOut' },
      };

    case 'clipReveal':
      return {
        initial: { opacity: 0, clipPath: 'inset(10% 0% 0% 0%)' },
        animate: { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' },
        transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
      };

    case 'textStagger':
      return {
        initial: { opacity: 0, y: 12 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
      };

    case 'imageScaleOnScroll':
      return {
        initial: { scale: 1.05, opacity: 0.92 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.9, ease: [0.25, 1, 0.5, 1] },
      };

    case 'horizontalScroll':
      return {
        initial: { x: isRtl ? -24 : 24, opacity: 0 },
        animate: { x: 0, opacity: 1 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
      };

    case 'parallaxImage':
      return {
        initial: { y: 20, opacity: 0.95 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.8, ease: 'easeOut' },
      };

    case 'stackedCards':
      return {
        initial: { opacity: 0, y: 30, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
      };

    case 'marquee':
    case 'stickyNarrative':
    case 'sectionPin':
    default:
      return {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.45, ease: 'easeOut' },
      };
  }
}
