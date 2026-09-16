import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface MetricItem {
  value: string;
  label: string;
  subtext?: string;
}

export interface MetricProofContent {
  metrics?: MetricItem[];
}

export function MetricProofStrip(props: StudioComponentProps<MetricProofContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultMetrics = isRtl
    ? [
        { value: '140+', label: 'פרויקטים אדריכליים', subtext: 'במסירה מושלמת' },
        { value: '₪240M', label: 'היקף פרויקטים בביצוע', subtext: 'בניהול מוקפד' },
        { value: '99.4%', label: 'עמידה בלוחות זמנים', subtext: 'מדד אמינות קשיח' },
        { value: '18 שנים', label: 'ניסיון מקצועי מצטבר', subtext: 'מאז שנת 2008' },
      ]
    : [
        { value: '140+', label: 'Architectural Works', subtext: 'Rigorously delivered' },
        { value: '$240M+', label: 'Capital Portfolio', subtext: 'Under bespoke management' },
        { value: '99.4%', label: 'Schedule Precision', subtext: 'Audited contract velocity' },
        { value: '18 Yrs', label: 'Unbroken Practice', subtext: 'Established MMVIII' },
      ];

  const metrics = props.content?.metrics || defaultMetrics;

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: '48px 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-surface)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '32px',
          }}
          className="grid-4col"
        >
          {metrics.map((m, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
                borderLeft: !isRtl && idx > 0 ? '1px solid var(--studio-border)' : undefined,
                borderRight: isRtl && idx > 0 ? '1px solid var(--studio-border)' : undefined,
                paddingLeft: !isRtl && idx > 0 ? '24px' : undefined,
                paddingRight: isRtl && idx > 0 ? '24px' : undefined,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: 'clamp(28px, 3vw, 42px)',
                  fontWeight: 700,
                  color: 'var(--studio-text)',
                  lineHeight: 1.1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {m.value}
              </span>
              <strong style={{ fontSize: '13px', fontWeight: 600, color: 'var(--studio-text)' }}>
                {m.label}
              </strong>
              {m.subtext && (
                <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                  {m.subtext}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
