import React from 'react';
import type { StudioComponentProps } from './types';
import { getDesignTokensForIndustry, tokensToCssVariables } from './designTokens';

export function StudioComponentWrapper({
  designTokens,
  industryPreset = 'atelier_luxury',
  themeMode = 'dark',
  direction = 'ltr',
  previewMode = 'desktop',
  className = '',
  children,
}: StudioComponentProps) {
  const mode = themeMode === 'light' ? 'light' : 'dark';
  const effectiveTokens = designTokens || getDesignTokensForIndustry(industryPreset, mode);
  const cssVars = tokensToCssVariables(effectiveTokens);

  return (
    <div
      className={`studio-component-root ${className}`}
      dir={direction}
      data-direction={direction}
      data-preview-mode={previewMode}
      data-theme={mode}
      style={{
        ...cssVars,
        backgroundColor: 'var(--studio-bg)',
        color: 'var(--studio-text)',
        fontFamily: 'var(--studio-font-body)',
        direction,
        transition: 'background-color 0.25s ease, color 0.25s ease',
      }}
    >
      {children}
    </div>
  );
}
