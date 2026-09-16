import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqContent {
  eyebrow?: string;
  title?: string;
  faqs?: FaqItem[];
}

export function FaqAccordionSection(props: StudioComponentProps<FaqContent>) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  const isRtl = props.direction === 'rtl';

  const defaultFaqs: FaqItem[] = isRtl
    ? [
        {
          question: 'כיצד מובטח שהפרויקט יעמוד בתקציב שנקבע מראש?',
          answer: 'אנו עובדים עם כתב כמויות מפורט ומכרז קבלנים סגור. כל סעיף מאושר טרם תחילת העבודה, והחוזים כוללים התחייבות למחיר סגור ללא תוספות חריגות.',
        },
        {
          question: 'כמה זמן אורך תהליך התכנון והרישוי בסטודיו?',
          answer: 'שלב התכנון הקונספטואלי והתוכניות המפורטות אורך בדרך כלל בין 8 ל-14 שבועות. זמני רישוי מול הרשויות משתנים לפי סוג הפרויקט, ואנו מנהלים את התהליך באופן הדוק מול הוועדות המקומיות.',
        },
        {
          question: 'האם אתם מפקחים על עבודות הקבלנים בשטח באופן יומיומי?',
          answer: 'כן. הסטודיו מפעיל מערך פיקוח עליון הדוק וביקורי אתר שוטפים כדי להבטיח ביצוע מדויק של כל פרטי הנגרות, התאורה והמערכות בסטנדרט הגבוה ביותר.',
        },
        {
          question: 'מהי האחריות הניתנת לאחר סיום הפרויקט ומסירת המפתח?',
          answer: 'הסטודיו מעניק שנת בדק מלאה בליווי שוטף, ובנוסף כל קבלני הביצוע מחויבים לאחריות שלד וגמר של עד 10 שנים בהתאם לחוק המכר ולסטנדרט הסטודיו.',
        },
      ]
    : [
        {
          question: 'How do you contractually prevent budget slippage?',
          answer: 'We construct exhaustive quantity surveyor documentation and locked tender packages before breaking ground. Subcontractors are contractually bound to fixed price ceilings with zero unilateral change orders.',
        },
        {
          question: 'What is the standard duration for the design and permit phase?',
          answer: 'Concept synthesis and working construction sets require 8 to 14 weeks. Municipal permitting timelines vary by jurisdiction; our dedicated zoning partners manage administrative filings directly.',
        },
        {
          question: 'Does the atelier conduct daily site supervision?',
          answer: 'Yes. A licensed principal and field engineer oversee key construction milestones to ensure millimeter accuracy across structural joinery, stonework, and MEP concealments.',
        },
        {
          question: 'What warranties govern the completed commission?',
          answer: 'We provide an audited 12-month post-handover commissioning period, backed by 10-year structural and waterproofing warranties bound by master contract.',
        },
      ];

  const eyebrow = props.content?.eyebrow || (isRtl ? 'שאלות ותשובות נפוצות' : 'CLARITY & CONCERNS');
  const title = props.content?.title || (isRtl ? 'כל מה שחשוב לדעת לפני שמתחילים' : 'Frequently Addressed Inquiries');
  const faqs = props.content?.faqs || defaultFaqs;

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
            maxWidth: '820px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
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
                fontSize: 'clamp(26px, 3.2vw, 40px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '8px 0 0 0',
              }}
            >
              {title}
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, idx) => {
              const isOpen = openIdx === idx;
              return (
                <div
                  key={idx}
                  style={{
                    borderRadius: 'var(--studio-radius)',
                    border: '1px solid var(--studio-border)',
                    backgroundColor: 'var(--studio-surface)',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIdx(isOpen ? null : idx)}
                    style={{
                      width: '100%',
                      padding: '20px 24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--studio-text)',
                      textAlign: isRtl ? 'right' : 'left',
                      cursor: 'pointer',
                      gap: '16px',
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: 600 }}>
                      {faq.question}
                    </span>
                    {isOpen ? <ChevronUp size={18} color="var(--studio-accent)" /> : <ChevronDown size={18} />}
                  </button>

                  {isOpen && (
                    <div
                      style={{
                        padding: '0 24px 20px',
                        fontSize: '14px',
                        lineHeight: 1.65,
                        color: 'var(--studio-muted)',
                      }}
                    >
                      {faq.answer}
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
