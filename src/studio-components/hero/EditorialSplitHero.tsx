import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export interface EditorialHeroContent {
  eyebrow?: string;
  headline?: string;
  description?: string;
  primaryCta?: string;
  secondaryCta?: string;
  proofBadge?: string;
}

export function EditorialSplitHero(props: StudioComponentProps<EditorialHeroContent>) {
  const isRtl = props.direction === 'rtl';
  const isProduction = props.contentMode === 'production';

  const defaultContent: Required<EditorialHeroContent> = isRtl
    ? {
        eyebrow: 'סטודיו לארכיטקטורה וחללים יוקרתיים',
        headline: 'דיוק אדריכלי המעצב מציאות חדשה.',
        description: 'אנו מתכננים ויוצרים חללי מגורים ומסחר מוקפדים המשלבים חומריות טבעית, אור מבוקר ופרופורציות שקטות.',
        primaryCta: 'לצפייה בפרויקטים נבחרים',
        secondaryCta: 'שיחת היכרות מקצועית',
        proofBadge: 'מעל 140 פרויקטים בביצוע מדויק',
      }
    : {
        eyebrow: 'Architectural Atelier & Design Practice',
        headline: 'Restrained Architecture for Discerning Spaces.',
        description: 'We orchestrate residential and cultural spaces rooted in material honesty, natural illumination, and enduring spatial proportion.',
        primaryCta: 'Explore Selected Works',
        secondaryCta: 'Schedule Commission',
        proofBadge: 'Over 140 rigorously executed masterworks',
      };

  const content: EditorialHeroContent = isProduction
    ? {
        eyebrow: props.content?.eyebrow || '',
        headline: props.content?.headline || '',
        description: props.content?.description || '',
        primaryCta: props.content?.primaryCta || '',
        secondaryCta: props.content?.secondaryCta || '',
        proofBadge: props.content?.proofBadge || '',
      }
    : { ...defaultContent, ...props.content };

  const heroImage =
    props.assets?.hero?.url ||
    props.assets?.hero_primary?.url ||
    (isProduction
      ? ''
      : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80');

  if (isProduction && (!content.headline || !heroImage)) {
    return (
      <StudioComponentWrapper {...props}>
        <section
          style={{
            width: '100%',
            padding: '48px 24px',
            borderBottom: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-bg)',
            color: 'var(--studio-muted)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px' }}>
            {isRtl
              ? 'תוכן ותמונת Hero מאומתים נדרשים לפני פרסום המקטע.'
              : 'Verified hero content and an approved hero asset are required before this section can be published.'}
          </p>
        </section>
      </StudioComponentWrapper>
    );
  }

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
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'center',
            gap: '56px',
          }}
          className="grid-split"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {content.eyebrow && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    letterSpacing: isRtl ? '0.04em' : '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--studio-accent)',
                  }}
                >
                  {content.eyebrow}
                </span>
              </div>
            )}

            <h1
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(32px, 4.2vw, 54px)',
                lineHeight: 1.15,
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
                letterSpacing: isRtl ? '0' : '-0.02em',
              }}
            >
              {content.headline}
            </h1>

            {content.description && (
              <p
                style={{
                  fontSize: '16px',
                  lineHeight: 1.65,
                  color: 'var(--studio-muted)',
                  margin: 0,
                  maxWidth: '520px',
                }}
              >
                {content.description}
              </p>
            )}

            {(content.primaryCta || content.secondaryCta) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
                {content.primaryCta && (
                  <a
                    href="#contact"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '14px 28px',
                      minHeight: '48px',
                      backgroundColor: 'var(--studio-text)',
                      color: 'var(--studio-bg)',
                      borderRadius: 'var(--studio-radius)',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      textDecoration: 'none',
                      letterSpacing: '0.02em',
                    }}
                  >
                    <span>{content.primaryCta}</span>
                    {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                  </a>
                )}

                {content.secondaryCta && (
                  <a
                    href="#more"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '14px 24px',
                      minHeight: '48px',
                      backgroundColor: 'transparent',
                      border: '1px solid var(--studio-border)',
                      color: 'var(--studio-text)',
                      borderRadius: 'var(--studio-radius)',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      textDecoration: 'none',
                    }}
                  >
                    {content.secondaryCta}
                  </a>
                )}
              </div>
            )}

            {content.proofBadge && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '12px', fontSize: '12px', color: 'var(--studio-muted)' }}>
                <ShieldCheck size={16} color="var(--studio-accent)" />
                <span>{content.proofBadge}</span>
              </div>
            )}
          </div>

          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: '100%',
                aspectRatio: '16/11',
                borderRadius: 'var(--studio-radius)',
                overflow: 'hidden',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-surface)',
              }}
            >
              <img
                src={heroImage}
                alt={content.headline || ''}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
