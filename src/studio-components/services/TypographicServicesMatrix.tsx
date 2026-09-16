import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowUpRight, ArrowUpLeft } from 'lucide-react';

export interface ServiceTier {
  id: string;
  name: string;
  tagline: string;
  deliverables: string[];
  timeline: string;
}

export interface ServicesMatrixContent {
  sectionEyebrow?: string;
  sectionTitle?: string;
  services?: ServiceTier[];
}

export function TypographicServicesMatrix(props: StudioComponentProps<ServicesMatrixContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultServices: ServiceTier[] = isRtl
    ? [
        {
          id: '01',
          name: 'תכנון אדריכלי מלא',
          tagline: 'תכנון קונספטואלי ומפורט למבני מגורים יוקרתיים ומתחמי מסחר ייחודיים.',
          deliverables: ['סט תכניות עבודה מלא', 'הדמיות פוטוריאליסטיות 3D', 'כתב כמויות וליווי מכרזים'],
          timeline: '8-14 שבועות',
        },
        {
          id: '02',
          name: 'עיצוב פנים וחלל טוטאלי',
          tagline: 'הלבשת חלל הוליסטית, תכנון נגרות אומן והתאמת תאורה וחומריות ברמה הגבוהה ביותר.',
          deliverables: ['תכניות נגרות ופרטי קצה', 'בחירת חומרים וליווי ספקים', 'פיקוח עליון באתר'],
          timeline: '6-10 שבועות',
        },
        {
          id: '03',
          name: 'פיקוח וניהול פרויקט',
          tagline: 'ניהול הנדסי הדוק המבטיח דיוק מוחלט, עמידה בתקציב וסנכרון מלא בין כל אנשי המקצוע.',
          deliverables: ['ניהול תקציב ולו״ז קשיח', 'בקרת איכות יומית', 'מסירה ואישור בדק סופי'],
          timeline: 'צמוד לפרויקט',
        },
      ]
    : [
        {
          id: '01',
          name: 'Architectural Master Planning',
          tagline: 'Comprehensive structural orchestration for bespoke residences and cultural pavilions.',
          deliverables: ['Exhaustive construction sets', 'Photorealistic material renderings', 'Quantity surveyor documentation'],
          timeline: '8–14 Weeks',
        },
        {
          id: '02',
          name: 'Spatial Interior Architecture',
          tagline: 'Harmonious volume proportioning, bespoke joinery detailing, and acoustic illumination design.',
          deliverables: ['Custom artisan millwork details', 'Quarry-direct stone selection', 'On-site atelier supervision'],
          timeline: '6–10 Weeks',
        },
        {
          id: '03',
          name: 'Execution & Quality Assurance',
          tagline: 'Rigorous site administration enforcing millimeter tolerance and contractual velocity.',
          deliverables: ['Master schedule auditing', 'Daily craftsmanship reports', 'Final commissioning sign-off'],
          timeline: 'Full Project Lifecycle',
        },
      ];

  const eyebrow = props.content?.sectionEyebrow || (isRtl ? 'תחומי התמחות' : 'DISCIPLINES & PRACTICE');
  const title = props.content?.sectionTitle || (isRtl ? 'שירותי תכנון, עיצוב וניהול ברף הגבוה ביותר' : 'Rigorous Architectural Disciplines');
  const services = props.content?.services || defaultServices;

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '48px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: isRtl ? '0.04em' : '0.14em',
                color: 'var(--studio-accent)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {eyebrow}
            </span>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
              }}
            >
              {title}
            </h2>
          </div>

          {/* Matrix Rows */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {services.map((srv, idx) => (
              <div
                key={srv.id}
                style={{
                  padding: '36px 0',
                  borderTop: '1px solid var(--studio-border)',
                  borderBottom: idx === services.length - 1 ? '1px solid var(--studio-border)' : 'none',
                  display: 'grid',
                  gridTemplateColumns: '80px 1.4fr 1.6fr auto',
                  alignItems: 'baseline',
                  gap: '32px',
                }}
                className="grid-split"
              >
                {/* Number */}
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    color: 'var(--studio-accent)',
                    fontWeight: 700,
                  }}
                >
                  {srv.id}
                </span>

                {/* Name & Timeline */}
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--studio-font-display)',
                      fontSize: '22px',
                      fontWeight: 600,
                      color: 'var(--studio-text)',
                      margin: '0 0 6px 0',
                    }}
                  >
                    {srv.name}
                  </h3>
                  <span style={{ fontSize: '12px', color: 'var(--studio-muted)', fontFamily: 'monospace' }}>
                    {srv.timeline}
                  </span>
                </div>

                {/* Tagline & Deliverables */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <p style={{ fontSize: '15px', color: 'var(--studio-muted)', lineHeight: 1.6, margin: 0 }}>
                    {srv.tagline}
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {srv.deliverables.map((d, dIdx) => (
                      <span
                        key={dIdx}
                        style={{
                          fontSize: '11.5px',
                          padding: '4px 10px',
                          borderRadius: 'var(--studio-radius)',
                          backgroundColor: 'var(--studio-surface)',
                          border: '1px solid var(--studio-border)',
                          color: 'var(--studio-text)',
                        }}
                      >
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action arrow */}
                <div style={{ display: 'flex', justifyContent: isRtl ? 'flex-start' : 'flex-end' }}>
                  <a
                    href="#contact"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40px',
                      height: '40px',
                      borderRadius: 'var(--studio-radius)',
                      border: '1px solid var(--studio-border)',
                      color: 'var(--studio-text)',
                      textDecoration: 'none',
                    }}
                  >
                    {isRtl ? <ArrowUpLeft size={16} /> : <ArrowUpRight size={16} />}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
