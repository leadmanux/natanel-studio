import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface EditorialStoryContent {
  chapter?: string;
  headline?: string;
  leadParagraph?: string;
  bodyParagraph?: string;
  founderQuote?: string;
  founderName?: string;
  founderTitle?: string;
}

export function EditorialStoryNarrative(props: StudioComponentProps<EditorialStoryContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        chapter: 'פרק 01 • פילוסופיית היצירה',
        headline: 'מבנה אינו רק מעטפת.\nהוא בית לחיים ולרגש.',
        leadParagraph: 'התחלנו מתוך אמונה עמוקה שהאדריכלות הטובה ביותר היא זו שאינה צועקת. היא נשענת על כנות של חומרים טבעיים, משחקי צל ואור, והרמוניה שקטה.',
        bodyParagraph: 'כל אבן, קורת עץ ומפתח זכוכית נבחרים בקפידה ומיוצרים בהתאמה בלעדית לפרויקט. איננו מאמינים בפתרונות מדף או בטרנדים חולפים.',
        founderQuote: '״כאשר אתה מסלק את כל מה שמיותר, מה שנשאר הוא נצחי.״',
        founderName: 'נתנאל אביטבול',
        founderTitle: 'מייסד ושותף מוביל, סטודיו נתנאל',
      }
    : {
        chapter: 'CHAPTER 01 • THE FOUNDATIONAL THESIS',
        headline: 'Architecture is not a shelter.\nIt is an enduring covenant with light.',
        leadParagraph: 'Our practice was founded on the conviction that the most profound architecture does not shout. It speaks through material authenticity, geometric restraint, and monumental peace.',
        bodyParagraph: 'Every limestone block, blackened steel element, and volumetric aperture is hand-sourced across European artisan quarries and fabricated specifically for each commission.',
        founderQuote: '“When you subtract everything superfluous, whatever remains is timeless.”',
        founderName: 'Natanel Abitbol',
        founderTitle: 'Principal & Design Director',
      };

  const content = { ...defaultContent, ...props.content };
  const storyImage = props.assets?.story?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

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
            display: 'grid',
            gridTemplateColumns: '1fr 1.2fr',
            gap: '64px',
            alignItems: 'center',
          }}
          className="grid-split"
        >
          {/* Story Visual Portrait / Studio Atmosphere */}
          <div
            style={{
              width: '100%',
              aspectRatio: '3/4',
              borderRadius: 'var(--studio-radius)',
              overflow: 'hidden',
              border: '1px solid var(--studio-border)',
              backgroundColor: 'var(--studio-surface)',
            }}
          >
            <img
              src={storyImage}
              alt="Atelier Craft Narrative"
              referrerPolicy="no-referrer"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Narrative Text */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
              {content.chapter}
            </span>

            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(28px, 3.6vw, 46px)',
                lineHeight: 1.15,
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {content.headline}
            </h2>

            <p style={{ fontSize: '16px', lineHeight: 1.7, color: 'var(--studio-text)', fontWeight: 500, margin: 0 }}>
              {content.leadParagraph}
            </p>

            <p style={{ fontSize: '15px', lineHeight: 1.7, color: 'var(--studio-muted)', margin: 0 }}>
              {content.bodyParagraph}
            </p>

            {/* Founder Quote */}
            <div
              style={{
                marginTop: '12px',
                padding: '20px',
                borderRadius: 'var(--studio-radius)',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <blockquote
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: '16px',
                  fontStyle: 'italic',
                  color: 'var(--studio-text)',
                  margin: 0,
                  lineHeight: 1.5,
                }}
              >
                {content.founderQuote}
              </blockquote>
              <div style={{ display: 'flex', gap: '6px', fontSize: '12px' }}>
                <strong style={{ color: 'var(--studio-text)' }}>{content.founderName}</strong>
                <span style={{ color: 'var(--studio-muted)' }}>— {content.founderTitle}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
