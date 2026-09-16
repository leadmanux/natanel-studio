import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { CheckCircle2 } from 'lucide-react';

export interface MilestoneStep {
  phase: string;
  duration: string;
  title: string;
  summary: string;
}

export interface ProcessTimelineContent {
  sectionTitle?: string;
  milestones?: MilestoneStep[];
}

export function ProcessMilestoneTimeline(props: StudioComponentProps<ProcessTimelineContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultMilestones: MilestoneStep[] = isRtl
    ? [
        { phase: 'שלב 01', duration: 'שבועיים ראשונים', title: 'פרוגרמה, בדיקת זכויות ותקציב', summary: 'איסוף נתונים מדויק, ביקור בשטח ובניית תקציב יעד מוסכם.' },
        { phase: 'שלב 02', duration: 'שבועות 3–6', title: 'סקיצות קונספט ומודלים תלת-ממדיים', summary: 'הצגת חלופות תכנוניות, בדיקת הדמיית אור טבעי וחומריות.' },
        { phase: 'שלב 03', duration: 'שבועות 7–11', title: 'תכניות עבודה מפורטות ומכרז קבלנים', summary: 'הוצאת סטים מקיפים לביצוע ובחירת קבלני מפתח מומלצים.' },
        { phase: 'שלב 04', duration: 'שבועות 12 והלאה', title: 'ביצוע מפוקח ומסירת מפתח', summary: 'פיקוח עליון הדוק עד לסיום מושלם של כל פרט ופרט.' },
      ]
    : [
        { phase: 'PHASE 01', duration: 'Weeks 1–2', title: 'Diagnostic Brief & Feasibility', summary: 'Exhaustive site audit, spatial constraints mapping, and budget baseline agreement.' },
        { phase: 'PHASE 02', duration: 'Weeks 3–6', title: 'Volumetric Form & 3D Spatial Studies', summary: 'Exploration of form alternatives, sunlight tracking, and raw materiality.' },
        { phase: 'PHASE 03', duration: 'Weeks 7–11', title: 'Comprehensive Working Sets & Tenders', summary: 'Exhaustive contractor drawings and competitive procurement oversight.' },
        { phase: 'PHASE 04', duration: 'Weeks 12+', title: 'Supervised Build & Sovereign Handover', summary: 'Rigorous site administration enforcing millimeter tolerances to completion.' },
      ];

  const title = props.content?.sectionTitle || (isRtl ? 'תהליך העבודה המובנה' : 'Structured Milestone Trajectory');
  const milestones = props.content?.milestones || defaultMilestones;

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
            gap: '40px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: 'clamp(26px, 3.2vw, 40px)',
              fontWeight: 600,
              color: 'var(--studio-text)',
              margin: 0,
            }}
          >
            {title}
          </h2>

          {/* Timeline Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
              position: 'relative',
            }}
            className="grid-4col"
          >
            {milestones.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '24px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-surface)',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: 'var(--studio-accent)',
                      fontWeight: 700,
                    }}
                  >
                    {m.phase}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--studio-muted)' }}>
                    {m.duration}
                  </span>
                </div>

                <h3
                  style={{
                    fontFamily: 'var(--studio-font-display)',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--studio-text)',
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  {m.title}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--studio-muted)', lineHeight: 1.55, margin: 0 }}>
                  {m.summary}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
