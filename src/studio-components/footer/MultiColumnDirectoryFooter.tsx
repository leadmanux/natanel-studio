import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Send, Check } from 'lucide-react';

export interface DirectoryFooterContent {
  brandName?: string;
  tagline?: string;
}

export function MultiColumnDirectoryFooter(props: StudioComponentProps<DirectoryFooterContent>) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const isRtl = props.direction === 'rtl';

  const isProduction = props.contentMode === 'production';
  const brand = props.content?.brandName || (isProduction ? '' : 'NATANEL STUDIO');
  const tagline = props.content?.tagline || (isProduction ? '' : (isRtl ? 'אדריכלות, עיצוב פנים וחללי מגורים מובחרים' : 'Architecture, Interior Form & Bespoke Commissions'));

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    setSubscribed(true);
  };

  return (
    <StudioComponentWrapper {...props}>
      <footer
        style={{
          width: '100%',
          padding: '64px 24px 32px',
          borderTop: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-surface)',
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
          {/* Top 4 Columns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.4fr 1fr 1fr 1.2fr',
              gap: '40px',
            }}
            className="grid-4col"
          >
            {/* Col 1: Brand */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontFamily: 'var(--studio-font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--studio-text)' }}>
                {brand}
              </span>
              <p style={{ fontSize: '13.5px', lineHeight: 1.6, color: 'var(--studio-muted)', margin: 0 }}>
                {tagline}
              </p>
            </div>

            {/* Col 2: Services */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <strong style={{ color: 'var(--studio-text)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {isRtl ? 'שירותי תכנון' : 'Disciplines'}
              </strong>
              <a href="#services" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'תכנון וילות יוקרה' : 'Residential Estates'}</a>
              <a href="#services" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'עיצוב פנים ונגרות' : 'Artisan Millwork'}</a>
              <a href="#services" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'פיקוח וניהול פרויקט' : 'Site Administration'}</a>
              <a href="#services" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'הדמיות 3D ורישוי' : 'Permit Filing'}</a>
            </div>

            {/* Col 3: Legal & Trust */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
              <strong style={{ color: 'var(--studio-text)', fontSize: '12px', textTransform: 'uppercase', marginBottom: '4px' }}>
                {isRtl ? 'מידע ותקנים' : 'Trust & Legal'}
              </strong>
              <a href="#terms" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'תנאי התקשרות' : 'Contract Terms'}</a>
              <a href="#privacy" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'מדיניות פרטיות' : 'Privacy Notice'}</a>
              <a href="#licensing" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'רישיונות וביטוחים' : 'Insurance & Licenses'}</a>
              <a href="#accessibility" style={{ color: 'var(--studio-muted)', textDecoration: 'none' }}>{isRtl ? 'הצהרת נגישות' : 'Accessibility Statement'}</a>
            </div>

            {/* Col 4: Newsletter */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <strong style={{ color: 'var(--studio-text)', fontSize: '12px', textTransform: 'uppercase' }}>
                {isRtl ? 'ניוזלטר אדריכלי' : 'Architectural Dispatch'}
              </strong>
              <p style={{ fontSize: '12.5px', color: 'var(--studio-muted)', margin: 0, lineHeight: 1.5 }}>
                {isRtl ? 'תובנות חודשיות על חומרים, אור טבעי ותכנון עכשווי.' : 'Quarterly monographs exploring materiality, light, and tectonic restraint.'}
              </p>
              {subscribed ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#2e7d32' }}>
                  <Check size={14} />
                  <span>{isRtl ? 'נרשמת בהצלחה!' : 'Subscription active'}</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="email"
                    required
                    placeholder={isRtl ? 'כתובת מייל' : 'Email Address'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{
                      flex: 1,
                      minHeight: '38px',
                      padding: '6px 10px',
                      backgroundColor: 'var(--studio-bg)',
                      border: '1px solid var(--studio-border)',
                      borderRadius: 'var(--studio-radius)',
                      color: 'var(--studio-text)',
                      fontSize: '12.5px',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="submit"
                    aria-label="Subscribe"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '38px',
                      height: '38px',
                      backgroundColor: 'var(--studio-accent)',
                      color: '#111',
                      border: 'none',
                      borderRadius: 'var(--studio-radius)',
                      cursor: 'pointer',
                    }}
                  >
                    <Send size={14} />
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Bottom Line */}
          <div style={{ paddingTop: '24px', borderTop: '1px solid var(--studio-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11.5px', color: 'var(--studio-muted)' }}>
            <span>© {new Date().getFullYear()} {brand}. All rights reserved.</span>
            <span>Handcrafted with architectural rigor</span>
          </div>
        </div>
      </footer>
    </StudioComponentWrapper>
  );
}
