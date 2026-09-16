import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Menu, X } from 'lucide-react';

export interface EditorialNavContent {
  brandName?: string;
  brandSub?: string;
  links?: { number: string; title: string; href: string }[];
  phoneLabel?: string;
}

export function EditorialAsymmetricNav(props: StudioComponentProps<EditorialNavContent>) {
  const [open, setOpen] = useState(false);
  const isRtl = props.direction === 'rtl';

  const defaultLinks = isRtl
    ? [
        { number: '01', title: 'פרויקטים נבחרים', href: '#projects' },
        { number: '02', title: 'שירותי תכנון וביצוע', href: '#services' },
        { number: '03', title: 'פילוסופיית עיצוב', href: '#philosophy' },
        { number: '04', title: 'יצירת קשר', href: '#contact' },
      ]
    : [
        { number: '01', title: 'Curated Works', href: '#projects' },
        { number: '02', title: 'Practice & Method', href: '#services' },
        { number: '03', title: 'Architectural Philosophy', href: '#philosophy' },
        { number: '04', title: 'Direct Commission', href: '#contact' },
      ];

  const brand = props.content?.brandName || (isRtl ? 'ארכיטקטורה ועיצוב' : 'ARCHITECTURAL MONOLITH');
  const sub = props.content?.brandSub || (isRtl ? 'תל אביב • פריז' : 'Tel Aviv • Paris');
  const links = props.content?.links || defaultLinks;
  const phone = props.content?.phoneLabel || (isRtl ? '+972 3 987 6543' : '+1 212 555 0192');

  return (
    <StudioComponentWrapper {...props}>
      <header
        style={{
          width: '100%',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
          padding: '18px 24px',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* Brand & Subtitle */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: '18px',
                fontWeight: 700,
                letterSpacing: isRtl ? '0' : '0.08em',
                color: 'var(--studio-text)',
              }}
            >
              {brand}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--studio-muted)', letterSpacing: '0.04em' }}>
              {sub}
            </span>
          </div>

          {/* Desktop Asymmetric Nav Index */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '28px',
            }}
            className="md-flex"
          >
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                style={{
                  display: 'inline-flex',
                  alignItems: 'baseline',
                  gap: '6px',
                  textDecoration: 'none',
                  color: 'var(--studio-text)',
                  fontSize: '13px',
                }}
              >
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--studio-accent)' }}>
                  {link.number}
                </span>
                <span style={{ color: 'var(--studio-muted)', transition: 'color 0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--studio-text)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--studio-muted)')}
                >
                  {link.title}
                </span>
              </a>
            ))}
          </nav>

          {/* Direct Phone / Contact */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <a
              href="tel:#"
              style={{
                fontSize: '12px',
                fontFamily: 'monospace',
                color: 'var(--studio-text)',
                textDecoration: 'none',
                letterSpacing: '0.05em',
              }}
              className="md-flex"
            >
              {phone}
            </a>

            <button
              type="button"
              aria-label="Toggle Navigation"
              onClick={() => setOpen(!open)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                background: 'transparent',
                border: '1px solid var(--studio-border)',
                borderRadius: 'var(--studio-radius)',
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
            }}
          >
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                onClick={() => setOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--studio-text)',
                  textDecoration: 'none',
                  fontSize: '14px',
                  padding: '6px 0',
                }}
              >
                <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'var(--studio-accent)' }}>
                  {link.number}
                </span>
                <span>{link.title}</span>
              </a>
            ))}
          </div>
        )}
      </header>
    </StudioComponentWrapper>
  );
}
