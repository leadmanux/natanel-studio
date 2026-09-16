import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowDown, CornerDownLeft, CornerDownRight } from 'lucide-react';

export interface AsymmetricHeroContent {
  year?: string;
  leadStatement?: string;
  thesisQuote?: string;
  ctaText?: string;
}

export function AsymmetricTypographyHero(props: StudioComponentProps<AsymmetricHeroContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        year: 'סטודיו 2026',
        leadStatement: 'עיצוב אינו קישוט.\nעיצוב הוא שפה של כוח שקט.',
        thesisQuote: 'אנו פועלים מתוך תפיסה צורנית רדיקלית המנקה כל רעש מיותר, עד שנשארת רק האמת המבנית של המותג.',
        ctaText: 'גלה את הפרקטיקה',
      }
    : {
        year: 'STUDIO MMXXVI',
        leadStatement: 'Form is not decoration.\nForm is sovereign clarity.',
        thesisQuote: 'We practice an uncompromising reductionism that strips away all artificial visual noise until only structural truth remains.',
        ctaText: 'Discover The Practice',
      };

  const content = { ...defaultContent, ...props.content };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '40px',
          }}
        >
          {/* Top Asymmetric Header Tag */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '11px',
                letterSpacing: '0.15em',
                color: 'var(--studio-accent)',
                textTransform: 'uppercase',
              }}
            >
              {content.year}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--studio-muted)', fontFamily: 'monospace' }}>
              NATANEL STUDIO NO. 01
            </span>
          </div>

          {/* Monumental Headline */}
          <h1
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: 'clamp(36px, 5.5vw, 76px)',
              lineHeight: 1.08,
              fontWeight: 700,
              color: 'var(--studio-text)',
              margin: 0,
              whiteSpace: 'pre-line',
              letterSpacing: isRtl ? '0' : '-0.03em',
            }}
          >
            {content.leadStatement}
          </h1>

          {/* Bottom Split Narrative */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              alignItems: 'baseline',
              gap: '48px',
              paddingTop: '24px',
              borderTop: '1px solid var(--studio-border)',
            }}
            className="grid-2col"
          >
            <p
              style={{
                fontSize: '16px',
                lineHeight: 1.7,
                color: 'var(--studio-muted)',
                margin: 0,
              }}
            >
              {content.thesisQuote}
            </p>

            <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end', alignItems: 'center', gap: '16px' }}>
              <a
                href="#manifesto"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '12px 24px',
                  minHeight: '44px',
                  backgroundColor: 'var(--studio-surface)',
                  border: '1px solid var(--studio-border)',
                  borderRadius: 'var(--studio-radius)',
                  color: 'var(--studio-text)',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>{content.ctaText}</span>
                {isRtl ? <CornerDownLeft size={15} /> : <CornerDownRight size={15} />}
              </a>
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
