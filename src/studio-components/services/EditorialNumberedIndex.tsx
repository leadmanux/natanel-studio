import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Plus, Minus } from 'lucide-react';

export interface IndexItem {
  number: string;
  title: string;
  scope: string;
  details: string;
}

export interface EditorialIndexContent {
  eyebrow?: string;
  headline?: string;
  items?: IndexItem[];
}

export function EditorialNumberedIndex(props: StudioComponentProps<EditorialIndexContent>) {
  const [expanded, setExpanded] = useState<string | null>('01');
  const isRtl = props.direction === 'rtl';

  const defaultItems: IndexItem[] = isRtl
    ? [
        {
          number: '01',
          title: 'ייעוץ תכנוני ואסטרטגיה מרחבית',
          scope: 'בדיקת היתכנות, ניתוח זכויות בנייה ובניית פרוגרמה אדריכלית ראשונית.',
          details: 'פגישת עומק מקיפה לזיהוי הפוטנציאל המקסימלי של הנכס, אפיון דרישות בני המשפחה או החברה, ובחינת תקציב ולוחות זמנים.',
        },
        {
          number: '02',
          title: 'תכנון קונספטואלי ומודלים תלת-ממדיים',
          scope: 'פיתוח שפה עיצובית, תכניות אב והדמיות תאורה וחומרים ברמת 8K.',
          details: 'הצגת חלופות תכנון מרתקות תוך הדגשת כיווני אוויר, זרימת חללים וחיבור הרמוני בין הפנים לחוץ.',
        },
        {
          number: '03',
          title: 'תוכניות ביצוע ופרטי נגרות אומן',
          scope: 'תוכניות עבודה מפורטות לכל קבלני המשנה: חשמל, אינסטלציה, מיזוג ונגרות.',
          details: 'ירידה לרמת הבורג וחיבורי החומרים, תיאום מערכות מתקדם וכתב כמויות שקוף למניעת חריגות תקציב.',
        },
        {
          number: '04',
          title: 'פיקוח עליון וליווי עד המפתח',
          scope: 'בקרה הדוקה בשטח, בדיקת עמידה בתקנים ומסירה סופית ללא פשרות.',
          details: 'נוכחות סדירה ביציקות, בשלבי השלד ובעבודות הגמר העדינות, מתן פתרונות בזמן אמת עד לקבלת מפתח.',
        },
      ]
    : [
        {
          number: '01',
          title: 'Spatial Strategy & Site Audit',
          scope: 'Zoning feasibility, volumetric potential, and architectural programming.',
          details: 'Exhaustive site orientation analysis, climatic airflow mapping, and spatial density audits before drawing the first line.',
        },
        {
          number: '02',
          title: 'Conceptual Synthesis & 3D Modeling',
          scope: 'Material studies, lighting models, and photorealistic spatial studies.',
          details: 'Exploration of volumetric alternatives balancing indoor-outdoor transitions, stone masonry palettes, and natural shadow play.',
        },
        {
          number: '03',
          title: 'Exhaustive Construction Sets',
          scope: 'Millimeter-accurate joinery, HVAC concealment, and MEP engineering drawings.',
          details: 'Zero-ambiguity technical schematics ensuring contractors build precisely to the approved architectural standard without improvised field compromises.',
        },
        {
          number: '04',
          title: 'Atelier Site Supervision',
          scope: 'Rigorous craftsmanship audits, material verification, and handover inspection.',
          details: 'Direct on-site quality assurance throughout critical structural pours, finishing transitions, and ultimate client commissioning.',
        },
      ];

  const eyebrow = props.content?.eyebrow || (isRtl ? 'שירותים לפי שלבים' : 'METHODICAL SERVICE INDEX');
  const headline = props.content?.headline || (isRtl ? 'ארבעת שלבי היצירה האדריכלית' : 'The Four Stages of Spatial Creation');
  const items = props.content?.items || defaultItems;

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
            gap: '40px',
          }}
        >
          <div>
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
              {eyebrow}
            </span>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(26px, 3.2vw, 42px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '8px 0 0 0',
              }}
            >
              {headline}
            </h2>
          </div>

          {/* Accordion Index */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {items.map((item) => {
              const isOpen = expanded === item.number;
              return (
                <div
                  key={item.number}
                  style={{
                    borderTop: '1px solid var(--studio-border)',
                    padding: '24px 0',
                  }}
                >
                  <div
                    onClick={() => setExpanded(isOpen ? null : item.number)}
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      gap: '24px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '20px' }}>
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '16px',
                          color: 'var(--studio-accent)',
                          fontWeight: 700,
                        }}
                      >
                        {item.number}
                      </span>
                      <div>
                        <h3
                          style={{
                            fontFamily: 'var(--studio-font-display)',
                            fontSize: '20px',
                            fontWeight: 600,
                            color: 'var(--studio-text)',
                            margin: '0 0 4px 0',
                          }}
                        >
                          {item.title}
                        </h3>
                        <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--studio-muted)' }}>
                          {item.scope}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      aria-label="Toggle Details"
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--studio-border)',
                        borderRadius: 'var(--studio-radius)',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--studio-text)',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      {isOpen ? <Minus size={14} /> : <Plus size={14} />}
                    </button>
                  </div>

                  {isOpen && (
                    <div
                      style={{
                        paddingTop: '16px',
                        paddingInlineStart: '44px',
                        fontSize: '14px',
                        lineHeight: 1.65,
                        color: 'var(--studio-muted)',
                        maxWidth: '720px',
                      }}
                    >
                      {item.details}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
