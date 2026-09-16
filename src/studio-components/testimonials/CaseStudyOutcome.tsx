import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { TrendingUp, Clock, CheckCircle } from 'lucide-react';

export interface OutcomeMetric {
  label: string;
  value: string;
  subtext: string;
}

export interface CaseOutcomeContent {
  caseTag?: string;
  caseTitle?: string;
  clientQuote?: string;
  clientName?: string;
  metrics?: OutcomeMetric[];
}

export function CaseStudyOutcome(props: StudioComponentProps<CaseOutcomeContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultMetrics: OutcomeMetric[] = isRtl
    ? [
        { label: 'עליית שווי נכס מוערכת', value: '+42%', subtext: 'בהערכת שמאי מוסמך לאחר מסירה' },
        { label: 'קיצור לוח זמנים', value: '4 שבועות', subtext: 'מסירה לפני התאריך החוזי' },
        { label: 'חריגות תקציב', value: '0.0%', subtext: 'עמידה מלאה בהגדרת היעד המקורית' },
      ]
    : [
        { label: 'Property Asset Appreciation', value: '+42%', subtext: 'Certified post-commission valuation' },
        { label: 'Delivery Schedule Acceleration', value: '4 Weeks', subtext: 'Handed over ahead of locked target' },
        { label: 'Budget Slippage Variance', value: '0.0%', subtext: 'Zero unauthorized fiscal overrun' },
      ];

  const defaultContent = isRtl
    ? {
        caseTag: 'מקרה בוחן מדוד • וילת שונית החוף',
        caseTitle: 'מתכנון מורכב לעליית ערך יוצאת דופן',
        clientQuote: '״ניהול הפרויקט של נתנאל חסך לנו מאות אלפי שקלים ומנע אינספור טעויות של קבלנים. העבודה איתם שווה כל שקל.״',
        clientName: 'עו״ד גיא לוין, בעל הנכס',
        metrics: defaultMetrics,
      }
    : {
        caseTag: 'AUDITED OUTCOME • COASTAL REEF VILLA',
        caseTitle: 'From Volumetric Complexity to Quantified Capital Yield',
        clientQuote: '“Natanel Studio’s engineering foresight safeguarded our capital and preempted catastrophic subcontractor oversights. The investment repaid itself threefold.”',
        clientName: 'Guy Levin, Managing Partner & Owner',
        metrics: defaultMetrics,
      };

  const content = { ...defaultContent, ...props.content };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-surface)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            gap: '48px',
            alignItems: 'center',
          }}
          className="grid-split"
        >
          {/* Narrative & Quote */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: '0.12em',
                color: 'var(--studio-accent)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {content.caseTag}
            </span>

            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(26px, 3.2vw, 42px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {content.caseTitle}
            </h2>

            <blockquote
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: '17px',
                lineHeight: 1.6,
                fontStyle: 'italic',
                color: 'var(--studio-text)',
                margin: '12px 0 0 0',
                paddingLeft: !isRtl ? '16px' : undefined,
                paddingRight: isRtl ? '16px' : undefined,
                borderLeft: !isRtl ? '2px solid var(--studio-accent)' : undefined,
                borderRight: isRtl ? '2px solid var(--studio-accent)' : undefined,
              }}
            >
              {content.clientQuote}
            </blockquote>

            <span style={{ fontSize: '13px', color: 'var(--studio-muted)' }}>
              — {content.clientName}
            </span>
          </div>

          {/* Quantified Metrics Box */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              padding: '32px',
              borderRadius: 'var(--studio-radius)',
              backgroundColor: 'var(--studio-bg)',
              border: '1px solid var(--studio-border)',
            }}
          >
            {content.metrics?.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingBottom: idx < (content.metrics?.length || 0) - 1 ? '16px' : 0,
                  borderBottom: idx < (content.metrics?.length || 0) - 1 ? '1px solid var(--studio-border)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--studio-text)' }}>
                    {m.label}
                  </strong>
                  <span
                    style={{
                      fontFamily: 'var(--studio-font-display)',
                      fontSize: '26px',
                      fontWeight: 700,
                      color: 'var(--studio-accent)',
                    }}
                  >
                    {m.value}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                  {m.subtext}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
