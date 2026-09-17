/**
 * Canonical mapping of components with verified render implementations.
 * Shared between client runtime, server canonical store, and integrity validation scripts.
 */

export const implementedComponentIds = [
  // Navigation
  'nav-minimal-dock-01',
  'nav-editorial-asymmetric-01',
  'nav-centered-luxury-01',
  'nav-conversion-cta-01',

  // Hero
  'hero-editorial-split-01',
  'hero-architectural-panorama-02',
  'hero-asymmetric-typography-01',
  'hero-product-commerce-01',
  'hero-local-conversion-01',
  'hero-minimal-luxury-01',

  // CRO & Proof
  'cro-trust-strip-01',
  'cro-metrics-quantified-01',
  'cro-certification-badges-01',
  'cro-review-summary-01',
  'cro-guarantee-block-01',

  // Services
  'services-editorial-matrix-01',
  'services-numbered-index-01',
  'services-process-timeline-01',
  'services-comparison-table-01',

  // Portfolio
  'portfolio-asymmetric-narrative-01',
  'portfolio-horizontal-reel-01',
  'portfolio-editorial-narrative-01',
  'portfolio-sticky-split-01',
  'portfolio-before-after-01',

  // Testimonials
  'testimonials-editorial-quote-01',
  'testimonials-portrait-duo-01',
  'testimonials-review-carousel-01',
  'testimonials-case-study-outcome-01',

  // Forms
  'forms-high-intent-inquiry-01',
  'forms-multistep-intake-01',
  'forms-single-step-conversion-01',
  'forms-faq-accordion-01',

  // CTA
  'cta-contrast-closure-01',
  'cta-monumental-statement-01',
  'cta-two-tone-urgency-01',
  'cta-direct-consultation-01',

  // Ecommerce
  'ecommerce-editorial-reel-01',
  'ecommerce-product-grid-01',
  'ecommerce-detail-accordion-01',
  'ecommerce-cart-drawer-01',

  // Footer
  'footer-architectural-01',
  'footer-editorial-architectural-01',
  'footer-directory-multicolumn-01',
  'footer-minimal-legal-01',
] as const;

export const componentAliases: Record<string, string> = {
  // Navigation
  'nav-studio-minimal-01': 'nav-minimal-dock-01',

  // Hero
  'hero-cinematic-panorama-01': 'hero-architectural-panorama-02',
  'hero-product-spotlight-01': 'hero-product-commerce-01',
  'hero-local-service-01': 'hero-local-conversion-01',

  // Proof & CRO
  'cro-emblem-strip-01': 'cro-trust-strip-01',
  'cro-metric-proof-01': 'cro-metrics-quantified-01',

  // Portfolio & Storytelling
  'storytelling-editorial-narrative-01': 'portfolio-editorial-narrative-01',
  'storytelling-sticky-narrative-01': 'portfolio-sticky-split-01',
  'portfolio-before-after-slider-01': 'portfolio-before-after-01',

  // Testimonials
  'testimonials-case-outcome-01': 'testimonials-case-study-outcome-01',

  // Forms
  'forms-high-intent-inquiry-01': 'forms-multistep-intake-01',
  'forms-single-conversion-01': 'forms-single-step-conversion-01',

  // CTA
  'cta-contrast-closure-01': 'cta-monumental-statement-01',
  'cta-twotone-urgency-01': 'cta-two-tone-urgency-01',

  // Ecommerce
  'ecommerce-editorial-reel-01': 'ecommerce-product-grid-01',
  'ecommerce-product-detail-01': 'ecommerce-detail-accordion-01',

  // Footer
  'footer-architectural-01': 'footer-editorial-architectural-01',
  'footer-directory-01': 'footer-directory-multicolumn-01',
};

const implementedSet = new Set<string>(implementedComponentIds);

/**
 * Checks whether an implementation exists for a component ID or alias.
 */
export function hasComponentImplementation(id: string): boolean {
  if (implementedSet.has(id)) return true;
  const target = componentAliases[id];
  return Boolean(target && implementedSet.has(target));
}
