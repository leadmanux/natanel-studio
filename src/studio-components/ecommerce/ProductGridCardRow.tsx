import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Plus, Check, Star } from 'lucide-react';

export interface CatalogProduct {
  id: string;
  name: string;
  collection: string;
  price: string;
  image: string;
  rating: string;
}

export interface ProductGridContent {
  eyebrow?: string;
  title?: string;
  products?: CatalogProduct[];
}

export function ProductGridCardRow(props: StudioComponentProps<ProductGridContent>) {
  const [cartItems, setCartItems] = useState<Record<string, boolean>>({});
  const isRtl = props.direction === 'rtl';

  const defaultProducts: CatalogProduct[] = isRtl
    ? [
        {
          id: 'p1',
          name: 'מנורת שולחן טרוורטין',
          collection: 'אובייקטים אדריכליים',
          price: '₪1,280',
          rating: '5.0',
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'p2',
          name: 'קנקן ברונזה מוברשת',
          collection: 'מהדורה ממוספרת',
          price: '₪890',
          rating: '4.9',
          image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'p3',
          name: 'אגרטל בטון מונוליתי',
          collection: 'יציקות גליליות',
          price: '₪650',
          rating: '4.8',
          image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'p4',
          name: 'מגש עץ אלון מעושן',
          collection: 'נגרות אומן',
          price: '₪540',
          rating: '5.0',
          image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
        },
      ]
    : [
        {
          id: 'p1',
          name: 'Travertine Monolith Lamp',
          collection: 'Architectural Objects',
          price: '$380',
          rating: '5.0',
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'p2',
          name: 'Brushed Bronze Pitcher',
          collection: 'Numbered Edition',
          price: '$260',
          rating: '4.9',
          image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'p3',
          name: 'Monolithic Vessel No. 03',
          collection: 'Concrete Castings',
          price: '$190',
          rating: '4.8',
          image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=600&q=80',
        },
        {
          id: 'p4',
          name: 'Smoked Oak Serving Tray',
          collection: 'Artisan Joinery',
          price: '$160',
          rating: '5.0',
          image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=600&q=80',
        },
      ];

  const eyebrow = props.content?.eyebrow || (isRtl ? 'אובייקטים ועיצוב משלים' : 'THE LIVING COLLECTION');
  const title = props.content?.title || (isRtl ? 'פריטי אספנות ומהדורות מוגבלות' : 'Architectural Objects & Limited Editions');
  const isProduction = props.contentMode === 'production';
  const hasCustomProducts = Boolean(props.content?.products && props.content.products.length > 0);

  if (isProduction && !hasCustomProducts) {
    return (
      <StudioComponentWrapper {...props}>
        <section
          style={{
            width: '100%',
            padding: '48px 24px',
            borderBottom: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-bg)',
            textAlign: 'center',
          }}
        >
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--studio-text)',
                marginBottom: '8px',
              }}
            >
              {title}
            </h2>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--studio-muted)', fontStyle: 'italic' }}>
              {isRtl
                ? 'מוצרים ומחירים יוצגו לאחר חיבור קולקציית Shopify או הזנת פריטי קטלוג בפרויקט.'
                : 'Products and prices will be rendered once connected to Shopify or inventory is supplied.'}
            </p>
          </div>
        </section>
      </StudioComponentWrapper>
    );
  }

  const products = props.content?.products || defaultProducts;

  const handleAdd = (id: string, name: string) => {
    setCartItems((prev) => ({ ...prev, [id]: true }));
    if (props.onAction) {
      props.onAction('add_to_cart', { id, name });
    }
    setTimeout(() => {
      setCartItems((prev) => ({ ...prev, [id]: false }));
    }, 2000);
  };

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: 'var(--studio-section-space) 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-bg)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '36px',
          }}
        >
          <div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'monospace',
                letterSpacing: '0.14em',
                color: 'var(--studio-accent)',
                textTransform: 'uppercase',
                fontWeight: 700,
              }}
            >
              {eyebrow}
            </span>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(26px, 3.2vw, 40px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '6px 0 0 0',
              }}
            >
              {title}
            </h2>
          </div>

          {/* 4 Column Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '24px',
            }}
            className="grid-4col"
          >
            {products.map((p) => {
              const isAdded = cartItems[p.id];
              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '1/1',
                      borderRadius: 'var(--studio-radius)',
                      overflow: 'hidden',
                      backgroundColor: 'var(--studio-surface)',
                      border: '1px solid var(--studio-border)',
                      position: 'relative',
                    }}
                  >
                    <img
                      src={p.image}
                      alt={p.name}
                      referrerPolicy="no-referrer"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />

                    {/* Quick Add overlay button */}
                    <button
                      type="button"
                      aria-label="Add to cart"
                      onClick={() => handleAdd(p.id, p.name)}
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        [isRtl ? 'left' : 'right']: '12px',
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: isAdded ? '#2e7d32' : 'var(--studio-bg)',
                        color: isAdded ? '#fff' : 'var(--studio-text)',
                        border: '1px solid var(--studio-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {isAdded ? <Check size={16} /> : <Plus size={16} />}
                    </button>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontSize: '12px', color: 'var(--studio-muted)' }}>
                      {p.collection}
                    </span>
                    {p.rating ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--studio-accent)' }}>
                        <Star size={11} fill="currentColor" />
                        <span>{p.rating}</span>
                      </div>
                    ) : null}
                  </div>

                  <h3
                    style={{
                      fontFamily: 'var(--studio-font-display)',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: 'var(--studio-text)',
                      margin: 0,
                    }}
                  >
                    {p.name}
                  </h3>

                  <span style={{ fontSize: '14px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--studio-text)' }}>
                    {p.price}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
