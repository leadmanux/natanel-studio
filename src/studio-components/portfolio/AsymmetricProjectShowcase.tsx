import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { ArrowUpRight, ArrowUpLeft } from 'lucide-react';

export interface ProjectShowcaseContent {
  eyebrow?: string;
  projectName?: string;
  projectMeta?: string;
  description?: string;
}

export function AsymmetricProjectShowcase(props: StudioComponentProps<ProjectShowcaseContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        eyebrow: 'פרויקט נבחר • מגורי יוקרה',
        projectName: 'וילת מצוק ים, קיסריה',
        projectMeta: '850 מ״ר • בטון חשוף, אבן טבעית וזכוכית ללא מסגרת',
        description: 'תכנון הרמוני המשתלב במדרון הטבעי לעבר קו המים. החלל המרכזי מתוכנן עם מפתחים של 14 מטרים המעניקים תחושת ריחוף מוחלטת.',
      }
    : {
        eyebrow: 'Selected Commission • Residential',
        projectName: 'The Cliffside Monolith, Caesarea',
        projectMeta: '850 sqm • Raw board-formed concrete, travertine & frameless glazing',
        description: 'Sculpted directly into the coastal topography, establishing a fluid dialogue between monumental limestone volumes and the infinite Mediterranean horizon.',
      };

  const content = { ...defaultContent, ...props.content };
  const panorama = props.assets?.['project-panorama-1']?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80';
  const detail = props.assets?.['project-detail-1']?.url ||
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=80';

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
          {/* Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'monospace',
                  letterSpacing: '0.12em',
                  color: 'var(--studio-accent)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                {content.eyebrow}
              </span>
              <h2
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: 'clamp(28px, 3.8vw, 48px)',
                  fontWeight: 600,
                  color: 'var(--studio-text)',
                  margin: '6px 0 4px 0',
                }}
              >
                {content.projectName}
              </h2>
              <span style={{ fontSize: '13px', color: 'var(--studio-muted)' }}>
                {content.projectMeta}
              </span>
            </div>

            <a
              href="#case-study"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                minHeight: '44px',
                borderRadius: 'var(--studio-radius)',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-surface)',
                color: 'var(--studio-text)',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              <span>{isRtl ? 'תיק הפרויקט המלא' : 'View Full Case Study'}</span>
              {isRtl ? <ArrowUpLeft size={15} /> : <ArrowUpRight size={15} />}
            </a>
          </div>

          {/* Asymmetric Visual Composition */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr',
              gap: '24px',
              alignItems: 'stretch',
            }}
            className="grid-split"
          >
            {/* Ultra-wide panorama */}
            <div
              style={{
                width: '100%',
                minHeight: '360px',
                borderRadius: 'var(--studio-radius)',
                overflow: 'hidden',
                border: '1px solid var(--studio-border)',
                backgroundColor: 'var(--studio-surface)',
              }}
            >
              <img
                src={panorama}
                alt={content.projectName}
                referrerPolicy="no-referrer"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {/* Detail vignette & narrative description */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div
                style={{
                  width: '100%',
                  aspectRatio: '16/10',
                  borderRadius: 'var(--studio-radius)',
                  overflow: 'hidden',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-surface)',
                }}
              >
                <img
                  src={detail}
                  alt="Detail Craftsmanship"
                  referrerPolicy="no-referrer"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>

              <p style={{ fontSize: '14.5px', lineHeight: 1.65, color: 'var(--studio-muted)', margin: 0 }}>
                {content.description}
              </p>
            </div>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
