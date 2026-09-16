import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Star, ShoppingBag, Check, Shield, AlertCircle } from 'lucide-react';
import { resolveComponentContent, resolveProductionAsset } from '../contentModeHelper';

export interface ProductHeroContent {
  tagline?: string;
  productName?: string;
  description?: string;
  price?: string;
  originalPrice?: string;
  ratingScore?: string;
  reviewCount?: string;
  ctaText?: string;
  shippingNote?: string;
}

export function ProductCommerceHero(props: StudioComponentProps<ProductHeroContent>) {
  const [added, setAdded] = useState(false);
  const isRtl = props.direction === 'rtl';

  const defaultContent: ProductHeroContent = isRtl
    ? {
        tagline: 'מהדורה בוטנית מוגבלת',
        productName: 'סרום שיקום מולטי-פפטיד',
        description: 'פורמולציה מדעית בריכוז פעיל מקסימלי להזנה עמוקה ומיצוק העור, מבוססת תמציות צמחי מרפא אורגניות.',
        price: '₪340',
        originalPrice: '₪420',
        ratingScore: '4.95',
        reviewCount: '1,420 חוות דעת מאומתות',
        ctaText: 'הוספה לסל הרכישה',
        shippingNote: 'משלוח אקספרס חינם ברכישה מעל ₪250',
      }
    : {
        tagline: 'Limited Botanical Release',
        productName: 'Multi-Peptide Restorative Serum',
        description: 'High-potency cellular formulation delivering bio-identical moisture retention, collagen renewal, and barrier reinforcement.',
        price: '$88',
        originalPrice: '$110',
        ratingScore: '4.96',
        reviewCount: '1,420 Verified Reviews',
        ctaText: 'Add to Cart — Instant Dispatch',
        shippingNote: 'Complimentary courier shipping on orders over $100',
      };

  const { content, isProduction, missingRequired } = resolveComponentContent(props, defaultContent, {
    claimFields: [
      'productName',
      'price',
      'originalPrice',
      'ratingScore',
      'reviewCount',
      'shippingNote',
      'description',
      'tagline',
    ],
    requiredFields: ['productName', 'price'],
    structuralDefaults: {
      ctaText: isRtl ? 'הוספה לסל' : 'Add to Cart',
    },
  });

  const previewFallbackImg = 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80';
  const productImage = resolveProductionAsset(props.assets?.product?.url, previewFallbackImg, isProduction);

  const handleAddToCart = () => {
    setAdded(true);
    if (props.onAction) {
      props.onAction('add_to_cart', { product: content.productName, price: content.price });
    }
    setTimeout(() => setAdded(false), 2400);
  };

  if (isProduction && missingRequired.length > 0) {
    return (
      <StudioComponentWrapper {...props}>
        <section
          style={{
            width: '100%',
            padding: '48px 24px',
            borderBottom: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-surface)',
          }}
        >
          <div
            style={{
              maxWidth: '640px',
              margin: '0 auto',
              padding: '24px',
              border: '1px dashed #f59e0b',
              borderRadius: 'var(--studio-radius)',
              backgroundColor: 'rgba(245, 158, 11, 0.05)',
              display: 'flex',
              gap: '16px',
              alignItems: 'flex-start',
            }}
          >
            <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h4 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 600, color: 'var(--studio-text)' }}>
                {isRtl ? 'חסרים שדות חובה בייצור (ProductCommerceHero)' : 'Production Mode: Required Product Fields Missing'}
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--studio-muted)' }}>
                {isRtl
                  ? `השדות הבאים נדרשים ואינם מולאים אוטומטית בנתוני דמה: ${missingRequired.join(', ')}`
                  : `In production mode, product data is never fabricated. Missing required props.content fields: ${missingRequired.join(', ')}`}
              </p>
            </div>
          </div>
        </section>
      </StudioComponentWrapper>
    );
  }

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            alignItems: 'center',
            gap: '56px',
          }}
          className="grid-split"
        >
          {/* Visual Product Showcase */}
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '480px',
                aspectRatio: '4/5',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'var(--studio-surface)',
                border: '1px solid var(--studio-border)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {productImage ? (
                <img
                  src={productImage}
                  alt={content.productName}
                  referrerPolicy="no-referrer"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                    gap: '8px',
                    color: 'var(--studio-muted)',
                    fontSize: '13px',
                    padding: '24px',
                    textAlign: 'center',
                  }}
                >
                  <ShoppingBag size={28} strokeWidth={1.5} />
                  <span>{isRtl ? 'מקום לתמונת מוצר (יחס 4:5)' : 'Product Asset Slot (4:5 Ratio)'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Commerce Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Rating */}
            {content.ratingScore && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ display: 'flex', color: 'var(--studio-accent)' }}>
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={14} fill="currentColor" />
                  ))}
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--studio-text)' }}>
                  {content.ratingScore}
                </span>
                {content.reviewCount && (
                  <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                    ({content.reviewCount})
                  </span>
                )}
              </div>
            )}

            <span
              style={{
                fontSize: '11px',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'var(--studio-accent)',
                fontWeight: 700,
              }}
            >
              {content.tagline}
            </span>

            <h1
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(28px, 3.8vw, 46px)',
                lineHeight: 1.15,
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: 0,
              }}
            >
              {content.productName}
            </h1>

            <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--studio-muted)', margin: 0 }}>
              {content.description}
            </p>

            {/* Pricing */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px' }}>
              <span
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  color: 'var(--studio-text)',
                }}
              >
                {content.price}
              </span>
              <span
                style={{
                  fontSize: '16px',
                  color: 'var(--studio-muted)',
                  textDecoration: 'line-through',
                  fontFamily: 'monospace',
                }}
              >
                {content.originalPrice}
              </span>
            </div>

            {/* Cart Trigger */}
            <div style={{ paddingTop: '8px' }}>
              <button
                type="button"
                onClick={handleAddToCart}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  width: '100%',
                  maxWidth: '380px',
                  minHeight: '48px',
                  padding: '14px 28px',
                  backgroundColor: added ? '#2e7d32' : 'var(--studio-accent)',
                  color: added ? '#fff' : '#111',
                  border: 'none',
                  borderRadius: 'var(--studio-radius)',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                {added ? (
                  <>
                    <Check size={18} />
                    <span>{isRtl ? 'נוסף לסל בהצלחה' : 'Added to Bag'}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag size={18} />
                    <span>{content.ctaText}</span>
                  </>
                )}
              </button>
            </div>

            {/* Trust shipping note */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--studio-muted)' }}>
              <Shield size={14} color="var(--studio-accent)" />
              <span>{content.shippingNote}</span>
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
