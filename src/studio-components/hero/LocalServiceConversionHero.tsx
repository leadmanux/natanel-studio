import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Clock, Phone, MapPin, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';

export interface LocalHeroContent {
  urgencyBadge?: string;
  headline?: string;
  subheadline?: string;
  phone?: string;
  formTitle?: string;
  serviceTypes?: string[];
  ctaButtonText?: string;
}

export function LocalServiceConversionHero(props: StudioComponentProps<LocalHeroContent>) {
  const [submitted, setSubmitted] = useState(false);
  const [zip, setZip] = useState('');
  const [phoneInput, setPhoneInput] = useState('');
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        urgencyBadge: 'מענה והגעה תוך 45 דקות • זמינות 24/7',
        headline: 'שירותי קבלנות ושיפוצים ללא פשרות.',
        subheadline: 'צוות מוסמך בעל רישיון קבלן רשום, ביטוח מלא ואחריות מקיפה ל-10 שנים על כל פרויקט.',
        phone: '03-987-6543',
        formTitle: 'קבלת הצעת מחיר מדויקת ללא התחייבות',
        serviceTypes: ['שיפוץ דירה קומפלט', 'אינסטלציה ומערכות מים', 'עבודות גמר וחשמל', 'חיזוק מבנים'],
        ctaButtonText: 'קבלו הצעת מחיר עכשיו',
      }
    : {
        urgencyBadge: '45-Minute Emergency Response • 24/7 On Call',
        headline: 'Master Contractors. Uncompromising Quality.',
        subheadline: 'Licensed, insured, and background-checked technicians equipped for immediate high-standard residential and commercial delivery.',
        phone: '1-800-555-0188',
        formTitle: 'Request Instant Fast-Track Estimate',
        serviceTypes: ['Complete Renovation', 'Structural Masonry', 'Commercial Electrical', 'Emergency HVAC'],
        ctaButtonText: 'Dispatch Technician Estimate',
      };

  const content = { ...defaultContent, ...props.content };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          backgroundColor: 'var(--studio-surface)',
          borderBottom: '1px solid var(--studio-border)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1.2fr 1fr',
            alignItems: 'center',
            gap: '48px',
          }}
          className="grid-split"
        >
          {/* Left Text and Trust Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'rgba(230, 126, 34, 0.1)',
                color: 'var(--studio-accent)',
                fontSize: '12px',
                fontWeight: 700,
                width: 'fit-content',
              }}
            >
              <Clock size={14} />
              <span>{content.urgencyBadge}</span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(30px, 4vw, 50px)',
                lineHeight: 1.15,
                fontWeight: 700,
                color: 'var(--studio-text)',
                margin: 0,
              }}
            >
              {content.headline}
            </h1>

            <p style={{ fontSize: '15.5px', lineHeight: 1.6, color: 'var(--studio-muted)', margin: 0 }}>
              {content.subheadline}
            </p>

            {/* Direct Phone Trigger */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingTop: '8px' }}>
              <a
                href={`tel:${content.phone}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 20px',
                  minHeight: '48px',
                  backgroundColor: 'var(--studio-bg)',
                  border: '1px solid var(--studio-border)',
                  borderRadius: 'var(--studio-radius)',
                  color: 'var(--studio-text)',
                  textDecoration: 'none',
                  fontSize: '15px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                }}
              >
                <Phone size={16} color="var(--studio-accent)" />
                <span>{content.phone}</span>
              </a>
            </div>
          </div>

          {/* Quick Intake Form Card */}
          <div
            style={{
              backgroundColor: 'var(--studio-bg)',
              border: '1px solid var(--studio-border)',
              borderRadius: 'var(--studio-radius)',
              padding: '32px 28px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center', padding: '24px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <CheckCircle size={40} color="#2e7d32" />
                <h3 style={{ margin: 0, color: 'var(--studio-text)', fontSize: '18px' }}>
                  {isRtl ? 'הפנייה התקבלה בהצלחה!' : 'Inquiry Successfully Received!'}
                </h3>
                <p style={{ margin: 0, fontSize: '13.5px', color: 'var(--studio-muted)' }}>
                  {isRtl ? 'צוות קבלני השטח יצור עמך קשר תוך 15 דקות.' : 'A certified master technician will call you back within 15 minutes.'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h3 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--studio-text)', margin: '0 0 4px 0' }}>
                  {content.formTitle}
                </h3>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '6px' }}>
                    {isRtl ? 'בחר תחום שירות' : 'Select Service Category'}
                  </label>
                  <select
                    style={{
                      width: '100%',
                      minHeight: '44px',
                      padding: '8px 12px',
                      backgroundColor: 'var(--studio-surface)',
                      border: '1px solid var(--studio-border)',
                      borderRadius: 'var(--studio-radius)',
                      color: 'var(--studio-text)',
                      fontSize: '13px',
                      outline: 'none',
                    }}
                  >
                    {content.serviceTypes?.map((s, idx) => (
                      <option key={idx} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '6px' }}>
                      {isRtl ? 'עיר / מיקוד' : 'Zip / Postal Code'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isRtl ? 'תל אביב' : '10001'}
                      value={zip}
                      onChange={(e) => setZip(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--studio-surface)',
                        border: '1px solid var(--studio-border)',
                        borderRadius: 'var(--studio-radius)',
                        color: 'var(--studio-text)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--studio-muted)', marginBottom: '6px' }}>
                      {isRtl ? 'טלפון לחזרה' : 'Direct Phone'}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={isRtl ? '054-000-0000' : '555-0199'}
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      style={{
                        width: '100%',
                        minHeight: '44px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--studio-surface)',
                        border: '1px solid var(--studio-border)',
                        borderRadius: 'var(--studio-radius)',
                        color: 'var(--studio-text)',
                        fontSize: '13px',
                        outline: 'none',
                      }}
                    />
                  </div>
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
                    marginTop: '8px',
                  }}
                >
                  <span>{content.ctaButtonText}</span>
                  {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
