/**
 * Studio Motion Presets
 * Governs motion styles across Natanel Studio components, preventing arbitrary AI strings.
 */

export const STUDIO_MOTION_PRESETS = [
  'none',
  'fadeReveal',
  'clipReveal',
  'textStagger',
  'imageScaleOnScroll',
  'stackedCards',
  'fadeSettle',
] as const;

export type StudioMotionPreset = (typeof STUDIO_MOTION_PRESETS)[number];

export const MOTION_PRESET_METADATA: Record<
  StudioMotionPreset,
  { label: string; description: string; performanceCost: 'low' | 'medium' | 'high' }
> = {
  none: {
    label: 'None (Reduced Motion)',
    description: 'Immediate rendering with zero movement for strict accessibility.',
    performanceCost: 'low',
  },
  fadeSettle: {
    label: 'Fade Settle (Balanced)',
    description: 'Subtle vertical translation and opacity fade that settles cleanly.',
    performanceCost: 'low',
  },
  fadeReveal: {
    label: 'Fade Reveal (Subtle)',
    description: 'Classic restrained opacity fade into viewport.',
    performanceCost: 'low',
  },
  clipReveal: {
    label: 'Clip Reveal (Architectural)',
    description: 'Precision curtain clip path unveiling monumental content.',
    performanceCost: 'medium',
  },
  textStagger: {
    label: 'Text Stagger (Editorial)',
    description: 'Sequential entry of headlines and editorial paragraphs.',
    performanceCost: 'medium',
  },
  imageScaleOnScroll: {
    label: 'Image Scale on Scroll (Immersive)',
    description: 'Restrained volumetric parallax scaling for primary imagery.',
    performanceCost: 'medium',
  },
  stackedCards: {
    label: 'Stacked Cards (Structured)',
    description: 'Layered elevation transition for distinct content units.',
    performanceCost: 'high',
  },
};

/**
 * Normalizes any motion input or AI string into an approved Studio motion preset.
 * Rejects hallucinations and unsupported strings safely.
 */
export function normalizeStudioMotionPreset(input?: string | null): StudioMotionPreset {
  if (!input) return 'fadeSettle';
  const clean = input.trim();

  // 1. Direct match
  if (STUDIO_MOTION_PRESETS.includes(clean as StudioMotionPreset)) {
    return clean as StudioMotionPreset;
  }

  // 2. Heuristic normalization for common AI outputs
  const lower = clean.toLowerCase();
  if (lower === 'none' || lower === 'disabled' || lower === 'static' || lower === 'off') {
    return 'none';
  }
  if (lower.includes('clip') || lower.includes('curtain') || lower.includes('mask')) {
    return 'clipReveal';
  }
  if (lower.includes('stagger') || lower.includes('sequential') || lower.includes('typography')) {
    return 'textStagger';
  }
  if (lower.includes('scale') || lower.includes('zoom') || lower.includes('parallax')) {
    return 'imageScaleOnScroll';
  }
  if (lower.includes('stack') || lower.includes('card') || lower.includes('layer')) {
    return 'stackedCards';
  }
  if (lower.includes('settle') || lower.includes('slide')) {
    return 'fadeSettle';
  }
  if (lower.includes('fade') || lower.includes('reveal') || lower.includes('soft')) {
    return 'fadeReveal';
  }

  // Safe default
  return 'fadeSettle';
}
