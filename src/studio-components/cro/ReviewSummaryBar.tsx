import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { Star, CheckCircle, ExternalLink } from 'lucide-react';

export interface ReviewSummaryContent {
  score?: string;
  totalReviews?: string;
  platforms?: { name: string; score: string; count: string }[];
  ctaLabel?: string;
}

export function ReviewSummaryBar(props: StudioComponentProps<ReviewSummaryContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultPlatforms = isRtl
    ? [
        { name: 'Google Verified', score: '5.0', count: '128 חוות דעת' },
        { name: 'דירוג מקצועי ארצי', score: '4.98', count: '84 פרויקטים' },
        { name: 'Houzz Pro Excellence', score: '5.0', count: '46 ביקורות' },
      ]
    : [
        { name: 'Google Business Verified', score: '5.0', count: '128 reviews' },
        { name: 'Architectural Institute', score: '4.98', count: '84 commissions' },
        { name: 'Houzz Pro Best of Design', score: '5.0', count: '46 reviews' },
      ];

  const score = props.content?.score || '4.98';
  const total = props.content?.totalReviews || (isRtl ? '258 חוות דעת של לקוחות פרימיום' : '258 verified sovereign reviews');
  const platforms = props.content?.platforms || defaultPlatforms;
  const cta = props.content?.ctaLabel || (isRtl ? 'לכל הביקורות המאומתות' : 'Read All Client Logs');

  return (
    <StudioComponentWrapper {...props}>
      <section
        style={{
          width: '100%',
          padding: '28px 24px',
          borderBottom: '1px solid var(--studio-border)',
          backgroundColor: 'var(--studio-surface)',
        }}
      >
        <div
          style={{
            maxWidth: 'var(--studio-content-width)',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* Aggregate Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--studio-font-display)',
                  fontSize: '26px',
                  fontWeight: 700,
                  color: 'var(--studio-text)',
                }}
              >
                {score}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--studio-muted)' }}>/ 5.0</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <div style={{ display: 'flex', color: '#f59e0b', gap: '2px' }}>
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--studio-muted)', fontWeight: 500 }}>
                {total}
              </span>
            </div>
          </div>

          {/* Breakdown by Platform */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '20px' }}>
            {platforms.map((p, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 14px',
                  borderRadius: 'var(--studio-radius)',
                  border: '1px solid var(--studio-border)',
                  backgroundColor: 'var(--studio-bg)',
                  fontSize: '12px',
                }}
              >
                <CheckCircle size={13} color="var(--studio-accent)" />
                <span style={{ fontWeight: 600, color: 'var(--studio-text)' }}>{p.name}:</span>
                <span style={{ color: 'var(--studio-muted)' }}>{p.score} ({p.count})</span>
              </div>
            ))}
          </div>

          {/* Read CTA */}
          <a
            href="#reviews"
            style={{
              fontSize: '12px',
              fontWeight: 600,
              color: 'var(--studio-text)',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>{cta}</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
