import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Check, X } from 'lucide-react';

export interface ComparisonRow {
  dimension: string;
  studioStandard: string;
  industryAverage: string;
}

export interface ComparisonTableContent {
  title?: string;
  subtitle?: string;
  rows?: ComparisonRow[];
}

export function ComparisonTable(props: StudioComponentProps<ComparisonTableContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultRows: ComparisonRow[] = isRtl
    ? [
        { dimension: 'אחריות וביטוח ביצוע', studioStandard: '10 שנות אחריות מקיפה בכתב', industryAverage: 'אחריות בסיסית לשנה בלבד' },
        { dimension: 'רמת פיקוח ובקרת איכות', studioStandard: 'פיקוח יומיומי באתר ע״י מהנדס בכיר', industryAverage: 'ביקורים אקראיים ללא תיעוד' },
        { dimension: 'עמידה בלוחות זמנים', studioStandard: 'התחייבות חוזית וקנס יומי מוסכם', industryAverage: 'איחורים ממוצעים של 3–6 חודשים' },
        { dimension: 'שקיפות תקציבית', studioStandard: 'כתב כמויות סגור ומחיר סופי מובטח', industryAverage: 'חריגות תקציב של 25%–40%' },
        { dimension: 'איכות חומרי גמר', studioStandard: 'יבוא בלעדי וחומרים אירופאיים תקניים', industryAverage: 'תחליפים זולים ואיכות משתנה' },
      ]
    : [
        { dimension: 'Contractual Craft Surety', studioStandard: '10-Year Master Warranty in writing', industryAverage: 'Standard 1-year superficial warranty' },
        { dimension: 'Site Supervision Rigor', studioStandard: 'Daily inspection by licensed partner', industryAverage: 'Unscheduled irregular subcontractor visits' },
        { dimension: 'Milestone Schedule Discipline', studioStandard: 'Legally binding completion penalty', industryAverage: 'Average 3–6 month delivery slippage' },
        { dimension: 'Budgetary Transparency', studioStandard: 'Locked procurement ceiling, zero surprises', industryAverage: '25%–40% routine overrun addenda' },
        { dimension: 'Material Provenance', studioStandard: 'Quarry-certified European natural stone', industryAverage: 'Synthetic and unverified composite substitutes' },
      ];

  const title = props.content?.title || (isRtl ? 'ההבדל שבין שגרה למצוינות אדריכלית' : 'The Difference Between Standard & Atelier');
  const subtitle = props.content?.subtitle || (isRtl ? 'השוואה שקופה ומדויקת בין סטנדרט הסטודיו לבין המקובל בענף' : 'An audited comparison of execution standards, materials, and accountability.');
  const rows = props.content?.rows || defaultRows;

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
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(26px, 3.2vw, 40px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '0 0 8px 0',
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--studio-muted)', margin: 0 }}>
              {subtitle}
            </p>
          </div>

          {/* Comparison Table */}
          <div
            style={{
              width: '100%',
              borderRadius: 'var(--studio-radius)',
              border: '1px solid var(--studio-border)',
              backgroundColor: 'var(--studio-bg)',
              overflowX: 'auto',
            }}
          >
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--studio-border)' }}>
                  <th style={{ padding: '16px 20px', color: 'var(--studio-muted)', fontWeight: 500, fontSize: '12px' }}>
                    {isRtl ? 'קריטריון איכות' : 'Quality Dimension'}
                  </th>
                  <th
                    style={{
                      padding: '16px 20px',
                      color: 'var(--studio-accent)',
                      fontWeight: 700,
                      fontSize: '13px',
                      backgroundColor: 'rgba(212, 175, 55, 0.05)',
                    }}
                  >
                    {isRtl ? 'סטנדרט סטודיו נתנאל' : 'Natanel Studio Standard'}
                  </th>
                  <th style={{ padding: '16px 20px', color: 'var(--studio-muted)', fontWeight: 500, fontSize: '12px' }}>
                    {isRtl ? 'הממוצע בענף' : 'Industry Average'}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx} style={{ borderBottom: idx < rows.length - 1 ? '1px solid var(--studio-border)' : 'none' }}>
                    <td style={{ padding: '16px 20px', fontWeight: 600, color: 'var(--studio-text)' }}>
                      {r.dimension}
                    </td>
                    <td
                      style={{
                        padding: '16px 20px',
                        color: 'var(--studio-text)',
                        fontWeight: 600,
                        backgroundColor: 'rgba(212, 175, 55, 0.05)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Check size={16} color="var(--studio-accent)" />
                        <span>{r.studioStandard}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', color: 'var(--studio-muted)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <X size={15} color="#888" />
                        <span>{r.industryAverage}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
