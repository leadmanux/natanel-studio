import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Globe, Menu, X } from 'lucide-react';

export interface CenteredNavContent {
  brandName?: string;
  brandMonogram?: string;
  leftLinks?: { label: string; href: string }[];
  rightLinks?: { label: string; href: string }[];
}

export function CenteredLuxuryNav(props: StudioComponentProps<CenteredNavContent>) {
  const [open, setOpen] = useState(false);
  const isRtl = props.direction === 'rtl';

  const defaultLeft = isRtl
    ? [
        { label: 'קולקציה', href: '#collection' },
        { label: 'אטלייה', href: '#atelier' },
      ]
    : [
        { label: 'Haute Collection', href: '#collection' },
        { label: 'The Atelier', href: '#atelier' },
      ];

  const defaultRight = isRtl
    ? [
        { label: 'מורשת', href: '#heritage' },
        { label: 'הזמנה אישית', href: '#bespoke' },
      ]
    : [
        { label: 'Heritage', href: '#heritage' },
        { label: 'Private Salon', href: '#bespoke' },
      ];

  const brand = props.content?.brandName || (isRtl ? 'מזון דה לוקס' : 'MAISON DE L’ART');
  const monogram = props.content?.brandMonogram || 'M';
  const left = props.content?.leftLinks || defaultLeft;
  const right = props.content?.rightLinks || defaultRight;

  return (
    <StudioComponentWrapper {...props}>
      <header
        style={{
          width: '100%',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
          padding: '20px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Left Navigation */}
          <nav style={{ display: 'none', alignItems: 'center', gap: '28px' }} className="md-flex">
            {left.map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                style={{
                  fontSize: '12px',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'var(--studio-muted)',
                  textDecoration: 'none',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--studio-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--studio-muted)')}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Centered Monogram & Brand Title */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--studio-accent)',
                color: 'var(--studio-accent)',
                fontFamily: 'var(--studio-font-display)',
                fontSize: '14px',
                fontWeight: 700,
              }}
            >
              {monogram}
            </span>
            <span
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: '17px',
                fontWeight: 600,
                letterSpacing: isRtl ? '0.02em' : '0.16em',
                color: 'var(--studio-text)',
                textTransform: 'uppercase',
              }}
            >
              {brand}
            </span>
          </div>

          {/* Right Navigation & Currency/Lang */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '24px' }}>
            <nav style={{ display: 'none', alignItems: 'center', gap: '28px' }} className="md-flex">
              {right.map((item, idx) => (
                <a
                  key={idx}
                  href={item.href}
                  style={{
                    fontSize: '12px',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                    color: 'var(--studio-muted)',
                    textDecoration: 'none',
                    transition: 'color 0.2s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--studio-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--studio-muted)')}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <button
              type="button"
              aria-label="Toggle Menu"
              onClick={() => setOpen(!open)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
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
              marginTop: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--studio-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              textAlign: 'center',
            }}
          >
            {[...left, ...right].map((item, idx) => (
              <a
                key={idx}
                href={item.href}
                onClick={() => setOpen(false)}
                style={{
                  fontSize: '13px',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--studio-text)',
                  textDecoration: 'none',
                  padding: '8px 0',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </StudioComponentWrapper>
  );
}
