import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface PressItem {
  name: string;
  accolade: string;
}

export interface EmblemPressContent {
  title?: string;
  publications?: PressItem[];
}

export function EmblemPressStrip(props: StudioComponentProps<EmblemPressContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultPress = isRtl
    ? [
        { name: 'כלכליסט פרימיום', accolade: '״משרד האדריכלות המשפיע של השנה״' },
        { name: 'גלובס נדל״ן', accolade: '״דיוק תכנוני ברמה בינלאומית״' },
        { name: 'DEZEEN ARCHITECTURE', accolade: '״Top 10 Global Studios to Watch״' },
        { name: 'ARCHITECTURAL DIGEST', accolade: '״Excellence in Restrained Luxury״' },
      ]
    : [
        { name: 'FINANCIAL TIMES', accolade: '“The definition of sovereign architectural craft”' },
        { name: 'DEZEEN', accolade: '“Top 10 Global Practices in Restrained Living”' },
        { name: 'ARCHITECTURAL DIGEST', accolade: '“Unwavering commitment to material purity”' },
        { name: 'MONOCLE', accolade: '“Refined spaces engineered for centuries”' },
      ];

  const title = props.content?.title || (isRtl ? 'הוקרה בינלאומית ופרסומים בעיתונות' : 'CRITICAL ACCLAIM & INSTITUTIONAL RECOGNITION');
  const items = props.content?.publications || defaultPress;

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: '40px 24px',
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
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'monospace',
              letterSpacing: isRtl ? '0.05em' : '0.14em',
              color: 'var(--studio-muted)',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </span>

          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              textAlign: 'center',
            }}
            className="grid-4col"
          >
            {items.map((pub, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '16px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-surface)',
                }}
              >
                <strong
                  style={{
                    fontFamily: 'var(--studio-font-display)',
                    fontSize: '14px',
                    letterSpacing: '0.08em',
                    color: 'var(--studio-text)',
                  }}
                >
                  {pub.name}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--studio-muted)', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {pub.accolade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
