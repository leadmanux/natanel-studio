import React, { useState, useRef, useCallback } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ChevronsLeftRight } from 'lucide-react';

export interface BeforeAfterContent {
  title?: string;
  subtitle?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider(props: StudioComponentProps<BeforeAfterContent>) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        title: 'טרנספורמציה אדריכלית: לפני ואחרי',
        subtitle: 'גררו את המחוון כדי להשוות בין המצב הקיים לבין היצירה האדריכלית המושלמת.',
        beforeLabel: 'לפני השיפוץ (מצב קיים)',
        afterLabel: 'לאחר מסירה אדריכלית',
      }
    : {
        title: 'Spatial Metamorphosis: Before & After',
        subtitle: 'Drag the slider to examine the architectural transformation from derelict shell to sovereign residence.',
        beforeLabel: 'Pre-Commission Raw Shell',
        afterLabel: 'Handed-Over Residence',
      };

  const content = { ...defaultContent, ...props.content };
  const beforeImg = props.assets?.before?.url ||
    'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80';
  const afterImg = props.assets?.after?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80';

  const updatePos = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      let percentage = (x / rect.width) * 100;
      if (isRtl) {
        percentage = 100 - percentage;
      }
      percentage = Math.max(5, Math.min(95, percentage));
      setSliderPos(percentage);
    },
    [isRtl]
  );

  const handlePointerDown = () => {
    isDragging.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    updatePos(e.clientX);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
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
            gap: '32px',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'var(--studio-font-display)',
                fontSize: 'clamp(26px, 3.2vw, 40px)',
                fontWeight: 600,
                color: 'var(--studio-text)',
                margin: '0 0 8px 0',
              }}
            >
              {content.title}
            </h2>
            <p style={{ fontSize: '15px', color: 'var(--studio-muted)', margin: 0 }}>
              {content.subtitle}
            </p>
          </div>

          {/* Interactive Before/After Canvas */}
          <div
            ref={containerRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{
              position: 'relative',
              width: '100%',
              aspectRatio: '16/9',
              borderRadius: 'var(--studio-radius)',
              overflow: 'hidden',
              border: '1px solid var(--studio-border)',
              userSelect: 'none',
              cursor: 'ew-resize',
              touchAction: 'none',
            }}
          >
            {/* After Image (Background layer) */}
            <img
              src={afterImg}
              alt="After Architecture"
              referrerPolicy="no-referrer"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Before Image (Clipped layer) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                clipPath: isRtl
                  ? `inset(0 0 0 ${sliderPos}%)`
                  : `inset(0 ${100 - sliderPos}% 0 0)`,
              }}
            >
              <img
                src={beforeImg}
                alt="Before Architecture"
                referrerPolicy="no-referrer"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  filter: 'grayscale(0.4) contrast(0.9)',
                }}
              />
            </div>

            {/* Divider Handle Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: isRtl ? `${100 - sliderPos}%` : `${sliderPos}%`,
                width: '2px',
                backgroundColor: 'var(--studio-accent)',
                transform: 'translateX(-50%)',
                zIndex: 10,
                boxShadow: '0 0 12px rgba(0,0,0,0.5)',
              }}
            >
              {/* Central Grab Handle Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--studio-bg)',
                  border: '2px solid var(--studio-accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--studio-text)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}
              >
                <ChevronsLeftRight size={16} />
              </div>
            </div>

            {/* Corner Badges */}
            <span
              style={{
                position: 'absolute',
                bottom: '16px',
                [isRtl ? 'right' : 'left']: '16px',
                padding: '6px 12px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: '#fff',
                fontSize: '11.5px',
                fontWeight: 600,
                fontFamily: 'monospace',
                zIndex: 5,
              }}
            >
              {content.beforeLabel}
            </span>

            <span
              style={{
                position: 'absolute',
                bottom: '16px',
                [isRtl ? 'left' : 'right']: '16px',
                padding: '6px 12px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'rgba(0,0,0,0.7)',
                color: 'var(--studio-accent)',
                fontSize: '11.5px',
                fontWeight: 600,
                fontFamily: 'monospace',
                zIndex: 5,
              }}
            >
              {content.afterLabel}
            </span>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
