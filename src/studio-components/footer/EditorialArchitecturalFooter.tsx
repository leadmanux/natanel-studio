import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowUpRight, ArrowUpLeft } from 'lucide-react';

export interface ArchitecturalFooterContent {
  brandName?: string;
  tagline?: string;
  address?: string;
  telephone?: string;
  email?: string;
  license?: string;
  copyright?: string;
}

export function EditorialArchitecturalFooter(props: StudioComponentProps<ArchitecturalFooterContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent: ArchitecturalFooterContent = isRtl
    ? {
        brandName: 'NATANEL STUDIO',
        tagline: 'משרד לתכנון אדריכלי, מגורי יוקרה ועיצוב חלל מוקפד.',
        address: 'רחוב הברזל 28, רמת החייל, תל אביב • קומה 6',
        telephone: '03-555-1234',
        email: 'studio@natanel.design',
        license: 'רישום אדריכלי מורשה מס׳ 48291 • כל הזכויות שמורות',
        copyright: '© 2026 סטודיו נתנאל. תוכנן ונבנה בסטנדרט בלתי מתפשר.',
      }
    : {
        brandName: 'NATANEL STUDIO',
        tagline: 'Architectural atelier orchestrating enduring residences and bespoke spatial volumes.',
        address: '28 HaBarzel St, Tel Aviv • Level 06 Atelier',
        telephone: '+972-3-555-1234',
        email: 'atelier@natanel.design',
        license: 'Registered Chamber of Architects No. 48291',
        copyright: '© MMXXVI Natanel Studio. Built to sovereign architectural standards.',
      };

  const isProduction = props.contentMode === 'production';
  const content: ArchitecturalFooterContent = isProduction
    ? {
        brandName: props.content?.brandName || '',
        tagline: props.content?.tagline,
        address: props.content?.address,
        telephone: props.content?.telephone,
        email: props.content?.email,
        license: props.content?.license,
        copyright:
          props.content?.copyright ||
          `© ${new Date().getFullYear()} ${props.content?.brandName || ''}. All rights reserved.`,
      }
    : { ...defaultContent, ...props.content };

  const hasContactInfo = Boolean(content.address || content.telephone || content.email);

  return (
    <StudioComponentWrapper {...props}>
      <footer
        style={{
          width: '100%',
          padding: '64px 24px 36px',
          borderTop: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '48px',
          }}
        >
          {/* Main Content Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr',
              gap: '48px',
            }}
            className="grid-split"
          >
            {/* Brand and Mission */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <span
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: '20px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  color: 'var(--studio-text)',
                }}
              >
                {content.brandName}
              </span>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--studio-muted)', margin: 0, maxWidth: '380px' }}>
                {content.tagline}
              </p>
            </div>

            {/* Atelier Contact */}
            {hasContactInfo && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                <strong style={{ color: 'var(--studio-text)', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em' }}>
                  {isRtl ? 'פרטי התקשרות' : 'Direct Contact'}
                </strong>
                {content.address && <span style={{ color: 'var(--studio-muted)', lineHeight: 1.5 }}>{content.address}</span>}
                {content.telephone && (
                  <a href={`tel:${content.telephone}`} style={{ color: 'var(--studio-text)', textDecoration: 'none', fontFamily: 'monospace' }}>
                    {content.telephone}
                  </a>
                )}
                {content.email && (
                  <a href={`mailto:${content.email}`} style={{ color: 'var(--studio-accent)', textDecoration: 'none' }}>
                    {content.email}
                  </a>
                )}
              </div>
            )}

            {/* Navigation Directory */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <strong style={{ color: 'var(--studio-text)', marginBottom: '4px', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.1em' }}>
                {isRtl ? 'ניווט מהיר' : 'Navigation'}
              </strong>
              <a href="#works" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'פרויקטים נבחרים' : 'Selected Works'}</a>
              <a href="#services" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'תחומי התמחות' : 'Disciplines'}</a>
              <a href="#story" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'אודות הסטודיו' : 'Atelier Story'}</a>
              <a href="#contact" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'תיאום פגישה' : 'Commission Dialogue'}</a>
            </div>
          </div>

          {/* Bottom Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px',
              paddingTop: '24px',
              borderTop: '1px solid var(--studio-border)',
              fontSize: '11.5px',
              color: 'var(--studio-muted)',
            }}
          >
            <span>{content.copyright}</span>
            <span style={{ fontFamily: 'monospace' }}>{content.license}</span>
          </div>
        </div>
      </footer>
    </StudioComponentWrapper>
  );
}
