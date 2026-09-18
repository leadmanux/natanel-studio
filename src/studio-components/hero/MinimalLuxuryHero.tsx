import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface MinimalLuxuryHeroContent {
  monogram?: string;
  season?: string;
  kicker?: string;
  headline?: string;
  subheadline?: string;
  description?: string;
  ctaText?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
}

export function MinimalLuxuryHero(props: StudioComponentProps<MinimalLuxuryHeroContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        monogram: 'N',
        season: 'קולקציית קיץ 2026 • פריטים בודדים',
        headline: 'אלגנטיות של דממה ודיוק מוחלט.',
        subheadline: 'כל יצירה מעוצבת בקפידה מחומרי גלם טהורים ובלתי מתפשרים, במלאכת יד של בעלי מלאכה מסורתיים.',
        ctaText: 'תיאום פגישה אישית באטלייה',
      }
    : {
        monogram: 'N',
        season: 'SUMMER MMXXVI • HIGH COMMISSION',
        headline: 'Quiet Splendor. Absolute Reduction.',
        subheadline: 'Every silhouette is sculpted from raw uncompromised matter, meticulously assembled by venerable European master artisans.',
        ctaText: 'Reserve Private Consultation',
      };

  const isProduction = props.contentMode === 'production';
  const content = isProduction
    ? {
        monogram: props.content?.monogram || '',
        season: props.content?.season || props.content?.kicker || '',
        headline: props.content?.headline || '',
        subheadline: props.content?.subheadline || props.content?.description || '',
        ctaText: props.content?.ctaText || props.content?.primaryCtaLabel || '',
        primaryCtaHref: props.content?.primaryCtaHref || '',
      }
    : { ...defaultContent, ...props.content, primaryCtaHref: props.content?.primaryCtaHref || '#appointment' };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
          }}
        >
          {/* Subtle Atelier Crest */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: '1px solid var(--studio-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontFamily: 'var(--studio-font-display)',
              color: 'var(--studio-accent)',
            }}
          >
            {content.monogram}
          </div>

          <span
            style={{
              fontSize: '11px',
              letterSpacing: isRtl ? '0.04em' : '0.2em',
              textTransform: 'uppercase',
              color: 'var(--studio-muted)',
              fontFamily: 'monospace',
            }}
          >
            {content.season}
          </span>

          <h1
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: 'clamp(34px, 5vw, 64px)',
              lineHeight: 1.12,
              fontWeight: 500,
              color: 'var(--studio-text)',
              margin: 0,
              letterSpacing: isRtl ? '0' : '-0.02em',
            }}
          >
            {content.headline}
          </h1>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.7,
              color: 'var(--studio-muted)',
              maxWidth: '580px',
              margin: 0,
            }}
          >
            {content.subheadline}
          </p>

          <div style={{ paddingTop: '16px' }}>
            <a
              href={content.primaryCtaHref || '#appointment'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 32px',
                minHeight: '48px',
                backgroundColor: 'var(--studio-surface)',
                border: '1px solid var(--studio-border)',
                borderRadius: 'var(--studio-radius)',
                color: 'var(--studio-text)',
                fontSize: '12.5px',
                fontWeight: 600,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                textDecoration: 'none',
              }}
            >
              {content.ctaText}
            </a>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
