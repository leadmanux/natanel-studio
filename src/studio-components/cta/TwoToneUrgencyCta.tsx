import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { PhoneCall, Calendar, Shield } from 'lucide-react';

export interface TwoToneCtaContent {
  urgencyNote?: string;
  headline?: string;
  phone?: string;
  phoneLabel?: string;
  onlineCta?: string;
}

export function TwoToneUrgencyCta(props: StudioComponentProps<TwoToneCtaContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        urgencyNote: 'מענה טלפוני מיידי • זמינות קבלנית לאזור המרכז והצפון',
        headline: 'זקוקים לפתרון הנדסי מהיר או הצעת מחיר דחופה?',
        phone: '03-555-0199',
        phoneLabel: 'חיוג ישיר למוקד המהנדסים',
        onlineCta: 'פתיחת קריאה מהירה אונליין',
      }
    : {
        urgencyNote: 'Immediate Dispatch • Active Response Across Regional Territories',
        headline: 'Require Immediate Structural Engineering or Urgent Estimates?',
        phone: '1-800-555-0199',
        phoneLabel: 'Direct Partner Emergency Dispatch',
        onlineCta: 'Book Expedited Intake Online',
      };

  const content = { ...defaultContent, ...props.content };

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
            borderRadius: 'var(--studio-radius)',
            border: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-surface)',
            padding: '48px 36px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--studio-accent)', fontWeight: 700 }}>
            <Shield size={16} />
            <span>{content.urgencyNote}</span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '28px',
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(24px, 3.2vw, 36px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
                maxWidth: '620px',
              }}
            >
              {content.headline}
            </h2>

            {/* Actions */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
              <a
                href={`tel:${content.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  minHeight: '48px',
                  borderRadius: 'var(--studio-radius)',
                  backgroundColor: 'var(--studio-accent)',
                  color: '#111',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <PhoneCall size={16} />
                <span>{content.phoneLabel}</span>
              </a>

              <a
                href="#intake"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '14px 24px',
                  minHeight: '48px',
                  borderRadius: 'var(--studio-radius)',
                  backgroundColor: 'var(--studio-bg)',
                  border: '1px solid var(--studio-border)',
                  color: 'var(--studio-text)',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <Calendar size={16} />
                <span>{content.onlineCta}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
