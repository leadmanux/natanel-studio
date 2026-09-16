import type { ReactNode } from 'react';

export type StudioMotionPreset =
  | 'none'
  | 'fadeReveal'
  | 'clipReveal'
  | 'textStagger'
  | 'imageScaleOnScroll'
  | 'parallaxImage'
  | 'stickyNarrative'
  | 'horizontalScroll'
  | 'marquee'
  | 'stackedCards'
  | 'sectionPin'
  | 'fadeSettle';

export type StudioIndustryPreset =
  | 'beauty_wellness'
  | 'contractor'
  | 'interior_design'
  | 'professional_services'
  | 'shopify_beauty'
  | 'fitness'
  | 'real_estate'
  | 'atelier_luxury';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ComponentDirection = 'ltr' | 'rtl';
export type PreviewMode = 'desktop' | 'tablet' | 'mobile';
export type IndustryPresetKey = StudioIndustryPreset | string;

export interface StudioDesignTokens {
  bg: string;
  surface: string;
  text: string;
  muted: string;
  accent: string;
  border: string;
  fontDisplay: string;
  fontBody: string;
  radius: string;
  sectionSpace: string;
  contentWidth: string;
}

export interface StudioAssetSlot {
  url: string;
  alt?: string;
  aspectRatio?: string;
}

export interface StudioComponentProps<TContent = Record<string, any>> {
  content?: TContent;
  contentMode?: 'preview' | 'production';
  assets?: Record<string, StudioAssetSlot>;
  designTokens?: StudioDesignTokens;
  direction?: 'ltr' | 'rtl';
  motionPreset?: StudioMotionPreset;
  previewMode?: 'desktop' | 'tablet' | 'mobile';
  themeMode?: 'light' | 'dark' | 'auto';
  industryPreset?: StudioIndustryPreset | string;
  motionEnabled?: boolean;
  onAction?: (actionId: string, payload?: any) => void;
  className?: string;
  children?: ReactNode;
}
