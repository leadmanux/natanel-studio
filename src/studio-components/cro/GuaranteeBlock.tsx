import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ShieldCheck, Check, Sparkles } from 'lucide-react';

export interface GuaranteeContent {
  badge?: string;
  headline?: string;
  description?: string;
  points?: string[];
}

export function GuaranteeBlock(props: StudioComponentProps<GuaranteeContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        badge: 'התחייבות איכות בלתי מתפשרת',
        headline: '100% שקט נפשי. התחייבות חוזית מלאה לשביעות רצון.',
        description: 'אנו מאמינים בתוצאות מדידות ואיכות ביצוע עליונה. אם שלב התכנון אינו עומד בדיוק בציפיותיכם, נבצע התאמות ללא הגבלה עד לאישור מושלם.',
        points: [
          'התחייבות לעמידה בלוח זמנים קשיח עם פיצוי מוסכם',
          'אחריות חומרית מלאה ל-10 שנים על כל עבודות הביצוע',
          'תמחור סגור ושקוף ללא תוספות או הפתעות בשטח',
        ],
      }
    : {
        badge: 'Contractual Standard Guarantee',
        headline: 'Absolute Peace of Mind. 100% Quality Surety.',
        description: 'We stake our reputation on uncompromising execution. If any architectural milestone fails to satisfy the agreed design brief, we iterate unconditionally until total consensus is reached.',
        points: [
          'Fixed-schedule guarantee backed by contractual liquidated timeline surety',
          '10-year comprehensive structural & material craftsmanship warranty',
          'Guaranteed transparent price architecture with zero unapproved surprises',
        ],
      };

  const isProduction = props.contentMode === 'production';
  const hasCustomGuarantee = Boolean(props.content?.headline || (props.content?.points && props.content.points.length > 0));

  if (isProduction && !hasCustomGuarantee) {
    return (
      <StudioComponentWrapper {...props}>
        <section
          style={{
            width: '100%',
            padding: '28px 24px',
            borderBottom: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-surface)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--studio-muted)', fontStyle: 'italic' }}>
            {isRtl
              ? 'פרטי תעודת האחריות וההתחייבות החוזית יפורסמו בהתאם למסמכי הפרויקט המאושרים.'
              : 'Contractual guarantee terms and warranty clauses will be rendered once verified project terms are supplied.'}
          </p>
        </section>
      </StudioComponentWrapper>
    );
  }

  const content: GuaranteeContent = {
    badge: props.content?.badge || (isProduction ? undefined : defaultContent.badge),
    headline: props.content?.headline || defaultContent.headline,
    description: props.content?.description || (isProduction ? undefined : defaultContent.description),
    points: props.content?.points || (isProduction ? [] : defaultContent.points),
  };

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
            maxWidth: '920px',
            margin: '0 auto',
            padding: '40px',
            borderRadius: 'var(--studio-radius)',
            border: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-surface)',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1px solid var(--studio-accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--studio-accent)',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--studio-accent)',
                  display: 'block',
                }}
              >
                {content.badge}
              </span>
              <h3
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: '22px',
                  fontWeight: 600,
                  color: 'var(--studio-text)',
                  margin: 0,
                }}
              >
                {content.headline}
              </h3>
            </div>
          </div>

          <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--studio-muted)', margin: 0 }}>
            {content.description}
          </p>

          {/* Guarantee Checklist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', paddingTop: '8px' }}>
            {content.points?.map((pt, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--studio-bg)',
                    border: '1px solid var(--studio-accent)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--studio-accent)',
                    flexShrink: 0,
                  }}
                >
                  <Check size={12} />
                </div>
                <span style={{ fontSize: '14px', color: 'var(--studio-text)', fontWeight: 500 }}>
                  {pt}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
