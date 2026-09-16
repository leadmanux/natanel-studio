import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Star } from 'lucide-react';

export interface PortraitTestimonial {
  image: string;
  quote: string;
  name: string;
  title: string;
  verifiedBadge: string;
}

export interface TestimonialDuoContent {
  sectionTitle?: string;
  testimonials?: PortraitTestimonial[];
}

export function PortraitTestimonialDuo(props: StudioComponentProps<TestimonialDuoContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultDuo: PortraitTestimonial[] = isRtl
    ? [
        {
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          quote: '״העבודה עם סטודיו נתנאל הייתה החלטת התכנון הטובה ביותר שעשינו. דיוק בלוחות הזמנים ואיכות חומרים ללא פשרות.״',
          name: 'רונית שפירא',
          title: 'יזמית ובעלת פנטהאוז בתל אביב',
          verifiedBadge: 'פרויקט נמסר באוגוסט 2025',
        },
        {
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          quote: '״מעטים המשרדים שמסוגלים לנהל הנדסה מורכבת ועיצוב אומן ברגישות כה גבוהה. השקט הנפשי היה מוחלט.״',
          name: 'אלון ברקוביץ׳',
          title: 'מנהל קרן השקעות ובעל וילה בקיסריה',
          verifiedBadge: 'פרויקט נמסר במאי 2025',
        },
      ]
    : [
        {
          image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
          quote: '“Engaging Natanel Studio was the definitive architectural decision of our lives. Millimeter accuracy and total budgetary discipline throughout.”',
          name: 'Genevieve Moreau',
          title: 'Principal, Moreau Heritage Capital',
          verifiedBadge: 'Commission Delivered August MMXXV',
        },
        {
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
          quote: '“Rarely does a practice unite structural engineering rigor with transcendent artistic sensitivity. The peace of mind was absolute.”',
          name: 'Arthur Sterling',
          title: 'Private Sovereign Commissioner',
          verifiedBadge: 'Commission Delivered May MMXXV',
        },
      ];

  const title = props.content?.sectionTitle || (isRtl ? 'עדויות לקוחות ומזמיני פרויקטים' : 'Voices of Discerning Commissioners');
  const items = props.content?.testimonials || defaultDuo;

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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '32px',
            }}
            className="grid-2col"
          >
            {items.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '20px',
                  padding: '32px',
                  borderRadius: 'var(--studio-radius)',
                  backgroundColor: 'var(--studio-bg)',
                  border: '1px solid var(--studio-border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      overflow: 'hidden',
                      flexShrink: 0,
                      border: '1px solid var(--studio-border)',
                    }}
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ display: 'flex', color: 'var(--studio-accent)' }}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </div>
                    <strong style={{ fontSize: '15px', color: 'var(--studio-text)' }}>
                      {item.name}
                    </strong>
                    <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                      {item.title}
                    </span>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '15px',
                    lineHeight: 1.65,
                    color: 'var(--studio-text)',
                    margin: 0,
                    fontStyle: 'italic',
                  }}
                >
                  {item.quote}
                </p>

                <div
                  style={{
                    paddingTop: '8px',
                    borderTop: '1px solid var(--studio-border)',
                    fontSize: '11px',
                    fontFamily: 'monospace',
                    color: 'var(--studio-accent)',
                  }}
                >
                  {item.verifiedBadge}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
