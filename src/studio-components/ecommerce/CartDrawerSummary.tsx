import React, { useState } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ShoppingBag, X, Trash2, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';

export interface CartItem {
  id: string;
  name: string;
  variant: string;
  price: string;
  quantity: number;
  image: string;
}

export interface CartDrawerContent {
  drawerTitle?: string;
  items?: CartItem[];
  subtotal?: string;
  shippingNote?: string;
  checkoutButtonText?: string;
}

export function CartDrawerSummary(props: StudioComponentProps<CartDrawerContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultItems: CartItem[] = isRtl
    ? [
        {
          id: 'c1',
          name: 'מנורת שולחן טרוורטין רומית',
          variant: 'בסיס אבן טבעית • גימור פליז מוברש',
          price: '₪1,280',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'c2',
          name: 'מגש אירוח אלון מעושן',
          variant: 'אורך 45 ס״מ • עבודת יד',
          price: '₪540',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=300&q=80',
        },
      ]
    : [
        {
          id: 'c1',
          name: 'Roman Travertine Lamp',
          variant: 'Honed Stone • Brushed Brass',
          price: '$380',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=300&q=80',
        },
        {
          id: 'c2',
          name: 'Smoked Oak Serving Tray',
          variant: '45 cm • Artisan Joinery',
          price: '$160',
          quantity: 1,
          image: 'https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=300&q=80',
        },
      ];

  const title = props.content?.drawerTitle || (isRtl ? 'סל רכישות אדריכלי' : 'Your Selected Commissions');
  const [items, setItems] = useState<CartItem[]>(props.content?.items || defaultItems);
  const subtotal = props.content?.subtotal || (isRtl ? '₪1,820' : '$540');
  const shippingNote = props.content?.shippingNote || (isRtl ? 'הזמנה זו זכאית למשלוח מבוטח חינם עד הבית' : 'Eligible for complimentary insured courier dispatch');
  const checkoutBtn = props.content?.checkoutButtonText || (isRtl ? 'המשך לתשלום מאובטח' : 'Proceed to Sovereign Checkout');

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
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
            maxWidth: '520px',
            margin: '0 auto',
            borderRadius: 'var(--studio-radius)',
            border: '1px solid var(--studio-border)',
            backgroundColor: 'var(--studio-surface)',
            padding: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--studio-border)', paddingBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShoppingBag size={18} color="var(--studio-accent)" />
              <h3 style={{ fontFamily: 'var(--studio-font-display)', fontSize: '18px', fontWeight: 600, color: 'var(--studio-text)', margin: 0 }}>
                {title}
              </h3>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--studio-muted)', fontFamily: 'monospace' }}>
              {items.length} {isRtl ? 'פריטים' : 'items'}
            </span>
          </div>

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  paddingBottom: '16px',
                  borderBottom: '1px solid var(--studio-border)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: 'var(--studio-radius)',
                    overflow: 'hidden',
                    backgroundColor: 'var(--studio-bg)',
                    border: '1px solid var(--studio-border)',
                    flexShrink: 0,
                  }}
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                  <strong style={{ fontSize: '13.5px', color: 'var(--studio-text)' }}>
                    {item.name}
                  </strong>
                  <span style={{ fontSize: '11.5px', color: 'var(--studio-muted)' }}>
                    {item.variant}
                  </span>
                  <span style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--studio-accent)' }}>
                    {item.price}
                  </span>
                </div>

                <button
                  type="button"
                  aria-label="Remove item"
                  onClick={() => removeItem(item.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--studio-muted)',
                    cursor: 'pointer',
                    padding: '8px',
                  }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>

          {/* Subtotal and Shipping */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: '14px', color: 'var(--studio-muted)' }}>
                {isRtl ? 'סה״כ לתשלום' : 'Subtotal'}
              </span>
              <span style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--studio-text)' }}>
                {subtotal}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#2e7d32' }}>
              <ShieldCheck size={14} />
              <span>{shippingNote}</span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            type="button"
            onClick={() => props.onAction && props.onAction('checkout_initiated', { items })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              minHeight: '48px',
              backgroundColor: 'var(--studio-accent)',
              color: '#111',
              border: 'none',
              borderRadius: 'var(--studio-radius)',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <span>{checkoutBtn}</span>
            {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
          </button>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
