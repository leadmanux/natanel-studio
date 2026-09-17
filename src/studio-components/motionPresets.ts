import type { StudioMotionPreset } from './types';

export interface MotionConfig {
  initial: Record<string, any>;
  animate: Record<string, any>;
  transition: Record<string, any>;
}

export function getMotionVariants(
  preset: StudioMotionPreset = 'none',
  direction: 'ltr' | 'rtl' = 'ltr'
): { initial: Record<string, any>; animate: Record<string, any> } {
  const isRtl = direction === 'rtl';

  switch (preset) {
    case 'none':
      return {
        initial: { opacity: 1 },
        animate: { opacity: 1, transition: { duration: 0 } },
      };

    case 'fadeReveal':
      return {
        initial: { opacity: 0, y: 16 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
        },
      };

    case 'clipReveal':
      return {
        initial: { opacity: 0, clipPath: 'inset(8% 0% 0% 0%)' },
        animate: {
          opacity: 1,
          clipPath: 'inset(0% 0% 0% 0%)',
          transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
        },
      };

    case 'textStagger':
      return {
        initial: { opacity: 0, y: 12 },
        animate: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.45, ease: [0.2, 0.8, 0.2, 1] },
        },
      };

    case 'imageScaleOnScroll':
      return {
        initial: { scale: 1.05, opacity: 0.95 },
        animate: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.8, ease: [0.25, 1, 0.5, 1] },
        },
      };

    case 'stackedCards':
      return {
        initial: { opacity: 0, y: 24, scale: 0.98 },
        animate: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, ease: [0.2, 0.8, 0.2, 1] },
        },
      };

    case 'fadeSettle':
    default:
      return {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: { duration: 0.4, ease: 'easeOut' },
        },
      };
  }
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

  const variants = getMotionVariants(preset, direction);
  const { transition, ...animateProperties } = variants.animate;

  return {
    initial: variants.initial,
    animate: animateProperties,
    transition: transition || { duration: 0.45 },
  };
}
