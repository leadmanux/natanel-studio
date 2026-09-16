import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Star, ShoppingBag, Check, Shield } from 'lucide-react';

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

  const defaultContent = isRtl
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

  const content = { ...defaultContent, ...props.content };
  const productImage = props.assets?.product?.url ||
    'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?auto=format&fit=crop&w=800&q=80';

  const handleAddToCart = () => {
    setAdded(true);
    if (props.onAction) {
      props.onAction('add_to_cart', { product: content.productName, price: content.price });
    }
    setTimeout(() => setAdded(false), 2400);
  };

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
            </div>
          </div>

          {/* Commerce Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Rating */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ display: 'flex', color: 'var(--studio-accent)' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--studio-text)' }}>
                {content.ratingScore}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                ({content.reviewCount})
              </span>
            </div>

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
