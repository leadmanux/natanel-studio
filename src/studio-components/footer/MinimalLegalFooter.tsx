import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';

export interface MinimalLegalFooterContent {
  brandName?: string;
  copyright?: string;
  legalNotice?: string;
}

export function MinimalLegalFooter(props: StudioComponentProps<MinimalLegalFooterContent>) {
  const isRtl = props.direction === 'rtl';

  const brand = props.content?.brandName || 'NATANEL STUDIO';
  const copyright = props.content?.copyright || (isRtl ? `© ${new Date().getFullYear()} סטודיו נתנאל. כל הזכויות שמורות.` : `© ${new Date().getFullYear()} Natanel Studio. All rights reserved.`);
  const legal = props.content?.legalNotice || (isRtl ? 'תנאי שימוש • מדיניות פרטיות • הצהרת נגישות' : 'Terms of Service • Privacy Notice • Accessibility Statement');

  return (
    <StudioComponentWrapper {...props}>
      <footer
        style={{
          width: '100%',
          padding: '32px 24px',
          borderTop: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            fontSize: '12px',
            color: 'var(--studio-muted)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontFamily: 'var(--studio-font-display)', fontWeight: 700, color: 'var(--studio-text)', letterSpacing: '0.04em' }}>
              {brand}
            </span>
            <span>{copyright}</span>
          </div>

          <div>
            <span>{legal}</span>
          </div>
        </div>
      </footer>
    </StudioComponentWrapper>
  );
}
