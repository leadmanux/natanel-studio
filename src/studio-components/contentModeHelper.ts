import type { StudioComponentProps } from './types';

/**
 * Checks if the component is being rendered in strict 'production' mode.
 */
export function isProductionMode(props: StudioComponentProps<any>): boolean {
  return props.contentMode === 'production';
}

export interface ComponentProductionSchema<T extends Record<string, any>> {
  /**
   * Fields that represent factual claims, business details, pricing, social proof,
   * testimonials, ratings, warranties, or specific client identity.
   * In production mode, these are NEVER populated from demo fallbacks.
   */
  claimFields: (keyof T)[];

  /**
   * Fields that are required for production rendering.
   * If any of these are missing in production mode, they are returned in `missingRequired`.
   */
  requiredFields?: (keyof T)[];

  /**
   * Non-claim structural defaults (e.g. standard button labels, structural settings).
   */
  structuralDefaults?: Partial<T>;
}

export interface ResolvedContentResult<T> {
  content: T;
  isProduction: boolean;
  missingRequired: (keyof T)[];
}

/**
 * Resolves component content with guaranteed production safety:
 * - In 'preview' mode, delivers rich demo content with photography and proof.
 * - In 'production' mode, NEVER falls back to fabricated business names, fake prices,
 *   fake ratings, fake reviews, fake licenses, fake warranties, fake metrics, fake addresses,
 *   or demo Unsplash images.
 */
export function resolveComponentContent<T extends Record<string, any>>(
  props: StudioComponentProps<T>,
  previewDefaults: T,
  schema: ComponentProductionSchema<T>
): ResolvedContentResult<T> {
  const isProduction = props.contentMode === 'production';

  if (!isProduction) {
    return {
      content: { ...previewDefaults, ...(props.content || {}) },
      isProduction: false,
      missingRequired: [],
    };
  }

  // Strict production resolution
  const provided = props.content || ({} as Partial<T>);
  const resolved = { ...(schema.structuralDefaults || {}) } as Partial<T>;

  // Copy provided fields that are non-empty
  for (const [key, val] of Object.entries(provided)) {
    if (val !== undefined && val !== null && val !== '') {
      resolved[key as keyof T] = val as any;
    }
  }

  // Identify missing required fields
  const missingRequired: (keyof T)[] = [];
  if (schema.requiredFields) {
    for (const req of schema.requiredFields) {
      const val = resolved[req];
      if (val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0)) {
        missingRequired.push(req);
      }
    }
  }

  return {
    content: resolved as T,
    isProduction: true,
    missingRequired,
  };
}

/**
 * Safely resolves asset URLs.
 * In production mode, NEVER uses demo Unsplash URLs pretending to be client assets.
 */
export function resolveProductionAsset(
  providedAssetUrl: string | undefined | null,
  fallbackPreviewUrl: string,
  isProduction: boolean
): string | null {
  if (providedAssetUrl && providedAssetUrl.trim() !== '') {
    return providedAssetUrl;
  }
  if (isProduction) {
    return null;
  }
  return fallbackPreviewUrl;
}

/**
 * Backward-compatible helper with explicit schema support.
 */
export function resolveContentMode<T extends Record<string, any>>(
  props: StudioComponentProps<T>,
  fallbackDemo: T,
  schema?: ComponentProductionSchema<T>
): T {
  const effectiveSchema: ComponentProductionSchema<T> = schema || {
    claimFields: Object.keys(fallbackDemo) as (keyof T)[],
  };
  return resolveComponentContent(props, fallbackDemo, effectiveSchema).content;
}
