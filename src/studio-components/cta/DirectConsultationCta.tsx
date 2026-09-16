import React from 'react';
import type { StudioComponentProps } from '../types';
import { StudioComponentWrapper } from '../StudioComponentWrapper';
import { MessageSquare, Mail, Phone } from 'lucide-react';

export interface ConsultationCtaContent {
  title?: string;
  lead?: string;
  phone?: string;
  email?: string;
  whatsappNumber?: string;
}

export function DirectConsultationCta(props: StudioComponentProps<ConsultationCtaContent>) {
  const isRtl = props.direction === 'rtl';

  const defaultContent = isRtl
    ? {
        title: 'שיחה ישירה עם האדריכל הראשי',
        lead: 'יש לכם שאלה מורכבת לגבי זכויות בנייה, קרקע או תכנון הנדסי? ניתן לפנות ישירות ולקבל חוות דעת מקצועית ראשונית.',
        phone: '054-456-7890',
        email: 'studio@natanel.design',
        whatsappNumber: '972544567890',
      }
    : {
        title: 'Direct Dialogue with Principal Architect',
        lead: 'Deliberating zoning parameters, coastal covenants, or engineering feasibility? Contact our principal directly for preliminary counsel.',
        phone: '+972-54-456-7890',
        email: 'atelier@natanel.design',
        whatsappNumber: '972544567890',
      };

  const content = { ...defaultContent, ...props.content };

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
            maxWidth: '760px',
            margin: '0 auto',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          <h2
            style={{
              fontFamily: 'var(--studio-font-display)',
              fontSize: 'clamp(26px, 3.2vw, 38px)',
              fontWeight: 600,
              color: 'var(--studio-text)',
              margin: 0,
            }}
          >
            {content.title}
          </h2>

          <p style={{ fontSize: '15px', lineHeight: 1.65, color: 'var(--studio-muted)', margin: 0, maxWidth: '620px' }}>
            {content.lead}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '14px', paddingTop: '8px' }}>
            <a
              href={`https://wa.me/${content.whatsappNumber}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 22px',
                minHeight: '46px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: '#25D366',
                color: '#fff',
                fontSize: '13.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <MessageSquare size={16} />
              <span>{isRtl ? 'הודעת וואטסאפ ישירה' : 'WhatsApp Direct'}</span>
            </a>

            <a
              href={`tel:${content.phone}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                minHeight: '46px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'var(--studio-surface)',
                border: '1px solid var(--studio-border)',
                color: 'var(--studio-text)',
                fontSize: '13.5px',
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'monospace',
              }}
            >
              <Phone size={15} color="var(--studio-accent)" />
              <span>{content.phone}</span>
            </a>

            <a
              href={`mailto:${content.email}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                minHeight: '46px',
                borderRadius: 'var(--studio-radius)',
                backgroundColor: 'var(--studio-surface)',
                border: '1px solid var(--studio-border)',
                color: 'var(--studio-text)',
                fontSize: '13.5px',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <Mail size={15} />
              <span>{content.email}</span>
            </a>
          </div>
        </div>
      </section>
    </StudioComponentWrapper>
  );
}
