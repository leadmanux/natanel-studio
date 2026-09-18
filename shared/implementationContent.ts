import type { Project } from './project';
import { componentAliases } from './componentImplementations';

function canonicalId(id: string): string {
  return componentAliases[id] || id;
}

/**
 * Converts contract-facing content keys into the legacy/render-facing keys used by
 * particular Studio components. It always preserves the original contract fields,
 * so contract validation remains possible after adaptation.
 */
export function adaptContentForStudioImplementation(
  componentId: string,
  content: Record<string, unknown>,
  project: Project
): Record<string, unknown> {
  const id = canonicalId(componentId);
  const next: Record<string, unknown> = { ...content };

  if (id === 'hero-editorial-split-01') {
    next.eyebrow = content.eyebrow ?? content.tagline ?? '';
    next.description = content.description ?? content.subheadline ?? '';
    next.primaryCta = content.primaryCta ?? content.ctaLabel ?? '';
    next.secondaryCta = content.secondaryCta ?? content.secondaryCtaLabel ?? '';
    next.proofBadge = content.proofBadge ?? content.badge ?? '';
  }

  if (id === 'cro-guarantee-block-01') {
    next.points = content.points ?? content.termsPoints ?? [];
  }

  if (id === 'cro-review-summary-01') {
    next.platforms = content.platforms ?? [];
    next.ctaLabel = content.ctaLabel ?? '';
  }

  if (id === 'nav-centered-luxury-01') {
    const links = Array.isArray(content.links) ? content.links : [];
    const midpoint = Math.ceil(links.length / 2);
    next.brandMonogram = content.brandMonogram ?? content.monogram ?? '';
    next.leftLinks = content.leftLinks ?? links.slice(0, midpoint);
    next.rightLinks = content.rightLinks ?? links.slice(midpoint);
  }

  if (id === 'forms-faq-accordion-01') {
    next.title = content.title ?? content.headline ?? '';
    next.faqs = content.faqs ?? content.items ?? [];
  }

  if (id === 'ecommerce-product-grid-01') {
    next.title = content.title ?? content.headline ?? '';
    next.products = Array.isArray(content.products)
      ? content.products.map((product: any) => ({
          ...product,
          collection: product.collection ?? product.category ?? '',
          image: product.image ?? '',
          rating: product.rating ?? '',
        }))
      : [];
  }

  if (id === 'ecommerce-detail-accordion-01') {
    next.title = content.title ?? content.productName ?? '';
    next.specs = Array.isArray(content.specs)
      ? content.specs
      : Array.isArray(content.accordionItems)
        ? content.accordionItems.map((item: any) => ({
            label: item.title ?? '',
            value: item.content ?? '',
          }))
        : [];
  }

  if (id === 'footer-minimal-legal-01') {
    const brandName = String(content.brandName ?? project.business.businessName ?? '');
    const year = String(content.copyrightYear ?? new Date().getFullYear());
    next.copyright = content.copyright ?? (brandName ? `© ${year} ${brandName}. All rights reserved.` : '');
    next.legalNotice = content.legalNotice ?? (
      Array.isArray(content.legalLinks)
        ? content.legalLinks.map((link: any) => link?.label).filter(Boolean).join(' • ')
        : ''
    );
  }

  if (id === 'footer-editorial-architectural-01') {
    next.tagline = content.tagline ?? content.brandTagline ?? '';
    next.copyright = content.copyright || (project.business.businessName
      ? `© ${new Date().getFullYear()} ${project.business.businessName}. All rights reserved.`
      : '');
  }

  if (id === 'cta-monumental-statement-01') {
    next.monogram = content.monogram ?? project.business.businessName ?? '';
    next.statement = content.statement ?? content.statementHeadline ?? '';
    next.subtext = content.subtext ?? '';
    next.primaryCta = content.primaryCta ?? content.primaryCtaLabel ?? '';
    next.secondaryCta = content.secondaryCta ?? content.secondaryCtaLabel ?? '';
  }

  if (id === 'cta-two-tone-urgency-01') {
    next.urgencyNote = content.urgencyNote ?? content.urgencyBadge ?? content.dispatchTimeNotice ?? '';
    next.phone = content.phone ?? content.directPhone ?? '';
    next.phoneLabel = content.phoneLabel ?? content.ctaButtonLabel ?? '';
    next.onlineCta = content.onlineCta ?? '';
  }

  if (id === 'cta-direct-consultation-01') {
    next.title = content.title ?? content.headline ?? '';
    next.lead = content.lead ?? content.description ?? '';
    next.phone = content.phone ?? content.directPhone ?? project.business.phone ?? '';
    next.email = content.email ?? project.business.email ?? '';
    next.whatsappNumber = content.whatsappNumber ?? project.business.whatsapp ?? '';
  }

  return next;
}
