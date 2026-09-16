import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface NarrativeStep {
  tag: string;
  title: string;
  description: string;
  image: string;
}

export interface StickyNarrativeContent {
  stickyTitle?: string;
  stickySubtitle?: string;
  steps?: NarrativeStep[];
}

export function StickySplitNarrative(props: StudioComponentProps<StickyNarrativeContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultSteps: NarrativeStep[] = isRtl
    ? [
        {
          tag: '01 / חציבת החלל',
          title: 'פירוק והגדרה מחדש של הפרופורציות',
          description: 'חשיפת שלד הבטון המקורי, פתיחת מפתחים כפולי גובה והסרת כל מחיצה שאינה תורמת לזרימת האור הטבעי.',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        },
        {
          tag: '02 / חומריות טהורה',
          title: 'שילוב אבן טרוורטין ועץ אלון מעושן',
          description: 'כל משטח נבחר במחצבה באיטליה, תוך הקפדה על המשכיות גידים וחיבורים נסתרים לחלוטין ברמת מילימטר.',
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        },
        {
          tag: '03 / תאורת אווירה',
          title: 'אדריכלות של צל ואור',
          description: 'מערכת תאורה ממוחשבת המתאימה את גוון ועוצמת האור לשעות היממה, מדגישה טקסטורות ומשרה שלווה עמוקה.',
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        },
      ]
    : [
        {
          tag: '01 / SPATIAL CARVING',
          title: 'Radical Proportion Redefinition',
          description: 'Exposing structural concrete monoliths, piercing double-height apertures, and banishing non-essential partitions.',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        },
        {
          tag: '02 / MATERIAL PURITY',
          title: 'Unfinished Travertine & Smoked Oak',
          description: 'Sourced from heritage European quarries with book-matched vein continuity and invisible flush architectural reveals.',
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        },
        {
          tag: '03 / ATMOSPHERIC ILLUMINATION',
          title: 'The Architecture of Light and Shadow',
          description: 'Concealed circadian lighting architecture synchronized with solar azimuth to accentuate pure stone texture.',
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        },
      ];

  const title = props.content?.stickyTitle || (isRtl ? 'הנדסת החלל והאומנות' : 'The Anatomy of Craft');
  const subtitle = props.content?.stickySubtitle || (isRtl ? 'כיצד תפיסה אדריכלית קפדנית מתורגמת לחוויית מגורים יוצאת דופן.' : 'How rigorous reduction transforms raw space into sublime enduring presence.');
  const steps = props.content?.steps || defaultSteps;

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
            gridTemplateColumns: '1fr 1.3fr',
            gap: '64px',
            alignItems: 'start',
          }}
          className="grid-split"
        >
          {/* Sticky Left Thesis */}
          <div style={{ position: 'sticky', top: '40px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: '0.14em',
                color: 'var(--studio-accent)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              NARRATIVE TRAJECTORY
            </span>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
                lineHeight: 1.15,
              }}
            >
              {title}
            </h2>
            <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--studio-muted)', margin: 0 }}>
              {subtitle}
            </p>
          </div>

          {/* Scrolling Steps */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
            {steps.map((step, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  padding: '24px',
                  borderRadius: 'var(--studio-radius)',
                  backgroundColor: 'var(--studio-bg)',
                  border: '1px solid var(--studio-border)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '16/10',
                    borderRadius: 'var(--studio-radius)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--studio-surface)',
                  }}
                >
                  <img
                    src={step.image}
                    alt={step.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--studio-accent)', fontWeight: 700 }}>
                  {step.tag}
                </span>

                <h3
                  style={{
                    fontFamily: 'var(--studio-font-display)',
                    fontSize: '20px',
                    fontWeight: 600,
                    color: 'var(--studio-text)',
                    margin: 0,
                  }}
                >
                  {step.title}
                </h3>

                <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--studio-muted)', margin: 0 }}>
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
