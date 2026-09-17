import type { DesignSystem } from '@shared/project';
import type { StudioDesignTokens, StudioIndustryPreset } from './types';
import { getDesignTokensForIndustry, tokensToCssVariables } from './designTokens';

export interface CompiledTokensResult {
  tokens: StudioDesignTokens;
  cssVariables: React.CSSProperties;
  isFallback: boolean;
  fallbackReasons: string[];
}

export interface CompileTokenOptions {
  industry?: string;
  themeMode?: 'dark' | 'light' | 'auto';
  density?: 'spacious' | 'balanced' | 'compact' | 'editorial';
  direction?: 'ltr' | 'rtl';
}

/**
 * Compiles the approved Project.designSystem into canonical Studio CSS design tokens.
 * Adheres strictly to the anti-slop rules:
 * - NEVER invents generic purple fallbacks.
 * - Respects approved colors, typography, spacing, radius, and density.
 * - Flags fallback state explicitly when design system is incomplete.
 */
export function compileProjectDesignTokens(
  designSystem?: Partial<DesignSystem>,
  options: CompileTokenOptions = {}
): CompiledTokensResult {
  const mode = options.themeMode === 'light' ? 'light' : 'dark';
  const fallbackReasons: string[] = [];

  const hasArtDirection = Boolean(designSystem?.artDirection && designSystem.artDirection.trim() !== '');
  const hasColors = Boolean(designSystem?.colors && designSystem.colors.length >= 2);
  const hasTypography = Boolean(designSystem?.typography && designSystem.typography.trim() !== '');

  if (!hasArtDirection) {
    fallbackReasons.push('Art direction has not been formally approved yet.');
  }
  if (!hasColors) {
    fallbackReasons.push('Color palette has not been specified (requires at least 2 brand tones).');
  }
  if (!hasTypography) {
    fallbackReasons.push('Typography pairing direction has not been defined.');
  }

  // If critical parts are missing, fall back to approved industry preset with diagnostic state
  if (fallbackReasons.length > 0) {
    const industryKey: StudioIndustryPreset =
      options.industry && ['beauty_wellness', 'contractor', 'interior_design', 'professional_services', 'shopify_beauty', 'fitness', 'real_estate', 'atelier_luxury'].includes(options.industry)
        ? (options.industry as StudioIndustryPreset)
        : 'atelier_luxury';

    const fallbackTokens = getDesignTokensForIndustry(industryKey, mode);
    return {
      tokens: fallbackTokens,
      cssVariables: tokensToCssVariables(fallbackTokens),
      isFallback: true,
      fallbackReasons,
    };
  }

  // Safe compiler from approved design system
  const colors = designSystem?.colors || [];
  const primaryTone = colors[0] || (mode === 'dark' ? '#121214' : '#faf9f6');
  const secondaryTone = colors[1] || (mode === 'dark' ? '#18181b' : '#ffffff');
  const accentTone = colors[2] || colors[0] || (mode === 'dark' ? '#d4af37' : '#96742a');

  // Detect whether primaryTone is dark or light
  const isPrimaryDark = isColorDark(primaryTone);
  const isLightMode = mode === 'light';

  let bg: string;
  let surface: string;
  let text: string;
  let muted: string;
  let border: string;

  if (isLightMode) {
    bg = isPrimaryDark ? '#f8f7f4' : primaryTone;
    surface = isPrimaryDark ? '#ffffff' : secondaryTone;
    text = '#18181b';
    muted = '#6e6c68';
    border = '#e4e2dc';
  } else {
    bg = isPrimaryDark ? primaryTone : '#121214';
    surface = isPrimaryDark ? secondaryTone : '#19191c';
    text = '#f4f4f2';
    muted = '#8e8e93';
    border = '#27272a';
  }

  // Typography resolution
  const typoString = (designSystem?.typography || '').toLowerCase();
  let fontDisplay = '"Playfair Display", "Cinzel", Georgia, serif';
  if (typoString.includes('cinzel')) {
    fontDisplay = '"Cinzel", "Playfair Display", serif';
  } else if (typoString.includes('cormorant') || typoString.includes('garamond')) {
    fontDisplay = '"Cormorant Garamond", Georgia, serif';
  } else if (typoString.includes('chakra') || typoString.includes('barlow')) {
    fontDisplay = '"Chakra Petch", "Barlow", sans-serif';
  } else if (typoString.includes('syne') || typoString.includes('clash')) {
    fontDisplay = '"Syne", system-ui, sans-serif';
  } else if (typoString.includes('serif')) {
    fontDisplay = '"Playfair Display", Georgia, serif';
  } else {
    fontDisplay = '"Plus Jakarta Sans", -apple-system, system-ui, sans-serif';
  }

  const fontBody = '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif';

  // Radius resolution
  let radius = '2px';
  const radiusVal = (designSystem?.borderRadius || '').toLowerCase();
  if (radiusVal.includes('0') || radiusVal.includes('sharp') || radiusVal.includes('none')) {
    radius = '0px';
  } else if (radiusVal.includes('4px') || radiusVal.includes('subtle') || radiusVal.includes('small')) {
    radius = '4px';
  } else if (radiusVal.includes('8px') || radiusVal.includes('10px') || radiusVal.includes('rounded')) {
    radius = '8px';
  } else if (radiusVal.includes('12px') || radiusVal.includes('16px')) {
    radius = '12px';
  } else if (radiusVal.includes('2px') || radiusVal.includes('minimal')) {
    radius = '2px';
  }

  // Spacing & Density
  const density = options.density || designSystem?.density || 'editorial';
  let sectionSpace = '104px';
  if (density === 'spacious') sectionSpace = '128px';
  else if (density === 'editorial') sectionSpace = '112px';
  else if (density === 'balanced') sectionSpace = '96px';
  else if (density === 'compact') sectionSpace = '72px';

  const tokens: StudioDesignTokens = {
    bg,
    surface,
    text,
    muted,
    accent: accentTone,
    border,
    fontDisplay,
    fontBody,
    radius,
    sectionSpace,
    contentWidth: '1240px',
  };

  return {
    tokens,
    cssVariables: tokensToCssVariables(tokens),
    isFallback: false,
    fallbackReasons: [],
  };
}

function isColorDark(hex: string): boolean {
  if (!hex || !hex.startsWith('#') || hex.length < 7) return true;
  try {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness < 128;
  } catch {
    return true;
  }
}
