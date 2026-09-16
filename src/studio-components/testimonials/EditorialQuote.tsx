import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface EditorialQuoteContent {
  quote?: string;
  authorName?: string;
  authorRole?: string;
  commissionType?: string;
}

export function EditorialQuote(props: StudioComponentProps<EditorialQuoteContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        quote: '״סטודיו נתנאל לא רק תכננו את ביתנו — הם לימדו אותנו כיצד להביט באור, בחלל ובשקט. הדיוק שבו נוהל הפרויקט הוא חסר תקדים בישראל.״',
        authorName: 'ד״ר מיכל ואורן רוטשילד',
        authorRole: 'בעלי וילה במצפה רמון',
        commissionType: 'מסירת אוקטובר 2025 • מגורי יוקרה',
      }
    : {
        quote: '“Natanel Studio did not merely design our private estate—they transformed how our family experiences spatial calm, natural illumination, and raw materiality. Their execution discipline is unmatched.”',
        authorName: 'Evelyn & Julian Vance',
        authorRole: 'Private Estate Commissioners',
        commissionType: 'Commission Delivered October MMXXV',
      };

  const isProduction = props.contentMode === 'production';
  const hasCustomQuote = Boolean(props.content?.quote);

  if (isProduction && !hasCustomQuote) {
    return (
      <StudioComponentWrapper {...props}>
        <section
          style={{
            width: '100%',
            padding: '24px',
            borderBottom: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-bg)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--studio-muted)', fontStyle: 'italic' }}>
            {isRtl
              ? 'ציטוט לקוח מאומת יוצג לאחר אישור פרסום או העלאת חוות דעת לפרויקט.'
              : 'Verified commissioner quote will be displayed once client clearance is supplied in project content.'}
          </p>
        </section>
      </StudioComponentWrapper>
    );
  }

  const content = { ...defaultContent, ...props.content };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            maxWidth: '860px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '28px',
          }}
        >
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--studio-accent)',
              fontWeight: 700,
            }}
          >
            {content.commissionType}
          </span>

          <blockquote
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: 'clamp(24px, 3.2vw, 38px)',
              lineHeight: 1.35,
              fontWeight: 500,
              color: 'var(--studio-text)',
              margin: 0,
            }}
          >
            {content.quote}
          </blockquote>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <strong style={{ fontSize: '15px', color: 'var(--studio-text)' }}>
              {content.authorName}
            </strong>
            <span style={{ fontSize: '13px', color: 'var(--studio-muted)' }}>
              {content.authorRole}
            </span>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
