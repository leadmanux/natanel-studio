import React, { useRef } from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export interface ReelProject {
  title: string;
  category: string;
  year: string;
  image: string;
}

export interface HorizontalReelContent {
  sectionTitle?: string;
  sectionSubtitle?: string;
  projects?: ReelProject[];
}

export function HorizontalProjectReel(props: StudioComponentProps<HorizontalReelContent>) {
  const reelRef = useRef<HTMLDivElement>(null);
  const isRtl = props.direction === 'rtl';

  const defaultProjects: ReelProject[] = isRtl
    ? [
        {
          title: 'בית הבזלת',
          category: 'מגורי יוקרה, גליל',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'וילה 04',
          category: 'מתחם חוף, הרצליה פיתוח',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'פביליון האור',
          category: 'גלריה אדריכלית, יפו',
          year: '2024',
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'דירת מונולית',
          category: 'פנטהאוז, רוטשילד',
          year: '2024',
          image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        },
      ]
    : [
        {
          title: 'Basalt Pavilion',
          category: 'Private Residence, North Coast',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Villa 04 Sovereign',
          category: 'Coastal Sanctuary',
          year: '2025',
          image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Light Sanctuary',
          category: 'Sculptural Atelier',
          year: '2024',
          image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80',
        },
        {
          title: 'Monolith Penthouse',
          category: 'Urban Residence',
          year: '2024',
          image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=800&q=80',
        },
      ];

  const title = props.content?.sectionTitle || (isRtl ? 'גלריית עבודות נבחרות' : 'Selected Project Horizon');
  const subtitle = props.content?.sectionSubtitle || (isRtl ? 'מסע חזותי בין מבנים ויצירות' : 'A kinetic reel of recent architectural commissions.');
  const projects = props.content?.projects || defaultProjects;

  const scroll = (delta: number) => {
    if (reelRef.current) {
      reelRef.current.scrollBy({ left: isRtl ? -delta : delta, behavior: 'smooth' });
    }
  };

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
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '32px',
          }}
        >
          {/* Header & Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: 'clamp(26px, 3.2vw, 40px)',
                  fontWeight: 600,
                  color: 'var(--studio-text)',
                  margin: '0 0 4px 0',
                }}
              >
                {title}
              </h2>
              <span style={{ fontSize: '13.5px', color: 'var(--studio-muted)' }}>
                {subtitle}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                aria-label="Previous Project"
                onClick={() => scroll(-340)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-bg)',
                  color: 'var(--studio-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {isRtl ? <ArrowRight size={16} /> : <ArrowLeft size={16} />}
              </button>
              <button
                type="button"
                aria-label="Next Project"
                onClick={() => scroll(340)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-bg)',
                  color: 'var(--studio-text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                {isRtl ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
              </button>
            </div>
          </div>

          {/* Horizontal Scroll Track */}
          <div
            ref={reelRef}
            style={{
              display: 'flex',
              gap: '24px',
              overflowX: 'auto',
              paddingBottom: '16px',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
            }}
          >
            {projects.map((proj, idx) => (
              <div
                key={idx}
                style={{
                  flex: '0 0 320px',
                  scrollSnapAlign: 'start',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    aspectRatio: '4/5',
                    borderRadius: 'var(--studio-radius)',
                    overflow: 'hidden',
                    border: '1px solid var(--studio-border)',
                    backgroundColor: 'var(--studio-bg)',
                  }}
                >
                  <img
                    src={proj.image}
                    alt={proj.title}
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <h3
                    style={{
                      fontFamily: 'var(--studio-font-display)',
                      fontSize: '18px',
                      fontWeight: 600,
                      color: 'var(--studio-text)',
                      margin: 0,
                    }}
                  >
                    {proj.title}
                  </h3>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--studio-accent)' }}>
                    {proj.year}
                  </span>
                </div>
                <span style={{ fontSize: '12.5px', color: 'var(--studio-muted)' }}>
                  {proj.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
