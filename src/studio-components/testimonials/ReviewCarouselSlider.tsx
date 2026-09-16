import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Star, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

export interface CarouselReview {
  name: string;
  location: string;
  projectScope: string;
  rating: number;
  text: string;
  verifiedSource: string;
}

export interface ReviewCarouselContent {
  headline?: string;
  reviews?: CarouselReview[];
}

export function ReviewCarouselSlider(props: StudioComponentProps<ReviewCarouselContent>) {
  const [activeIdx, setActiveIdx] = useState(0);
  const isRtl = props.direction === 'rtl';

  const defaultReviews: CarouselReview[] = isRtl
    ? [
        {
          name: 'יוסי ומיכל כהן',
          location: 'הרצליה פיתוח',
          projectScope: 'שיפוץ אדריכלי מלא לווילה 450 מ״ר',
          rating: 5,
          text: '״הדיוק של סטודיו נתנאל הוא משהו שלא רואים בישראל. הכל נעשה בדיוק בזמן, ללא חריגה של שקל מהתקציב, והתוצאה עוצרת נשימה.״',
          verifiedSource: 'לקוח מאומת • ספטמבר 2025',
        },
        {
          name: 'עו״ד דניאל לוי',
          location: 'תל אביב, שדרות רוטשילד',
          projectScope: 'עיצוב פנטהאוז ומערכות חכמות',
          rating: 5,
          text: '״הליווי של נתנאל העניק לנו שקט נפשי מלא. איכות הנגרות והפרטים המיוחדים יצרו בית שכל אורח נדהם ממנו.״',
          verifiedSource: 'לקוח מאומת • יוני 2025',
        },
        {
          name: 'טליה מורנו',
          location: 'סביון',
          projectScope: 'תכנון נוף וחללי אירוח חיצוניים',
          rating: 5,
          text: '״החיבור בין הפנים לחוץ פשוט מושלם. היחס האישי, הזמינות והמקצועיות של הצוות ראויים לכל שבח. מומלץ בחום רב.״',
          verifiedSource: 'לקוח מאומת • מרץ 2025',
        },
      ]
    : [
        {
          name: 'Julian & Claire Sterling',
          location: 'Mayfair & Cotswolds',
          projectScope: 'Historic Estate Master Architecture',
          rating: 5,
          text: '“Natanel Studio’s rigor is singular. Delivery occurred exactly on the contract day, with zero budget deviations and transcendent spatial clarity.”',
          verifiedSource: 'Verified Client • September MMXXV',
        },
        {
          name: 'Jonathan Vance, KC',
          location: 'Kensington Residence',
          projectScope: 'Penthouse Joinery & Circadian Lighting',
          rating: 5,
          text: '“Every artisan detail was executed to museum tolerance. The sense of peace their architecture fosters is indescribable.”',
          verifiedSource: 'Verified Client • June MMXXV',
        },
        {
          name: 'Dr. Helene Rostova',
          location: 'Geneva Lakeside Pavilion',
          projectScope: 'Cantilevered Stone Sanctuary',
          rating: 5,
          text: '“The harmony between natural alpine light and monolithic stone is breathtaking. An exceptional studio with rare integrity.”',
          verifiedSource: 'Verified Client • March MMXXV',
        },
      ];

  const headline = props.content?.headline || (isRtl ? 'חוות דעת של לקוחות הסטודיו' : 'Audited Client Testimonials');
  const reviews = props.content?.reviews || defaultReviews;
  const current = reviews[activeIdx] || reviews[0];

  const next = () => setActiveIdx((prev) => (prev + 1) % reviews.length);
  const prev = () => setActiveIdx((prev) => (prev - 1 + reviews.length) % reviews.length);

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
            maxWidth: '880px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
              }}
            >
              {headline}
            </h2>

            {/* Carousel Arrow Controls */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                aria-label="Previous Review"
                onClick={isRtl ? next : prev}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-surface)',
                  color: 'var(--studio-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                aria-label="Next Review"
                onClick={isRtl ? prev : next}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-surface)',
                  color: 'var(--studio-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Review Card */}
          <div
            style={{
              padding: '36px',
              borderRadius: 'var(--studio-radius)',
              border: '1px solid var(--studio-border)',
              backgroundColor: 'var(--studio-surface)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', color: 'var(--studio-accent)' }}>
                {[...Array(current.rating)].map((_, i) => (
                  <Star key={i} size={15} fill="currentColor" />
                ))}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--studio-accent)', fontFamily: 'monospace' }}>
                <CheckCircle2 size={13} />
                <span>{current.verifiedSource}</span>
              </div>
            </div>

            <p
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(18px, 2.2vw, 24px)',
                lineHeight: 1.5,
                color: 'var(--studio-text)',
                margin: 0,
                fontStyle: 'italic',
              }}
            >
              {current.text}
            </p>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '12px', borderTop: '1px solid var(--studio-border)' }}>
              <div>
                <strong style={{ fontSize: '14px', color: 'var(--studio-text)', display: 'block' }}>
                  {current.name}
                </strong>
                <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                  {current.location}
                </span>
              </div>

              <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                {current.projectScope}
              </span>
            </div>
          </div>

          {/* Dots Indicator */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
            {reviews.map((_, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setActiveIdx(idx)}
                style={{
                  width: idx === activeIdx ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: idx === activeIdx ? 'var(--studio-accent)' : 'var(--studio-border)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              />
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
