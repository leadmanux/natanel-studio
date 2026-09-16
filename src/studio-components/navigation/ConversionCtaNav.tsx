import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { PhoneCall, Calendar, MessageCircle, Menu, X } from 'lucide-react';

export interface ConversionNavContent {
  brandName?: string;
  badge?: string;
  phone?: string;
  ctaText?: string;
  whatsappEnabled?: boolean;
}

export function ConversionCtaNav(props: StudioComponentProps<ConversionNavContent>) {
  const [open, setOpen] = useState(false);
  const isRtl = props.direction === 'rtl';

  const brand = props.content?.brandName || (isRtl ? 'קבלני הצפון מומחים' : 'PRIME CONTRACTORS & CO');
  const badge = props.content?.badge || (isRtl ? 'זמינות מיידית בפריסה ארצית' : 'Immediate Dispatch Available');
  const phone = props.content?.phone || (isRtl ? '03-555-1234' : '1-800-555-0199');
  const cta = props.content?.ctaText || (isRtl ? 'הצעת מחיר תוך שעתיים' : 'Get Fast Estimate');

  return (
    <StudioComponentWrapper {...props}>
      <header
        style={{
          width: '100%',
          backgroundColor: 'var(--studio-surface)',
          borderBottom: '1px solid var(--studio-border)',
        }}
      >
        {/* Top Emergency/Urgency Bar */}
        <div
          style={{
            backgroundColor: 'var(--studio-bg)',
            borderBottom: '1px solid var(--studio-border)',
            padding: '6px 24px',
            fontSize: '11px',
            color: 'var(--studio-muted)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{badge}</span>
          <a
            href={`tel:${phone}`}
            style={{
              color: 'var(--studio-accent)',
              fontWeight: 700,
              textDecoration: 'none',
              fontFamily: 'monospace',
            }}
          >
            {phone}
          </a>
        </div>

        {/* Main Nav Bar */}
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            padding: '14px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px',
          }}
        >
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: '18px',
                fontWeight: 800,
                letterSpacing: isRtl ? '0' : '0.04em',
                color: 'var(--studio-text)',
              }}
            >
              {brand}
            </span>
          </div>

          {/* Contact Triggers Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href={`tel:${phone}`}
              style={{
                display: 'none',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: 'var(--studio-radius)',
                border: '1px solid var(--studio-border)',
                color: 'var(--studio-text)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
              className="md-flex"
            >
              <PhoneCall size={14} color="var(--studio-accent)" />
              <span>{phone}</span>
            </a>

            <a
              href="#quote"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 22px',
                minHeight: '44px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'var(--studio-accent)',
                color: '#111',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 700,
                letterSpacing: '0.02em',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <Calendar size={15} />
              <span>{cta}</span>
            </a>

            <button
              type="button"
              aria-label="Menu"
              onClick={() => setOpen(!open)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: '1px solid var(--studio-border)',
                color: 'var(--studio-text)',
                cursor: 'pointer',
              }}
              className="md-hide"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {open && (
          <div
            style={{
              padding: '16px 24px 20px',
              borderTop: '1px solid var(--studio-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <a
              href={`tel:${phone}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px',
                background: 'var(--studio-bg)',
                borderRadius: 'var(--studio-radius)',
                color: 'var(--studio-text)',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              <PhoneCall size={16} color="var(--studio-accent)" />
              <span>{phone}</span>
            </a>
          </div>
        )}
      </header>
    </StudioComponentWrapper>
  );
}
