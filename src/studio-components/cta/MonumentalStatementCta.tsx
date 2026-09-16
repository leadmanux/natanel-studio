import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export interface MonumentalCtaContent {
  monogram?: string;
  statement?: string;
  subtext?: string;
  primaryCta?: string;
  secondaryCta?: string;
}

export function MonumentalStatementCta(props: StudioComponentProps<MonumentalCtaContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        monogram: 'NATANEL STUDIO',
        statement: 'מוכנים ליצור את מרחב החיים המדויק שלכם?',
        subtext: 'אנו מקבלים מספר מוגבל של פרויקטים בשנה, על מנת להבטיח מעורבות מלאה ובלתי מתפשרת בכל שלב ופרט.',
        primaryCta: 'תיאום שיחת אפיון ראשונית',
        secondaryCta: 'שאלות ותשובות נפוצות',
      }
    : {
        monogram: 'NATANEL STUDIO',
        statement: 'Ready to build architecture that endures for generations?',
        subtext: 'We accept a strictly limited registry of commissions annually to preserve total partner-level immersion across every millimeter.',
        primaryCta: 'Initiate Commission Dialogue',
        secondaryCta: 'Review Working Protocols',
      };

  const content = { ...defaultContent, ...props.content };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'calc(var(--studio-section-space) * 1.2) 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-surface)',
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
            gap: '24px',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'var(--studio-accent)',
              fontWeight: 700,
            }}
          >
            {content.monogram}
          </span>

          <h2
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: 'clamp(32px, 4.5vw, 56px)',
              lineHeight: 1.15,
              fontWeight: 600,
              color: 'var(--studio-text)',
              margin: 0,
            }}
          >
            {content.statement}
          </h2>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.65,
              color: 'var(--studio-muted)',
              maxWidth: '560px',
              margin: 0,
            }}
          >
            {content.subtext}
          </p>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              paddingTop: '16px',
            }}
          >
            <a
              href="#contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '14px 32px',
                minHeight: '48px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'var(--studio-accent)',
                color: '#111',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <span>{content.primaryCta}</span>
              {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
            </a>

            <a
              href="#faqs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '14px 24px',
                minHeight: '48px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'transparent',
                border: '1px solid var(--studio-border)',
                color: 'var(--studio-text)',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              {content.secondaryCta}
            </a>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
