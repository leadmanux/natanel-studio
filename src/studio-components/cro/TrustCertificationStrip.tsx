import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ShieldCheck, Award, Lock, CheckCircle2 } from 'lucide-react';

export interface TrustItem {
  title: string;
  desc: string;
}

export interface TrustStripContent {
  items?: TrustItem[];
}

export function TrustCertificationStrip(props: StudioComponentProps<TrustStripContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultItems = isRtl
    ? [
        { title: 'קבלן רשום ומוסמך', desc: 'רישיון משרד הבינוי מס׳ 31294' },
        { title: 'ביטוח אחריות מקצועית', desc: 'כיסוי מקיף מלא עד ₪10,000,000' },
        { title: 'אחריות שלד וגמר', desc: '10 שנות אחריות בכתב לכל פרויקט' },
        { title: 'נאמנות פיננסית בטוחה', desc: 'תשלומים צמודי התקדמות ואבני דרך' },
      ]
    : [
        { title: 'Licensed Master Practice', desc: 'Institutional architectural registration' },
        { title: 'Full Liability Protection', desc: 'Comprehensive $10M master indemnity' },
        { title: '10-Year Craft Warranty', desc: 'Contractually bound structural guarantee' },
        { title: 'Milestone Escrow Security', desc: 'Funds released strictly upon phase approval' },
      ];

  const isProduction = props.contentMode === 'production';
  const hasCustomItems = Boolean(props.content?.items && props.content.items.length > 0);

  if (isProduction && !hasCustomItems) {
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
              ? 'אישורים מקצועיים, רישיונות וביטוחים רשמיים יוצגו לאחר הזנת פרטי הרישוי המאומתים.'
              : 'Official licenses, trade certifications, and insurance credentials will be displayed once verified records are supplied.'}
          </p>
        </section>
      </StudioComponentWrapper>
    );
  }

  const items = props.content?.items || defaultItems;
  const icons = [ShieldCheck, Award, CheckCircle2, Lock];

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: '36px 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '24px',
          }}
          className="grid-4col"
        >
          {items.map((item, idx) => {
            const Icon = icons[idx % icons.length];
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderRadius: 'var(--studio-radius)',
                    backgroundColor: 'var(--studio-surface)',
                    border: '1px solid var(--studio-border)',
                    color: 'var(--studio-accent)',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <strong style={{ fontSize: '13px', fontWeight: 600, color: 'var(--studio-text)' }}>
                    {item.title}
                  </strong>
                  <span style={{ fontSize: '12px', color: 'var(--studio-muted)', lineHeight: 1.4 }}>
                    {item.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
