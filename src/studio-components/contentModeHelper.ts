import type { StudioComponentProps } from './types';

/**
 * Checks if the component is being rendered in strict 'production' mode.
 */
export function isProductionMode(props: StudioComponentProps<any>): boolean {
  return props.contentMode === 'production';
}

/**
 * Resolves content based on mode.
 * In 'preview' mode (default), uses rich demonstration mock content.
 * In 'production' mode, strictly uses props.content and removes fabricated
 * claims such as fake review counts, fake license strings, and unverified guarantees.
 */
export function resolveContentMode<T extends Record<string, any>>(
  props: StudioComponentProps<T>,
  fallbackDemo: T
): T {
  if (props.contentMode !== 'production') {
    return { ...fallbackDemo, ...(props.content || {}) };
  }

  // Production Mode: Only use what is explicitly provided in props.content.
  // Never silently invent fake ratings, licenses, review counts, or warranties.
  const provided = props.content || ({} as Partial<T>);
  const productionBase: Partial<T> = {};

  // For each key in fallback demo, copy ONLY non-fabricated structural defaults (like generic titles)
  // but strip fabricated social proof numbers, licenses, and specific claims
  for (const [key, value] of Object.entries(fallbackDemo)) {
    const isFabricatedClaim =
      key.includes('rating') ||
      key.includes('reviewCount') ||
      key.includes('license') ||
      key.includes('guarantee') ||
      key.includes('metrics') ||
      key.includes('warranty');

    if (!isFabricatedClaim) {
      productionBase[key as keyof T] = value;
    }
  }

  return {
    ...productionBase,
    ...provided,
  } as T;
}
