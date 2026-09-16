import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Menu, X, ArrowUpRight, ArrowUpLeft } from 'lucide-react';

export interface NavLinkItem {
  label: string;
  href: string;
}

export interface NavContent {
  brandName?: string;
  brandTagline?: string;
  links?: NavLinkItem[];
  ctaLabel?: string;
  ctaHref?: string;
}

export function TransparentRestrainedNav(props: StudioComponentProps<NavContent>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isRtl = props.direction === 'rtl';

  const defaultLinks: NavLinkItem[] = isRtl
    ? [
        { label: 'פרויקטים', href: '#projects' },
        { label: 'שירותים', href: '#services' },
        { label: 'אודות הסטודיו', href: '#about' },
        { label: 'ביקורות', href: '#reviews' },
      ]
    : [
        { label: 'Projects', href: '#projects' },
        { label: 'Expertise', href: '#services' },
        { label: 'Atelier', href: '#about' },
        { label: 'Journal', href: '#journal' },
      ];

  const brand = props.content?.brandName || (isRtl ? 'סטודיו נתנאל' : 'NATANEL ATELIER');
  const links = props.content?.links || defaultLinks;
  const cta = props.content?.ctaLabel || (isRtl ? 'תיאום פגישה' : 'Inquire');

  return (
    <StudioComponentWrapper {...props}>
      <header
        style={{
          width: '100%',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
          position: 'relative',
          zIndex: 40,
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* Brand Mark */}
          <a
            href="#"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              textDecoration: 'none',
              color: 'var(--studio-text)',
            }}
          >
            <span
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: '17px',
                fontWeight: 700,
                letterSpacing: isRtl ? '0' : '0.12em',
                textTransform: 'uppercase',
              }}
            >
              {brand}
            </span>
          </a>

          {/* Desktop Navigation Links */}
          <nav
            style={{
              display: 'none',
              alignItems: 'center',
              gap: '32px',
            }}
            className="md-flex"
          >
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                style={{
                  fontSize: '13.5px',
                  fontWeight: 500,
                  color: 'var(--studio-muted)',
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--studio-text)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--studio-muted)')}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Trigger / Mobile Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <a
              href="#contact"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 20px',
                minHeight: '44px',
                backgroundColor: 'var(--studio-surface)',
                border: '1px solid var(--studio-border)',
                borderRadius: 'var(--studio-radius)',
                color: 'var(--studio-text)',
                fontSize: '12.5px',
                fontWeight: 600,
                textDecoration: 'none',
                letterSpacing: '0.04em',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, background 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--studio-accent)')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--studio-border)')}
            >
              <span>{cta}</span>
              {isRtl ? <ArrowUpLeft size={14} /> : <ArrowUpRight size={14} />}
            </a>

            <button
              type="button"
              aria-label="Toggle Navigation"
              onClick={() => setMobileOpen(!mobileOpen)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                background: 'transparent',
                border: '1px solid var(--studio-border)',
                borderRadius: 'var(--studio-radius)',
                color: 'var(--studio-text)',
                cursor: 'pointer',
              }}
              className="md-hide"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Panel */}
        {mobileOpen && (
          <div
            style={{
              padding: '20px 24px 28px',
              backgroundColor: 'var(--studio-surface)',
              borderTop: '1px solid var(--studio-border)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            {links.map((link, idx) => (
              <a
                key={idx}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  fontSize: '15px',
                  fontWeight: 500,
                  color: 'var(--studio-text)',
                  textDecoration: 'none',
                  padding: '8px 0',
                }}
              >
                {link.label}
              </a>
            ))}
          </div>
        )}
      </header>
    </StudioComponentWrapper>
  );
}
