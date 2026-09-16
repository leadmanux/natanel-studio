import React from 'react';
import type { StudioComponentProps } from './types';
import { StudioDiagnosticPlaceholder } from './StudioDiagnosticPlaceholder';

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

export interface StudioRegisteredItem {
  id: string;
  name: string;
  category: string;
  description: string;
  industryFit: string[];
  styleTags: string[];
  conversionPurpose: string[];
  rtlReady: boolean;
  mobileQuality: number;
  motionLevel: 'none' | 'subtle' | 'moderate';
  status: 'approved' | 'candidate';
  component: React.ComponentType<StudioComponentProps<any>>;
}

export const studioComponentCatalog: StudioRegisteredItem[] = [
  // 1. Navigation
  {
    id: 'nav-minimal-dock-01',
    name: 'Transparent Restrained Nav',
    category: 'navigation',
    description: 'Floating or border-docked minimal navigation with pristine RTL alignment and contact trigger.',
    industryFit: ['architecture', 'interiors', 'luxury', 'creative'],
    styleTags: ['minimal', 'restrained', 'high-contrast'],
    conversionPurpose: ['navigation', 'sticky-cta'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: TransparentRestrainedNav,
  },
  {
    id: 'nav-editorial-asymmetric-01',
    name: 'Editorial Asymmetric Nav',
    category: 'navigation',
    description: 'Asymmetric typography header pairing location/atelier stamp with balanced action buttons.',
    industryFit: ['editorial', 'architecture', 'fashion', 'consulting'],
    styleTags: ['editorial', 'asymmetric', 'typographic'],
    conversionPurpose: ['brand-authority', 'navigation'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: EditorialAsymmetricNav,
  },
  {
    id: 'nav-centered-luxury-01',
    name: 'Centered Luxury Monogram Nav',
    category: 'navigation',
    description: 'High-luxury symmetric navigation with centered atelier monogram and flanking menu triggers.',
    industryFit: ['luxury', 'jewelry', 'beauty', 'atelier'],
    styleTags: ['luxury', 'symmetric', 'restrained'],
    conversionPurpose: ['brand-prestige', 'consultation-cta'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: CenteredLuxuryNav,
  },
  {
    id: 'nav-conversion-cta-01',
    name: 'High-Velocity Conversion Nav',
    category: 'navigation',
    description: 'Commercial navigation with prominent phone dispatch number, top emergency banner, and fast estimate button.',
    industryFit: ['contractors', 'emergency-services', 'home-services', 'medical'],
    styleTags: ['direct', 'conversion', 'high-trust'],
    conversionPurpose: ['instant-call', 'fast-estimate'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: ConversionCtaNav,
  },

  // 2. Hero
  {
    id: 'hero-editorial-split-01',
    name: 'Editorial Split Hero',
    category: 'hero',
    description: 'Large editorial headline with offset media composition and restrained typography.',
    industryFit: ['interiors', 'architecture', 'fashion', 'professional-services'],
    styleTags: ['editorial', 'minimal', 'luxury'],
    conversionPurpose: ['positioning', 'primary-cta'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: EditorialSplitHero,
  },
  {
    id: 'hero-architectural-panorama-02',
    name: 'Panoramic Cinematic Media Hero',
    category: 'hero',
    description: 'Ultra-wide visual banner with grounded typographic hierarchy, location tag, and direct video/tour CTA.',
    industryFit: ['real-estate', 'architecture', 'hospitality', 'resorts'],
    styleTags: ['cinematic', 'architectural', 'bold'],
    conversionPurpose: ['brand-authority', 'tour-booking'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: CinematicMediaHero,
  },
  {
    id: 'hero-asymmetric-typography-01',
    name: 'Asymmetric Monumental Typography Hero',
    category: 'hero',
    description: 'Monumental typography statement hero stripped of all decorative clutter, prioritizing raw verbal clarity.',
    industryFit: ['creative', 'design-practice', 'advisory', 'architecture'],
    styleTags: ['typographic', 'asymmetric', 'radical-minimalism'],
    conversionPurpose: ['brand-authority', 'manifesto'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: AsymmetricTypographyHero,
  },
  {
    id: 'hero-product-spotlight-01',
    name: 'High-Impact Product Commerce Hero',
    category: 'hero',
    description: 'E-commerce hero pairing prominent product photography with ratings, discounted pricing, and instant cart action.',
    industryFit: ['ecommerce', 'skincare', 'botanicals', 'design-objects'],
    styleTags: ['commerce', 'clean', 'tactile'],
    conversionPurpose: ['add-to-cart', 'direct-purchase'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: ProductCommerceHero,
  },
  {
    id: 'hero-local-service-01',
    name: 'Local Contractor Conversion Hero',
    category: 'hero',
    description: 'High-converting local service hero with embedded quick-quote intake card, urgency tags, and direct phone link.',
    industryFit: ['contractors', 'home-services', 'renovation', 'engineering'],
    styleTags: ['conversion', 'high-trust', 'direct'],
    conversionPurpose: ['quote-generation', 'direct-call'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: LocalServiceConversionHero,
  },
  {
    id: 'hero-minimal-luxury-01',
    name: 'Atelier Minimal Luxury Hero',
    category: 'hero',
    description: 'Restrained centered atelier hero with delicate display typography, monogram crest, and private consultation trigger.',
    industryFit: ['luxury', 'jewelry', 'bespoke-tailoring', 'art-consulting'],
    styleTags: ['luxury', 'minimal', 'understated'],
    conversionPurpose: ['private-inquiry', 'exclusivity'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: MinimalLuxuryHero,
  },

  // 3. Social Proof & CRO
  {
    id: 'cro-emblem-strip-01',
    name: 'Critical Acclaim & Emblem Press Strip',
    category: 'cro',
    description: 'Understated monochrome press and accolade row showcasing institutional recognition and publications.',
    industryFit: ['all', 'luxury', 'architecture', 'consulting'],
    styleTags: ['editorial', 'monochrome', 'clean'],
    conversionPurpose: ['social-proof', 'prestige'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: EmblemPressStrip,
  },
  {
    id: 'cro-metric-proof-01',
    name: 'Quantified Metric Proof Strip',
    category: 'cro',
    description: '4-metric quantified track with prominent numbers and audited delivery precision labels.',
    industryFit: ['all', 'b2b', 'contractors', 'real-estate'],
    styleTags: ['quantified', 'structured', 'high-trust'],
    conversionPurpose: ['de-risking', 'authority'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: MetricProofStrip,
  },
  {
    id: 'cro-trust-strip-01',
    name: 'Master Trust & Certification Strip',
    category: 'cro',
    description: 'Compact trust row for official licensing, $10M liability insurance, 10-year craft warranty, and milestone escrow.',
    industryFit: ['contractors', 'legal', 'finance', 'medical', 'services'],
    styleTags: ['clean', 'high-trust', 'compliance'],
    conversionPurpose: ['objection-handling', 'risk-reversal'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: TrustCertificationStrip,
  },
  {
    id: 'cro-review-summary-01',
    name: 'Aggregated Review Summary Bar',
    category: 'cro',
    description: 'Consolidated review bar featuring aggregate rating, platform badges (Google, Houzz), and direct review log link.',
    industryFit: ['all', 'services', 'ecommerce', 'local-business'],
    styleTags: ['compact', 'social-proof', 'conversion'],
    conversionPurpose: ['instant-credibility'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: ReviewSummaryBar,
  },
  {
    id: 'cro-guarantee-block-01',
    name: 'Contractual Standard Guarantee Block',
    category: 'cro',
    description: 'Ironclad satisfaction and quality guarantee block with emblem seal, contractual terms, and peace-of-mind checkmarks.',
    industryFit: ['services', 'renovation', 'ecommerce', 'consulting'],
    styleTags: ['guarantee', 'authoritative', 'high-trust'],
    conversionPurpose: ['risk-elimination', 'conversion-close'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: GuaranteeBlock,
  },

  // 4. Services
  {
    id: 'services-editorial-matrix-01',
    name: 'Typographic Services Matrix',
    category: 'services',
    description: 'Textured typographic service tiers without generic cards or icon box clutter.',
    industryFit: ['consulting', 'law', 'architecture', 'advisory'],
    styleTags: ['typographic', 'restrained', 'sophisticated'],
    conversionPurpose: ['service-clarity', 'inquiry'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: TypographicServicesMatrix,
  },
  {
    id: 'services-numbered-index-01',
    name: 'Methodical Numbered Service Index',
    category: 'services',
    description: 'Interactive numbered accordion breakdown (01, 02, 03, 04) with comprehensive scope deliverables.',
    industryFit: ['architecture', 'engineering', 'creative-agency', 'strategy'],
    styleTags: ['structured', 'accordion', 'architectural'],
    conversionPurpose: ['scope-education', 'demonstration'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: EditorialNumberedIndex,
  },
  {
    id: 'services-process-timeline-01',
    name: 'Structured Milestone Process Timeline',
    category: 'services',
    description: '4-phase sequential project trajectory detailing timelines, deliverables, and quality gates.',
    industryFit: ['renovation', 'software', 'architecture', 'custom-builds'],
    styleTags: ['process', 'timeline', 'transparent'],
    conversionPurpose: ['expectation-setting', 'trust-building'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: ProcessMilestoneTimeline,
  },
  {
    id: 'services-comparison-table-01',
    name: 'Direct Quality Comparison Table',
    category: 'services',
    description: 'Direct comparison table contrasting the Studio standard against ordinary industry practices across 5 critical dimensions.',
    industryFit: ['all', 'contractors', 'luxury', 'software'],
    styleTags: ['table', 'comparative', 'analytical'],
    conversionPurpose: ['differentiation', 'value-justification'],
    rtlReady: true,
    mobileQuality: 4,
    motionLevel: 'none',
    status: 'approved',
    component: ComparisonTable,
  },

  // 5. Portfolio & Storytelling
  {
    id: 'portfolio-asymmetric-narrative-01',
    name: 'Asymmetric Project Showcase',
    category: 'portfolio',
    description: 'Editorial case study layout presenting ultra-wide architectural panoramas and detail craftsmanship captures.',
    industryFit: ['architecture', 'interiors', 'luxury-estate', 'design'],
    styleTags: ['editorial', 'asymmetric', 'high-craft'],
    conversionPurpose: ['demonstration', 'social-proof'],
    rtlReady: true,
    mobileQuality: 4,
    motionLevel: 'subtle',
    status: 'approved',
    component: AsymmetricProjectShowcase,
  },
  {
    id: 'portfolio-horizontal-reel-01',
    name: 'Horizontal Kinetic Project Reel',
    category: 'portfolio',
    description: 'Smooth tactile card reel showcasing projects with smooth scrolling controls and categorized metadata.',
    industryFit: ['creative', 'architecture', 'fashion', 'hospitality'],
    styleTags: ['kinetic', 'reel', 'immersive'],
    conversionPurpose: ['portfolio-depth', 'discovery'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: HorizontalProjectReel,
  },
  {
    id: 'storytelling-editorial-narrative-01',
    name: 'Editorial Craft & Thesis Narrative',
    category: 'portfolio',
    description: 'Storytelling chapter pairing studio atmosphere portrait with design thesis, material sourcing, and founder quote.',
    industryFit: ['all', 'luxury', 'atelier', 'craft'],
    styleTags: ['narrative', 'editorial', 'authentic'],
    conversionPurpose: ['brand-affinity', 'emotional-connection'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: EditorialStoryNarrative,
  },
  {
    id: 'storytelling-sticky-narrative-01',
    name: 'Sticky Split Craft Narrative',
    category: 'portfolio',
    description: 'Sticky left architectural thesis paired with scrolling right craft step breakdowns and photographic proof.',
    industryFit: ['architecture', 'industrial-design', 'luxury-goods'],
    styleTags: ['sticky', 'split', 'editorial'],
    conversionPurpose: ['process-education', 'craft-proof'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: StickySplitNarrative,
  },
  {
    id: 'portfolio-before-after-slider-01',
    name: 'Interactive Before/After Transformation Slider',
    category: 'portfolio',
    description: 'Interactive touch/pointer comparison slider revealing dramatic architectural or renovation metamorphosis with full RTL support.',
    industryFit: ['renovation', 'architecture', 'interiors', 'aesthetics', 'landscaping'],
    styleTags: ['interactive', 'comparative', 'tactile'],
    conversionPurpose: ['visual-proof', 'conversion-catalyst'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: BeforeAfterSlider,
  },

  // 6. Testimonials
  {
    id: 'testimonials-editorial-quote-01',
    name: 'Monumental Editorial Quote',
    category: 'testimonials',
    description: 'Monumental client statement block with authentic provenance and commission context.',
    industryFit: ['luxury', 'architecture', 'consulting'],
    styleTags: ['editorial', 'monumental', 'restrained'],
    conversionPurpose: ['prestige-proof'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: EditorialQuote,
  },
  {
    id: 'testimonials-portrait-duo-01',
    name: 'Verified Client Portrait Duo',
    category: 'testimonials',
    description: 'High-credibility quotation block pairing authentic 4:5 portrait photography with verified delivery badges.',
    industryFit: ['b2b', 'consulting', 'ecommerce', 'services'],
    styleTags: ['authentic', 'editorial', 'high-trust'],
    conversionPurpose: ['social-proof', 'de-risking'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: PortraitTestimonialDuo,
  },
  {
    id: 'testimonials-review-carousel-01',
    name: 'Tactile Review Carousel Slider',
    category: 'testimonials',
    description: 'Audited client review slider with interactive navigation, star ratings, verified tags, and location context.',
    industryFit: ['all', 'contractors', 'services', 'ecommerce'],
    styleTags: ['slider', 'tactile', 'high-trust'],
    conversionPurpose: ['social-proof', 'de-risking'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: ReviewCarouselSlider,
  },
  {
    id: 'testimonials-case-outcome-01',
    name: 'Quantified Case Study Outcome',
    category: 'testimonials',
    description: 'Quantified client outcome card pairing executive client endorsement with measured property appreciation and schedule gains.',
    industryFit: ['real-estate', 'investments', 'b2b', 'contractors'],
    styleTags: ['quantified', 'case-study', 'authoritative'],
    conversionPurpose: ['roi-justification', 'de-risking'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: CaseStudyOutcome,
  },

  // 7. Forms & Intake
  {
    id: 'forms-multistep-intake-01',
    name: '3-Step Architectural Intake Brief',
    category: 'forms',
    description: 'Methodical 3-stage intake protocol defining project scope, budget envelope, and confidential client details.',
    industryFit: ['architecture', 'luxury-services', 'custom-homes', 'high-end-agency'],
    styleTags: ['multistep', 'structured', 'tactile'],
    conversionPurpose: ['lead-qualification', 'primary-conversion'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: MultiStepIntakeForm,
  },
  {
    id: 'forms-single-conversion-01',
    name: 'High-Velocity Callback Form',
    category: 'forms',
    description: 'Frictionless single-row contact callback form designed for fast mobile conversion and immediate telephone dispatch.',
    industryFit: ['contractors', 'emergency-services', 'lead-gen', 'consulting'],
    styleTags: ['direct', 'frictionless', 'conversion'],
    conversionPurpose: ['fast-lead', 'phone-capture'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: SingleStepConversionForm,
  },
  {
    id: 'forms-faq-accordion-01',
    name: 'Clarity & Concerns FAQ Accordion',
    category: 'forms',
    description: 'Structured FAQ accordion resolving key objections around permits, fixed budgets, daily supervision, and warranties.',
    industryFit: ['all', 'services', 'ecommerce', 'contractors'],
    styleTags: ['accordion', 'clean', 'informative'],
    conversionPurpose: ['objection-handling', 'friction-reduction'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: FaqAccordionSection,
  },

  // 8. CTA
  {
    id: 'cta-monumental-statement-01',
    name: 'Monumental Architectural Closing Statement',
    category: 'cta',
    description: 'High-contrast closing statement with authoritative typography and dual consultation triggers.',
    industryFit: ['all', 'luxury', 'architecture', 'corporate'],
    styleTags: ['monumental', 'high-contrast', 'authoritative'],
    conversionPurpose: ['final-conversion', 'closing'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: MonumentalStatementCta,
  },
  {
    id: 'cta-twotone-urgency-01',
    name: 'Two-Tone Emergency & Dispatch CTA',
    category: 'cta',
    description: 'High-visibility dispatch box pairing direct telephone dialer with online scheduling trigger.',
    industryFit: ['emergency-services', 'contractors', 'technical-advisory'],
    styleTags: ['direct', 'urgent', 'high-contrast'],
    conversionPurpose: ['immediate-call', 'fast-booking'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: TwoToneUrgencyCta,
  },
  {
    id: 'cta-direct-consultation-01',
    name: 'Direct Principal WhatsApp & Phone CTA',
    category: 'cta',
    description: 'Personalized invitation to connect directly with the principal architect via WhatsApp, phone, or direct email.',
    industryFit: ['boutique-studios', 'advisory', 'architecture', 'luxury'],
    styleTags: ['personal', 'accessible', 'direct'],
    conversionPurpose: ['whatsapp-start', 'direct-inquiry'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: DirectConsultationCta,
  },

  // 9. Ecommerce
  {
    id: 'ecommerce-product-grid-01',
    name: 'Curated 4-Column Product Grid',
    category: 'ecommerce',
    description: 'Clean product catalog grid with instant cart action, ratings, category tags, and responsive layout.',
    industryFit: ['ecommerce', 'lighting', 'homeware', 'apparel'],
    styleTags: ['catalog', 'clean', 'tactile'],
    conversionPurpose: ['product-discovery', 'add-to-cart'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: ProductGridCardRow,
  },
  {
    id: 'ecommerce-product-detail-01',
    name: 'Material Specs & Provenance Accordion',
    category: 'ecommerce',
    description: 'Deep product inspection module detailing materials, stone care protocols, dimensions, and warranty certificates.',
    industryFit: ['ecommerce', 'luxury-goods', 'lighting', 'furniture'],
    styleTags: ['specs', 'accordion', 'informative'],
    conversionPurpose: ['de-risking', 'value-justification'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: ProductDetailAccordion,
  },
  {
    id: 'ecommerce-cart-drawer-01',
    name: 'Tactile Cart Drawer Summary',
    category: 'ecommerce',
    description: 'Comprehensive cart panel with line-item management, free shipping status, subtotal, and sovereign checkout trigger.',
    industryFit: ['ecommerce', 'shopify', 'direct-to-consumer'],
    styleTags: ['drawer', 'checkout', 'tactile'],
    conversionPurpose: ['checkout-initiation', 'aov-protection'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'subtle',
    status: 'approved',
    component: CartDrawerSummary,
  },

  // 10. Footer
  {
    id: 'footer-editorial-architectural-01',
    name: 'Editorial Architectural Atelier Footer',
    category: 'footer',
    description: 'Architectural studio footer with physical atelier location, professional license stamps, phone, and disciplined directory.',
    industryFit: ['architecture', 'luxury', 'advisory', 'consulting'],
    styleTags: ['architectural', 'structured', 'restrained'],
    conversionPurpose: ['trust', 'contact-depth'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: EditorialArchitecturalFooter,
  },
  {
    id: 'footer-directory-01',
    name: '4-Column Directory & Dispatch Footer',
    category: 'footer',
    description: 'Full-depth directory footer with architectural newsletter subscription, service index, and legal trust badges.',
    industryFit: ['all', 'ecommerce', 'corporate', 'contractors'],
    styleTags: ['directory', 'comprehensive', 'clean'],
    conversionPurpose: ['newsletter-lead', 'site-navigation'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: MultiColumnDirectoryFooter,
  },
  {
    id: 'footer-minimal-legal-01',
    name: 'Minimal Sovereign Legal Footer',
    category: 'footer',
    description: 'Ultra-restrained footer suited for single-page atelier sites, portfolios, and high-luxury landing pages.',
    industryFit: ['luxury', 'creative', 'portfolios'],
    styleTags: ['minimal', 'restrained', 'understated'],
    conversionPurpose: ['legal-compliance'],
    rtlReady: true,
    mobileQuality: 5,
    motionLevel: 'none',
    status: 'approved',
    component: MinimalLegalFooter,
  },
];

const componentMap = new Map<string, React.ComponentType<StudioComponentProps<any>>>();

// Populate primary IDs
studioComponentCatalog.forEach((item) => {
  componentMap.set(item.id, item.component);
});

// Alias mappings for legacy or synonym registry keys
const aliases: Record<string, string> = {
  'hero-cinematic-panorama-01': 'hero-architectural-panorama-02',
  'nav-studio-minimal-01': 'nav-minimal-dock-01',
  'cta-contrast-closure-01': 'cta-monumental-statement-01',
  'footer-architectural-01': 'footer-editorial-architectural-01',
  'forms-high-intent-inquiry-01': 'forms-multistep-intake-01',
  'ecommerce-editorial-reel-01': 'ecommerce-product-grid-01',
};

Object.entries(aliases).forEach(([alias, targetId]) => {
  const comp = componentMap.get(targetId);
  if (comp) {
    componentMap.set(alias, comp);
  }
});

/**
 * Safely resolves a component registry ID to its renderable React implementation.
 * If not found, returns a diagnostic placeholder component instead of crashing.
 */
export function getStudioComponent(id: string): React.ComponentType<StudioComponentProps<any>> {
  const comp = componentMap.get(id);
  if (comp) {
    return comp;
  }
  return function FallbackComponent(props: StudioComponentProps<any>) {
    return (
      <StudioDiagnosticPlaceholder
        componentId={id}
        errorReason={`Component ID "${id}" is not registered in the Studio component catalog.`}
        suggestedFix="Verify the registry ID or check src/studio-components/resolver.ts"
      />
    );
  };
}

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
