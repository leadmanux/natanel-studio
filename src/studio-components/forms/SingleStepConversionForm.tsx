import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Phone, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export interface SingleFormContent {
  headline?: string;
  subheadline?: string;
  ctaText?: string;
  phonePrompt?: string;
}

export function SingleStepConversionForm(props: StudioComponentProps<SingleFormContent>) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [sent, setSent] = useState(false);
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        headline: 'מעוניינים בשיחת ייעוץ אדריכלית?',
        subheadline: 'השאירו פרטים ונחזור אליכם לשיחת תיאום מקדימה תוך יום עסקים אחד.',
        ctaText: 'תיאום שיחת ייעוץ',
        phonePrompt: 'או התקשרו ישירות: 03-555-1234',
      }
    : {
        headline: 'Initiate a Preliminary Consultation',
        subheadline: 'Leave your contact details and an atelier partner will reach out within one business day.',
        ctaText: 'Request Atelier Callback',
        phonePrompt: 'Or call our direct line: +972-3-555-1234',
      };

  const content = { ...defaultContent, ...props.content };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    if (props.onAction) {
      props.onAction('callback_requested', { name, phone });
    }
  };

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
            maxWidth: '640px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(24px, 3vw, 36px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '0 0 8px 0',
              }}
            >
              {content.headline}
            </h2>
            <p style={{ fontSize: '14.5px', color: 'var(--studio-muted)', margin: 0 }}>
              {content.subheadline}
            </p>
          </div>

          {sent ? (
            <div
              style={{
                padding: '28px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'var(--studio-bg)',
                border: '1px solid var(--studio-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                color: '#2e7d32',
              }}
            >
              <CheckCircle size={22} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>
                {isRtl ? 'הפנייה התקבלה. נחזור בהקדם האפשרי.' : 'Inquiry noted. We will connect shortly.'}
              </span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }} className="grid-2col">
                <input
                  type="text"
                  required
                  placeholder={isRtl ? 'שמך המלא' : 'Your Full Name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '46px',
                    padding: '8px 14px',
                    backgroundColor: 'var(--studio-bg)',
                    border: '1px solid var(--studio-border)',
                    borderRadius: 'var(--studio-radius)',
                    color: 'var(--studio-text)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
                <input
                  type="tel"
                  required
                  placeholder={isRtl ? 'מספר טלפון' : 'Phone Number'}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: '46px',
                    padding: '8px 14px',
                    backgroundColor: 'var(--studio-bg)',
                    border: '1px solid var(--studio-border)',
                    borderRadius: 'var(--studio-radius)',
                    color: 'var(--studio-text)',
                    fontSize: '13.5px',
                    outline: 'none',
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  width: '100%',
                  minHeight: '48px',
                  backgroundColor: 'var(--studio-accent)',
                  color: '#111',
                  border: 'none',
                  borderRadius: 'var(--studio-radius)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <span>{content.ctaText}</span>
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </form>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '13px', color: 'var(--studio-muted)' }}>
            <Phone size={14} color="var(--studio-accent)" />
            <span>{content.phonePrompt}</span>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
