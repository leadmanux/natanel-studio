import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ChevronDown, ChevronUp, Shield, Truck, RefreshCw } from 'lucide-react';

export interface ProductDetailContent {
  title?: string;
  specs?: { label: string; value: string }[];
  careInstructions?: string;
  warrantyTerms?: string;
}

export function ProductDetailAccordion(props: StudioComponentProps<ProductDetailContent>) {
  const [openTab, setOpenTab] = useState<'specs' | 'care' | 'warranty'>('specs');
  const isRtl = props.direction === 'rtl';

  const defaultSpecs = isRtl
    ? [
        { label: 'חומר גלם עיקרי', value: 'אבן טרוורטין רומית טבעית מלוטשת ידנית' },
        { label: 'מידות אובייקט', value: 'גובה: 38 ס״מ • קוטר בסיס: 18 ס״מ' },
        { label: 'משקל כולל', value: '4.8 ק״ג' },
        { label: 'מפרט חשמלי', value: 'נורת LED חמה 2700K מובנית, דימר מגע נסתר' },
        { label: 'ארץ ייצור', value: 'איטליה • גימור באטלייה סטודיו נתנאל' },
      ]
    : [
        { label: 'Primary Matter', value: 'Honed Italian Roman Travertine & Brushed Brass' },
        { label: 'Dimensions', value: 'Height: 38 cm • Base Diameter: 18 cm' },
        { label: 'Total Mass', value: '4.8 kg solid stone' },
        { label: 'Illumination', value: 'Integrated 2700K warm LED with continuous touch dimming' },
        { label: 'Provenance', value: 'Fabricated in Tuscany, finished at Natanel Studio' },
      ];

  const isProduction = props.contentMode === 'production';
  const hasCustomSpecs = Boolean(props.content?.specs && props.content.specs.length > 0);

  if (isProduction && !hasCustomSpecs && !props.content?.warrantyTerms && !props.content?.careInstructions) {
    return (
      <StudioComponentWrapper {...props}>
        <section
          style={{
            width: '100%',
            padding: '24px',
            borderBottom: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-surface)',
            textAlign: 'center',
          }}
        >
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--studio-muted)', fontStyle: 'italic' }}>
            {isRtl
              ? 'מפרט טכני, הוראות טיפול ותנאי אחריות יוצגו בהתאם לפריט שנבחר בחנות.'
              : 'Technical specs, care guidelines, and warranty terms will be rendered for the selected product.'}
          </p>
        </section>
      </StudioComponentWrapper>
    );
  }

  const specs = props.content?.specs || (isProduction ? [] : defaultSpecs);
  const care = props.content?.careInstructions || (isProduction ? '' : (isRtl
    ? 'ניקוי בעזרת מטלית מיקרופייבר לחה בלבד. יש להימנע משימוש בחומרי ניקוי חומציים או שוחקים העלולים לפגוע באיטום האבן הטבעית.'
    : 'Clean exclusively using a lightly dampened microfiber cloth. Avoid acidic cleaners or abrasive chemical detergents to preserve the natural stone sealer.'));
  const warranty = props.content?.warrantyTerms || (isProduction ? '' : (isRtl
    ? 'אחריות יצרן מלאה ל-5 שנים על גוף התאורה, המערכת החשמלית ומנגנון העמעום.'
    : '5-year comprehensive manufacturer warranty covering structural joinery and integrated circadian driver electronics.'));

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
            maxWidth: '780px',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: '24px',
              fontWeight: 600,
              color: 'var(--studio-text)',
              margin: 0,
            }}
          >
            {isRtl ? 'מפרט טכני, חומריות ואחריות' : 'Material Specifications & Provenance'}
          </h2>

          {/* Accordion Tabs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Specs Panel */}
            <div
              style={{
                borderRadius: 'var(--studio-radius)',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-bg)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenTab(openTab === 'specs' ? ('specs' as any) : 'specs')}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--studio-text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left',
                }}
              >
                <span>{isRtl ? 'מפרט חומרים ומידות מדויקות' : 'Material & Dimension Matrix'}</span>
                {openTab === 'specs' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openTab === 'specs' && (
                <div style={{ padding: '0 20px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {specs.map((s, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '8px 0',
                          borderBottom: idx < specs.length - 1 ? '1px solid var(--studio-border)' : 'none',
                          fontSize: '13px',
                        }}
                      >
                        <span style={{ color: 'var(--studio-muted)' }}>{s.label}</span>
                        <strong style={{ color: 'var(--studio-text)', textAlign: isRtl ? 'left' : 'right' }}>{s.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Care Panel */}
            <div
              style={{
                borderRadius: 'var(--studio-radius)',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-bg)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenTab(openTab === 'care' ? ('specs' as any) : 'care')}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--studio-text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left',
                }}
              >
                <span>{isRtl ? 'הוראות תחזוקה ושימור אבן' : 'Care & Maintenance Protocols'}</span>
                {openTab === 'care' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openTab === 'care' && (
                <div style={{ padding: '0 20px 20px', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--studio-muted)' }}>
                  {care}
                </div>
              )}
            </div>

            {/* Warranty Panel */}
            <div
              style={{
                borderRadius: 'var(--studio-radius)',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-bg)',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => setOpenTab(openTab === 'warranty' ? ('specs' as any) : 'warranty')}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--studio-text)',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: isRtl ? 'right' : 'left',
                }}
              >
                <span>{isRtl ? 'תעודת אחריות ואיכות' : 'Warranty & Certification'}</span>
                {openTab === 'warranty' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {openTab === 'warranty' && (
                <div style={{ padding: '0 20px 20px', fontSize: '13.5px', lineHeight: 1.6, color: 'var(--studio-muted)' }}>
                  {warranty}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
