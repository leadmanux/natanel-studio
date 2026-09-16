import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Play, ArrowRight, ArrowLeft } from 'lucide-react';

export interface CinematicHeroContent {
  title?: string;
  subtitle?: string;
  location?: string;
  ctaText?: string;
}

export function CinematicMediaHero(props: StudioComponentProps<CinematicHeroContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        title: 'יופי ארכיטקטוני בר קיימא.',
        subtitle: 'וילות חוף, מבני יוקרה ומתחמי בוטיק המתוכננים בהרמוניה טוטאלית עם הנוף המקומי.',
        location: 'תל אביב • קיסריה • ירושלים',
        ctaText: 'צפו בסיור האדריכלי',
      }
    : {
        title: 'Timeless Architectural Presence.',
        subtitle: 'Coastal sanctuaries, private estates, and cultural monoliths sculpted in direct dialogue with the horizon.',
        location: 'Tel Aviv • Caesarea • Jerusalem',
        ctaText: 'View Architectural Film',
      };

  const content = { ...defaultContent, ...props.content };
  const bannerImage = props.assets?.['hero-panorama']?.url ||
    'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80';

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          position: 'relative',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: '#000',
        }}
      >
        {/* Cinematic Aspect Ratio Container */}
        <div
          style={{
            width: '100%',
            minHeight: '480px',
            height: '62vh',
            maxHeight: '760px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <img
            src={bannerImage}
            alt={content.title}
            referrerPolicy="no-referrer"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: 'brightness(0.65)',
            }}
          />

          {/* Vignette Overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
            }}
          />

          {/* Content Grounded at Bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '48px 24px',
            }}
          >
            <div
              style={{
                maxWidth: 'var(--studio-content-width)',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--studio-accent)',
                  fontWeight: 600,
                }}
              >
                {content.location}
              </span>

              <h1
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: 'clamp(28px, 4vw, 52px)',
                  lineHeight: 1.15,
                  fontWeight: 600,
                  color: '#ffffff',
                  margin: 0,
                  maxWidth: '780px',
                }}
              >
                {content.title}
              </h1>

              <p
                style={{
                  fontSize: '15px',
                  color: '#d4d4d8',
                  maxWidth: '600px',
                  margin: 0,
                  lineHeight: 1.6,
                }}
              >
                {content.subtitle}
              </p>

              <div style={{ paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <a
                  href="#tour"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '12px 24px',
                    minHeight: '44px',
                    backgroundColor: 'var(--studio-accent)',
                    color: '#111113',
                    borderRadius: 'var(--studio-radius)',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Play size={14} fill="currentColor" />
                  <span>{content.ctaText}</span>
                  {isRtl ? <ArrowLeft size={14} /> : <ArrowRight size={14} />}
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
