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

const presetSet = new Set<string>(STUDIO_MOTION_PRESETS);

export function isStudioMotionPreset(value: unknown): value is StudioMotionPreset {
  return typeof value === 'string' && presetSet.has(value);
}

export function normalizeStudioMotionPreset(value: unknown, fallback: StudioMotionPreset = 'fadeSettle'): StudioMotionPreset {
  return isStudioMotionPreset(value) ? value : fallback;
}
