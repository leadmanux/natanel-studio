import React from 'react';
import type { StudioComponentProps } from './types';
import { StudioDiagnosticPlaceholder } from './StudioDiagnosticPlaceholder';
import { demoComponents, type ComponentDefinition } from '@shared/componentRegistry';

// Navigation
import { TransparentRestrainedNav } from './navigation/TransparentRestrainedNav';
import { EditorialAsymmetricNav } from './navigation/EditorialAsymmetricNav';
import { CenteredLuxuryNav } from './navigation/CenteredLuxuryNav';
import { ConversionCtaNav } from './navigation/ConversionCtaNav';

// Hero
import { EditorialSplitHero } from './hero/EditorialSplitHero';
import { CinematicMediaHero } from './hero/CinematicMediaHero';
import { AsymmetricTypographyHero } from './hero/AsymmetricTypographyHero';
import { ProductCommerceHero } from './hero/ProductCommerceHero';
import { LocalServiceConversionHero } from './hero/LocalServiceConversionHero';
import { MinimalLuxuryHero } from './hero/MinimalLuxuryHero';

// Social Proof & CRO
import { EmblemPressStrip } from './cro/EmblemPressStrip';
import { MetricProofStrip } from './cro/MetricProofStrip';
import { TrustCertificationStrip } from './cro/TrustCertificationStrip';
import { ReviewSummaryBar } from './cro/ReviewSummaryBar';
import { GuaranteeBlock } from './cro/GuaranteeBlock';

// Services
import { TypographicServicesMatrix } from './services/TypographicServicesMatrix';
import { EditorialNumberedIndex } from './services/EditorialNumberedIndex';
import { ProcessMilestoneTimeline } from './services/ProcessMilestoneTimeline';
import { ComparisonTable } from './services/ComparisonTable';

// Portfolio & Storytelling
import { AsymmetricProjectShowcase } from './portfolio/AsymmetricProjectShowcase';
import { HorizontalProjectReel } from './portfolio/HorizontalProjectReel';
import { EditorialStoryNarrative } from './portfolio/EditorialStoryNarrative';
import { StickySplitNarrative } from './portfolio/StickySplitNarrative';
import { BeforeAfterSlider } from './portfolio/BeforeAfterSlider';

// Testimonials
import { EditorialQuote } from './testimonials/EditorialQuote';
import { PortraitTestimonialDuo } from './testimonials/PortraitTestimonialDuo';
import { ReviewCarouselSlider } from './testimonials/ReviewCarouselSlider';
import { CaseStudyOutcome } from './testimonials/CaseStudyOutcome';

// Forms & Intake
import { MultiStepIntakeForm } from './forms/MultiStepIntakeForm';
import { SingleStepConversionForm } from './forms/SingleStepConversionForm';
import { FaqAccordionSection } from './forms/FaqAccordionSection';

// CTA
import { MonumentalStatementCta } from './cta/MonumentalStatementCta';
import { TwoToneUrgencyCta } from './cta/TwoToneUrgencyCta';
import { DirectConsultationCta } from './cta/DirectConsultationCta';

// Ecommerce
import { ProductGridCardRow } from './ecommerce/ProductGridCardRow';
import { ProductDetailAccordion } from './ecommerce/ProductDetailAccordion';
import { CartDrawerSummary } from './ecommerce/CartDrawerSummary';

// Footer
import { EditorialArchitecturalFooter } from './footer/EditorialArchitecturalFooter';
import { MultiColumnDirectoryFooter } from './footer/MultiColumnDirectoryFooter';
import { MinimalLegalFooter } from './footer/MinimalLegalFooter';

/**
 * Pure React implementation registry.
 * Decoupled from metadata, mapped strictly by stable component ID.
 */
const studioComponentImplementations: Record<string, React.ComponentType<StudioComponentProps<any>>> = {
  // Navigation
  'nav-minimal-dock-01': TransparentRestrainedNav,
  'nav-editorial-asymmetric-01': EditorialAsymmetricNav,
  'nav-centered-luxury-01': CenteredLuxuryNav,
  'nav-conversion-cta-01': ConversionCtaNav,

  // Hero
  'hero-editorial-split-01': EditorialSplitHero,
  'hero-architectural-panorama-02': CinematicMediaHero,
  'hero-asymmetric-typography-01': AsymmetricTypographyHero,
  'hero-product-commerce-01': ProductCommerceHero,
  'hero-local-conversion-01': LocalServiceConversionHero,
  'hero-minimal-luxury-01': MinimalLuxuryHero,

  // CRO & Proof
  'cro-trust-strip-01': EmblemPressStrip,
  'cro-metrics-quantified-01': MetricProofStrip,
  'cro-certification-badges-01': TrustCertificationStrip,
  'cro-review-summary-01': ReviewSummaryBar,
  'cro-guarantee-block-01': GuaranteeBlock,

  // Services
  'services-editorial-matrix-01': TypographicServicesMatrix,
  'services-numbered-index-01': EditorialNumberedIndex,
  'services-process-timeline-01': ProcessMilestoneTimeline,
  'services-comparison-table-01': ComparisonTable,

  // Portfolio
  'portfolio-asymmetric-narrative-01': AsymmetricProjectShowcase,
  'portfolio-horizontal-reel-01': HorizontalProjectReel,
  'portfolio-editorial-narrative-01': EditorialStoryNarrative,
  'portfolio-sticky-split-01': StickySplitNarrative,
  'portfolio-before-after-01': BeforeAfterSlider,

  // Testimonials
  'testimonials-editorial-quote-01': EditorialQuote,
  'testimonials-portrait-duo-01': PortraitTestimonialDuo,
  'testimonials-review-carousel-01': ReviewCarouselSlider,
  'testimonials-case-study-outcome-01': CaseStudyOutcome,

  // Forms
  'forms-high-intent-inquiry-01': MultiStepIntakeForm,
  'forms-multistep-intake-01': MultiStepIntakeForm,
  'forms-single-step-conversion-01': SingleStepConversionForm,
  'forms-faq-accordion-01': FaqAccordionSection,

  // CTA
  'cta-contrast-closure-01': MonumentalStatementCta,
  'cta-monumental-statement-01': MonumentalStatementCta,
  'cta-two-tone-urgency-01': TwoToneUrgencyCta,
  'cta-direct-consultation-01': DirectConsultationCta,

  // Ecommerce
  'ecommerce-editorial-reel-01': ProductGridCardRow,
  'ecommerce-product-grid-01': ProductGridCardRow,
  'ecommerce-detail-accordion-01': ProductDetailAccordion,
  'ecommerce-cart-drawer-01': CartDrawerSummary,

  // Footer
  'footer-architectural-01': EditorialArchitecturalFooter,
  'footer-editorial-architectural-01': EditorialArchitecturalFooter,
  'footer-directory-multicolumn-01': MultiColumnDirectoryFooter,
  'footer-minimal-legal-01': MinimalLegalFooter,
};

// Aliases mapping historical or alternate registry keys to canonical implementation
const aliases: Record<string, string> = {
  'hero-cinematic-panorama-01': 'hero-architectural-panorama-02',
  'nav-studio-minimal-01': 'nav-minimal-dock-01',
};

/**
 * Returns true if an actual renderable React implementation exists for this component ID.
 */
export function hasStudioComponentImplementation(id: string): boolean {
  if (studioComponentImplementations[id]) return true;
  const targetId = aliases[id];
  return Boolean(targetId && studioComponentImplementations[targetId]);
}

/**
 * Safely resolves a component registry ID to its renderable React implementation.
 * If not found (e.g. metadata-only candidate without implementation code),
 * returns a diagnostic placeholder component instead of crashing.
 */
export function getStudioComponent(id: string): React.ComponentType<StudioComponentProps<any>> {
  const directComp = studioComponentImplementations[id];
  if (directComp) {
    return directComp;
  }

  const aliasTarget = aliases[id];
  if (aliasTarget && studioComponentImplementations[aliasTarget]) {
    return studioComponentImplementations[aliasTarget];
  }

  return function MissingStudioImplementation(props: StudioComponentProps<any>) {
    return (
      <StudioDiagnosticPlaceholder
        componentId={id}
        errorReason={`No render implementation code exists for component ID "${id}".`}
        suggestedFix="This item is currently registered as a metadata specification or external candidate. Implementation code must be authored before it can be rendered."
      />
    );
  };
}

export interface StudioRegisteredItem extends ComponentDefinition {
  hasImplementation: boolean;
  component: React.ComponentType<StudioComponentProps<any>>;
}

/**
 * Combines canonical metadata definitions with their render implementations.
 */
export function getStudioCatalog(components: ComponentDefinition[] = demoComponents): StudioRegisteredItem[] {
  return components.map((def) => ({
    ...def,
    hasImplementation: hasStudioComponentImplementation(def.id),
    component: getStudioComponent(def.id),
  }));
}

/**
 * Static baseline catalog for backwards compatibility.
 */
export const studioComponentCatalog: StudioRegisteredItem[] = getStudioCatalog();

export function getAllStudioComponents(): StudioRegisteredItem[] {
  return studioComponentCatalog;
}

export function getStudioComponentsByCategory(category: string): StudioRegisteredItem[] {
  return studioComponentCatalog.filter((c) => c.category === category);
}

export function getStudioComponentsByIndustry(industry: string): StudioRegisteredItem[] {
  return studioComponentCatalog.filter(
    (c) => c.industryFit.includes('all') || c.industryFit.includes(industry)
  );
}
