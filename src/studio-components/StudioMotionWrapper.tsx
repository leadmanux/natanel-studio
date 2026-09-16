import React, { useEffect, useState, type ReactNode } from 'react';
import { motion } from 'motion/react';
import type { StudioMotionPreset } from './types';
import { getMotionVariants } from './motionPresets';

export interface StudioMotionWrapperProps {
  children: ReactNode;
  preset?: StudioMotionPreset;
  enabled?: boolean;
  direction?: 'ltr' | 'rtl';
  className?: string;
  style?: React.CSSProperties;
  as?: 'div' | 'section' | 'article' | 'header' | 'footer';
}

/**
 * Hook to detect @media (prefers-reduced-motion: reduce)
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReduced(mq.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    if (mq.addEventListener) {
      mq.addEventListener('change', listener);
      return () => mq.removeEventListener('change', listener);
    }
  }, []);

  return prefersReduced;
}

/**
 * Reusable motion wrapper honoring the 12 studio motion presets,
 * sandbox Motion On/Off toggle, and system prefers-reduced-motion.
 *
 * When reduced motion or disabled:
 * - Never hides content waiting for animation
 * - Disables non-essential transforms, parallax, marquee loops
 * - Keeps opacity at 1 with zero duration
 */
export function StudioMotionWrapper({
  children,
  preset = 'fadeReveal',
  enabled = true,
  direction = 'ltr',
  className,
  style,
  as = 'div',
}: StudioMotionWrapperProps) {
  const prefersReduced = usePrefersReducedMotion();
  const shouldAnimate = enabled && !prefersReduced && preset !== 'none';

  if (!shouldAnimate) {
    const Component = as;
    return (
      <Component
        className={className}
        style={{
          ...style,
          opacity: 1,
          transform: 'none',
          transition: 'none',
        }}
      >
        {children}
      </Component>
    );
  }

  const variants = getMotionVariants(preset, direction);
  const MotionComponent = motion[as] as any;

  return (
    <MotionComponent
      initial="initial"
      animate="animate"
      variants={variants}
      className={className}
      style={style}
    >
      {children}
    </MotionComponent>
  );
}
