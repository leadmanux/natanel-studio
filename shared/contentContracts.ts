import { z } from 'zod';
import { componentAliases } from './componentImplementations';

export interface ComponentAssetSlotContract {
  slot: string;
  purpose: string;
  aspectRatio: string;
  required: boolean;
}

export interface ComponentContentContract {
  componentId: string;
  category: string;
  schema: z.ZodType<any>;
  requiredFields: string[];
  optionalFields: string[];
  /**
   * Fields that represent verifiable factual claims (prices, ratings, guarantees, phone, licenses, metrics).
   * In strict production mode, these MUST NOT be fabricated by AI if not explicitly supplied.
   */
  factualClaimFields: string[];
  /**
   * Fields that represent generative marketing copy (headlines, hooks, narrative introductions, CTA labels).
   * Gemini may creatively compose these according to the approved art direction.
   */
  generatedCopyFields: string[];
  assetSlots: ComponentAssetSlotContract[];
}

// ---------------------------------------------------------------------------
// 1. NAVIGATION
// ---------------------------------------------------------------------------
const NavLinkSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
});

const MinimalDockNavSchema = z.object({
  brandName: z.string().optional(),
  brandTagline: z.string().optional(),
  links: z.array(NavLinkSchema).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

const EditorialAsymmetricNavSchema = z.object({
  brandName: z.string().optional(),
  chapterLabel: z.string().optional(),
  links: z.array(NavLinkSchema).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

const CenteredLuxuryNavSchema = z.object({
  brandName: z.string().optional(),
  monogram: z.string().optional(),
  links: z.array(NavLinkSchema).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

const ConversionCtaNavSchema = z.object({
  brandName: z.string().optional(),
  contactPhone: z.string().optional(),
  phonePrompt: z.string().optional(),
  links: z.array(NavLinkSchema).optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 2. HERO
// ---------------------------------------------------------------------------
const EditorialSplitHeroSchema = z.object({
  tagline: z.string().optional(),
  headline: z.string().min(2),
  subheadline: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  secondaryCtaHref: z.string().optional(),
  badge: z.string().optional(),
});

const ArchitecturalPanoramaHeroSchema = z.object({
  kicker: z.string().optional(),
  headline: z.string().min(2),
  narrative: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  primaryCtaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
  locationTag: z.string().optional(),
});

const AsymmetricTypographyHeroSchema = z.object({
  kicker: z.string().optional(),
  headline: z.string().min(2),
  body: z.string().optional(),
  ctaLabel: z.string().optional(),
  ctaHref: z.string().optional(),
  stats: z
    .array(
      z.object({
        value: z.string(),
        label: z.string(),
      })
    )
    .optional(),
});

const ProductCommerceHeroSchema = z.object({
  tagline: z.string().optional(),
  productName: z.string().min(2),
  description: z.string().optional(),
  price: z.string().min(1),
  originalPrice: z.string().optional(),
  ratingScore: z.string().optional(),
  reviewCount: z.string().optional(),
  ctaText: z.string().optional(),
  shippingNote: z.string().optional(),
});

const LocalConversionHeroSchema = z.object({
  badge: z.string().optional(),
  headline: z.string().min(2),
  subheadline: z.string().optional(),
  primaryPhone: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  emergencyNotice: z.string().optional(),
  responseTimeGuarantee: z.string().optional(),
});

const MinimalLuxuryHeroSchema = z.object({
  kicker: z.string().optional(),
  headline: z.string().min(2),
  description: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  primaryCtaHref: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 3. CRO & SOCIAL PROOF
// ---------------------------------------------------------------------------
const TrustStripSchema = z.object({
  title: z.string().optional(),
  emblems: z.array(
    z.object({
      label: z.string(),
      source: z.string().optional(),
    })
  ).optional(),
});

const MetricProofSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  metrics: z.array(
    z.object({
      value: z.string(),
      label: z.string(),
      context: z.string().optional(),
    })
  ).min(1),
});

const CertificationBadgesSchema = z.object({
  headline: z.string().optional(),
  badges: z.array(
    z.object({
      title: z.string(),
      code: z.string().optional(),
      issuer: z.string().optional(),
    })
  ).min(1),
});

const ReviewSummarySchema = z.object({
  score: z.string(),
  totalReviews: z.string(),
  ratingSource: z.string().optional(),
  trustBadgeText: z.string().optional(),
});

const GuaranteeBlockSchema = z.object({
  badge: z.string().optional(),
  headline: z.string().min(2),
  description: z.string().optional(),
  termsPoints: z.array(z.string()).optional(),
  ctaLabel: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 4. SERVICES
// ---------------------------------------------------------------------------
const ServicesMatrixSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  description: z.string().optional(),
  services: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      description: z.string(),
      tags: z.array(z.string()).optional(),
      slug: z.string().optional(),
    })
  ).min(1),
});

const NumberedIndexSchema = z.object({
  indexTitle: z.string().optional(),
  subtitle: z.string().optional(),
  items: z.array(
    z.object({
      number: z.string(),
      title: z.string(),
      description: z.string(),
      deliverable: z.string().optional(),
    })
  ).min(1),
});

const ProcessTimelineSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  steps: z.array(
    z.object({
      phase: z.string(),
      title: z.string(),
      duration: z.string().optional(),
      description: z.string(),
    })
  ).min(1),
});

const ComparisonTableSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  standardTierName: z.string().optional(),
  atelierTierName: z.string().optional(),
  criteria: z.array(
    z.object({
      feature: z.string(),
      standard: z.string(),
      atelier: z.string(),
    })
  ).min(1),
});

// ---------------------------------------------------------------------------
// 5. PORTFOLIO & STORYTELLING
// ---------------------------------------------------------------------------
const AsymmetricShowcaseSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  projects: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      year: z.string().optional(),
      description: z.string().optional(),
      metric: z.string().optional(),
    })
  ).min(1),
});

const HorizontalReelSchema = z.object({
  title: z.string().min(2),
  subtitle: z.string().optional(),
  projects: z.array(
    z.object({
      title: z.string(),
      category: z.string(),
      location: z.string().optional(),
      year: z.string().optional(),
    })
  ).min(1),
});

const EditorialStorySchema = z.object({
  thesisKicker: z.string().optional(),
  headline: z.string().min(2),
  manifestoParagraphs: z.array(z.string()).min(1),
  quoteAuthor: z.string().optional(),
  quoteRole: z.string().optional(),
});

const StickySplitNarrativeSchema = z.object({
  sectionNumber: z.string().optional(),
  headline: z.string().min(2),
  chapters: z.array(
    z.object({
      title: z.string(),
      subtitle: z.string().optional(),
      narrative: z.string(),
    })
  ).min(1),
});

const BeforeAfterSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  description: z.string().optional(),
  beforeLabel: z.string().optional(),
  afterLabel: z.string().optional(),
  metrics: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
    })
  ).optional(),
});

// ---------------------------------------------------------------------------
// 6. TESTIMONIALS & REVIEWS
// ---------------------------------------------------------------------------
const EditorialQuoteSchema = z.object({
  quote: z.string().min(5),
  author: z.string().min(2),
  role: z.string().optional(),
  company: z.string().optional(),
  context: z.string().optional(),
});

const PortraitDuoSchema = z.object({
  headline: z.string().optional(),
  testimonials: z.array(
    z.object({
      quote: z.string(),
      author: z.string(),
      role: z.string().optional(),
      verifiedProject: z.string().optional(),
    })
  ).min(1),
});

const ReviewCarouselSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  reviews: z.array(
    z.object({
      author: z.string(),
      rating: z.number().optional(),
      verifiedDate: z.string().optional(),
      reviewText: z.string(),
      projectType: z.string().optional(),
    })
  ).min(1),
});

const CaseStudyOutcomeSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  clientName: z.string().optional(),
  challenge: z.string().optional(),
  solution: z.string().optional(),
  quantifiableResults: z.array(
    z.object({
      metric: z.string(),
      outcome: z.string(),
    })
  ).optional(),
});

// ---------------------------------------------------------------------------
// 7. FORMS & FAQ
// ---------------------------------------------------------------------------
const MultiStepIntakeSchema = z.object({
  formTitle: z.string().min(2),
  formSubtitle: z.string().optional(),
  ctaLabel: z.string().optional(),
  disclaimer: z.string().optional(),
  privacyNotice: z.string().optional(),
});

const SingleStepConversionSchema = z.object({
  headline: z.string().min(2),
  subheadline: z.string().optional(),
  buttonLabel: z.string().optional(),
  trustNote: z.string().optional(),
  phonePlaceholder: z.string().optional(),
});

const FaqAccordionSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  items: z.array(
    z.object({
      question: z.string(),
      answer: z.string(),
    })
  ).min(1),
});

// ---------------------------------------------------------------------------
// 8. CTA
// ---------------------------------------------------------------------------
const MonumentalStatementCtaSchema = z.object({
  kicker: z.string().optional(),
  statementHeadline: z.string().min(2),
  subtext: z.string().optional(),
  primaryCtaLabel: z.string().min(1),
  primaryCtaHref: z.string().optional(),
  secondaryCtaLabel: z.string().optional(),
});

const TwoToneUrgencyCtaSchema = z.object({
  urgencyBadge: z.string().optional(),
  headline: z.string().min(2),
  directPhone: z.string().optional(),
  dispatchTimeNotice: z.string().optional(),
  ctaButtonLabel: z.string().min(1),
});

const DirectConsultationCtaSchema = z.object({
  headline: z.string().min(2),
  description: z.string().optional(),
  directPhone: z.string().optional(),
  whatsappNumber: z.string().optional(),
  consultantName: z.string().optional(),
  consultantRole: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 9. ECOMMERCE
// ---------------------------------------------------------------------------
const ProductGridCardRowSchema = z.object({
  eyebrow: z.string().optional(),
  headline: z.string().min(2),
  subtitle: z.string().optional(),
  products: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      price: z.string(),
      originalPrice: z.string().optional(),
      category: z.string().optional(),
      inStock: z.boolean().optional(),
    })
  ).min(1),
});

const ProductDetailAccordionSchema = z.object({
  productName: z.string().min(2),
  price: z.string().min(1),
  description: z.string().optional(),
  accordionItems: z.array(
    z.object({
      title: z.string(),
      content: z.string(),
    })
  ).min(1),
});

const CartDrawerSummarySchema = z.object({
  cartTitle: z.string().optional(),
  emptyMessage: z.string().optional(),
  checkoutButtonLabel: z.string().optional(),
  freeShippingThreshold: z.string().optional(),
});

// ---------------------------------------------------------------------------
// 10. FOOTER
// ---------------------------------------------------------------------------
const EditorialFooterSchema = z.object({
  brandName: z.string().optional(),
  brandTagline: z.string().optional(),
  columns: z.array(
    z.object({
      title: z.string(),
      links: z.array(NavLinkSchema),
    })
  ).optional(),
  copyright: z.string().optional(),
  legalLinks: z.array(NavLinkSchema).optional(),
});

const MultiColumnDirectoryFooterSchema = z.object({
  brandName: z.string().optional(),
  dispatchContact: z.object({
    phone: z.string().optional(),
    email: z.string().optional(),
    address: z.string().optional(),
  }).optional(),
  columns: z.array(
    z.object({
      title: z.string(),
      links: z.array(NavLinkSchema),
    })
  ).optional(),
  legalNote: z.string().optional(),
});

const MinimalLegalFooterSchema = z.object({
  brandName: z.string().optional(),
  copyrightYear: z.string().optional(),
  legalLinks: z.array(NavLinkSchema).optional(),
});

// ---------------------------------------------------------------------------
// REGISTRY CONTRACTS MAP
// ---------------------------------------------------------------------------
export const componentContentContracts: Record<string, ComponentContentContract> = {
  // Navigation
  'nav-minimal-dock-01': {
    componentId: 'nav-minimal-dock-01',
    category: 'navigation',
    schema: MinimalDockNavSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'brandTagline', 'links', 'ctaLabel', 'ctaHref'],
    factualClaimFields: ['brandName'],
    generatedCopyFields: ['brandTagline', 'ctaLabel'],
    assetSlots: [{ slot: 'logo', purpose: 'Brand mark or emblem', aspectRatio: '1:1', required: false }],
  },
  'nav-editorial-asymmetric-01': {
    componentId: 'nav-editorial-asymmetric-01',
    category: 'navigation',
    schema: EditorialAsymmetricNavSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'chapterLabel', 'links', 'ctaLabel', 'ctaHref'],
    factualClaimFields: ['brandName'],
    generatedCopyFields: ['chapterLabel', 'ctaLabel'],
    assetSlots: [{ slot: 'logo', purpose: 'Brand mark or emblem', aspectRatio: '1:1', required: false }],
  },
  'nav-centered-luxury-01': {
    componentId: 'nav-centered-luxury-01',
    category: 'navigation',
    schema: CenteredLuxuryNavSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'monogram', 'links', 'ctaLabel', 'ctaHref'],
    factualClaimFields: ['brandName', 'monogram'],
    generatedCopyFields: ['ctaLabel'],
    assetSlots: [{ slot: 'logo', purpose: 'Center luxury monogram', aspectRatio: '1:1', required: false }],
  },
  'nav-conversion-cta-01': {
    componentId: 'nav-conversion-cta-01',
    category: 'navigation',
    schema: ConversionCtaNavSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'contactPhone', 'phonePrompt', 'links', 'ctaLabel', 'ctaHref'],
    factualClaimFields: ['brandName', 'contactPhone'],
    generatedCopyFields: ['phonePrompt', 'ctaLabel'],
    assetSlots: [{ slot: 'logo', purpose: 'Conversion brand badge', aspectRatio: '1:1', required: false }],
  },

  // Hero
  'hero-editorial-split-01': {
    componentId: 'hero-editorial-split-01',
    category: 'hero',
    schema: EditorialSplitHeroSchema,
    requiredFields: ['headline'],
    optionalFields: ['tagline', 'subheadline', 'ctaLabel', 'ctaHref', 'secondaryCtaLabel', 'secondaryCtaHref', 'badge'],
    factualClaimFields: ['badge'],
    generatedCopyFields: ['tagline', 'headline', 'subheadline', 'ctaLabel', 'secondaryCtaLabel'],
    assetSlots: [{ slot: 'hero', purpose: 'Editorial primary hero imagery', aspectRatio: '4:5', required: true }],
  },
  'hero-architectural-panorama-02': {
    componentId: 'hero-architectural-panorama-02',
    category: 'hero',
    schema: ArchitecturalPanoramaHeroSchema,
    requiredFields: ['headline'],
    optionalFields: ['kicker', 'narrative', 'primaryCtaLabel', 'primaryCtaHref', 'secondaryCtaLabel', 'locationTag'],
    factualClaimFields: ['locationTag'],
    generatedCopyFields: ['kicker', 'headline', 'narrative', 'primaryCtaLabel', 'secondaryCtaLabel'],
    assetSlots: [{ slot: 'panorama', purpose: 'Panoramic cinema architectural hero backdrop', aspectRatio: '16:9', required: true }],
  },
  'hero-asymmetric-typography-01': {
    componentId: 'hero-asymmetric-typography-01',
    category: 'hero',
    schema: AsymmetricTypographyHeroSchema,
    requiredFields: ['headline'],
    optionalFields: ['kicker', 'body', 'ctaLabel', 'ctaHref', 'stats'],
    factualClaimFields: ['stats'],
    generatedCopyFields: ['kicker', 'headline', 'body', 'ctaLabel'],
    assetSlots: [{ slot: 'foreground', purpose: 'Tactile foreground specimen portrait', aspectRatio: '3:4', required: false }],
  },
  'hero-product-commerce-01': {
    componentId: 'hero-product-commerce-01',
    category: 'hero',
    schema: ProductCommerceHeroSchema,
    requiredFields: ['productName', 'price'],
    optionalFields: ['tagline', 'description', 'originalPrice', 'ratingScore', 'reviewCount', 'ctaText', 'shippingNote'],
    factualClaimFields: ['productName', 'price', 'originalPrice', 'ratingScore', 'reviewCount', 'shippingNote'],
    generatedCopyFields: ['tagline', 'description', 'ctaText'],
    assetSlots: [{ slot: 'product', purpose: 'High-impact tactile product photography', aspectRatio: '1:1', required: true }],
  },
  'hero-local-conversion-01': {
    componentId: 'hero-local-conversion-01',
    category: 'hero',
    schema: LocalConversionHeroSchema,
    requiredFields: ['headline'],
    optionalFields: ['badge', 'subheadline', 'primaryPhone', 'primaryCtaLabel', 'emergencyNotice', 'responseTimeGuarantee'],
    factualClaimFields: ['primaryPhone', 'responseTimeGuarantee'],
    generatedCopyFields: ['badge', 'headline', 'subheadline', 'primaryCtaLabel', 'emergencyNotice'],
    assetSlots: [{ slot: 'hero', purpose: 'Local craftsmanship action photography', aspectRatio: '4:3', required: false }],
  },
  'hero-minimal-luxury-01': {
    componentId: 'hero-minimal-luxury-01',
    category: 'hero',
    schema: MinimalLuxuryHeroSchema,
    requiredFields: ['headline'],
    optionalFields: ['kicker', 'description', 'primaryCtaLabel', 'primaryCtaHref'],
    factualClaimFields: [],
    generatedCopyFields: ['kicker', 'headline', 'description', 'primaryCtaLabel'],
    assetSlots: [{ slot: 'hero', purpose: 'Minimal luxury visual tone setting imagery', aspectRatio: '16:9', required: false }],
  },

  // CRO & Proof
  'cro-trust-strip-01': {
    componentId: 'cro-trust-strip-01',
    category: 'cro',
    schema: TrustStripSchema,
    requiredFields: [],
    optionalFields: ['title', 'emblems'],
    factualClaimFields: ['emblems'],
    generatedCopyFields: ['title'],
    assetSlots: [],
  },
  'cro-metrics-quantified-01': {
    componentId: 'cro-metrics-quantified-01',
    category: 'cro',
    schema: MetricProofSchema,
    requiredFields: ['metrics'],
    optionalFields: ['title', 'subtitle'],
    factualClaimFields: ['metrics'],
    generatedCopyFields: ['title', 'subtitle'],
    assetSlots: [],
  },
  'cro-certification-badges-01': {
    componentId: 'cro-certification-badges-01',
    category: 'cro',
    schema: CertificationBadgesSchema,
    requiredFields: ['badges'],
    optionalFields: ['headline'],
    factualClaimFields: ['badges'],
    generatedCopyFields: ['headline'],
    assetSlots: [],
  },
  'cro-review-summary-01': {
    componentId: 'cro-review-summary-01',
    category: 'cro',
    schema: ReviewSummarySchema,
    requiredFields: ['score', 'totalReviews'],
    optionalFields: ['ratingSource', 'trustBadgeText'],
    factualClaimFields: ['score', 'totalReviews', 'ratingSource'],
    generatedCopyFields: ['trustBadgeText'],
    assetSlots: [],
  },
  'cro-guarantee-block-01': {
    componentId: 'cro-guarantee-block-01',
    category: 'cro',
    schema: GuaranteeBlockSchema,
    requiredFields: ['headline'],
    optionalFields: ['badge', 'description', 'termsPoints', 'ctaLabel'],
    factualClaimFields: ['termsPoints'],
    generatedCopyFields: ['badge', 'headline', 'description', 'ctaLabel'],
    assetSlots: [],
  },

  // Services
  'services-editorial-matrix-01': {
    componentId: 'services-editorial-matrix-01',
    category: 'services',
    schema: ServicesMatrixSchema,
    requiredFields: ['headline', 'services'],
    optionalFields: ['eyebrow', 'description'],
    factualClaimFields: ['services'],
    generatedCopyFields: ['eyebrow', 'headline', 'description'],
    assetSlots: [],
  },
  'services-numbered-index-01': {
    componentId: 'services-numbered-index-01',
    category: 'services',
    schema: NumberedIndexSchema,
    requiredFields: ['items'],
    optionalFields: ['indexTitle', 'subtitle'],
    factualClaimFields: ['items'],
    generatedCopyFields: ['indexTitle', 'subtitle'],
    assetSlots: [],
  },
  'services-process-timeline-01': {
    componentId: 'services-process-timeline-01',
    category: 'services',
    schema: ProcessTimelineSchema,
    requiredFields: ['headline', 'steps'],
    optionalFields: ['eyebrow'],
    factualClaimFields: ['steps'],
    generatedCopyFields: ['eyebrow', 'headline'],
    assetSlots: [],
  },
  'services-comparison-table-01': {
    componentId: 'services-comparison-table-01',
    category: 'services',
    schema: ComparisonTableSchema,
    requiredFields: ['title', 'criteria'],
    optionalFields: ['subtitle', 'standardTierName', 'atelierTierName'],
    factualClaimFields: ['criteria'],
    generatedCopyFields: ['title', 'subtitle', 'standardTierName', 'atelierTierName'],
    assetSlots: [],
  },

  // Portfolio
  'portfolio-asymmetric-narrative-01': {
    componentId: 'portfolio-asymmetric-narrative-01',
    category: 'portfolio',
    schema: AsymmetricShowcaseSchema,
    requiredFields: ['headline', 'projects'],
    optionalFields: ['eyebrow'],
    factualClaimFields: ['projects'],
    generatedCopyFields: ['eyebrow', 'headline'],
    assetSlots: [
      { slot: 'project_0', purpose: 'Featured architectural showcase 1', aspectRatio: '4:5', required: true },
      { slot: 'project_1', purpose: 'Featured architectural showcase 2', aspectRatio: '4:5', required: false },
    ],
  },
  'portfolio-horizontal-reel-01': {
    componentId: 'portfolio-horizontal-reel-01',
    category: 'portfolio',
    schema: HorizontalReelSchema,
    requiredFields: ['title', 'projects'],
    optionalFields: ['subtitle'],
    factualClaimFields: ['projects'],
    generatedCopyFields: ['title', 'subtitle'],
    assetSlots: [
      { slot: 'slide_0', purpose: 'Horizontal reel project slide 1', aspectRatio: '16:9', required: true },
      { slot: 'slide_1', purpose: 'Horizontal reel project slide 2', aspectRatio: '16:9', required: false },
    ],
  },
  'portfolio-editorial-narrative-01': {
    componentId: 'portfolio-editorial-narrative-01',
    category: 'storytelling',
    schema: EditorialStorySchema,
    requiredFields: ['headline', 'manifestoParagraphs'],
    optionalFields: ['thesisKicker', 'quoteAuthor', 'quoteRole'],
    factualClaimFields: ['quoteAuthor', 'quoteRole'],
    generatedCopyFields: ['thesisKicker', 'headline', 'manifestoParagraphs'],
    assetSlots: [{ slot: 'craft', purpose: 'Editorial craft close-up or materials tactile study', aspectRatio: '3:4', required: false }],
  },
  'portfolio-sticky-split-01': {
    componentId: 'portfolio-sticky-split-01',
    category: 'storytelling',
    schema: StickySplitNarrativeSchema,
    requiredFields: ['headline', 'chapters'],
    optionalFields: ['sectionNumber'],
    factualClaimFields: [],
    generatedCopyFields: ['sectionNumber', 'headline', 'chapters'],
    assetSlots: [{ slot: 'editorial', purpose: 'Sticky split narrative visual reference', aspectRatio: '4:5', required: false }],
  },
  'portfolio-before-after-01': {
    componentId: 'portfolio-before-after-01',
    category: 'before_after',
    schema: BeforeAfterSchema,
    requiredFields: ['headline'],
    optionalFields: ['eyebrow', 'description', 'beforeLabel', 'afterLabel', 'metrics'],
    factualClaimFields: ['metrics'],
    generatedCopyFields: ['eyebrow', 'headline', 'description', 'beforeLabel', 'afterLabel'],
    assetSlots: [
      { slot: 'before', purpose: 'Before transformation documentation photograph', aspectRatio: '16:9', required: true },
      { slot: 'after', purpose: 'Completed architectural state photograph', aspectRatio: '16:9', required: true },
    ],
  },

  // Testimonials & Reviews
  'testimonials-editorial-quote-01': {
    componentId: 'testimonials-editorial-quote-01',
    category: 'testimonials',
    schema: EditorialQuoteSchema,
    requiredFields: ['quote', 'author'],
    optionalFields: ['role', 'company', 'context'],
    factualClaimFields: ['quote', 'author', 'company', 'role'],
    generatedCopyFields: ['context'],
    assetSlots: [],
  },
  'testimonials-portrait-duo-01': {
    componentId: 'testimonials-portrait-duo-01',
    category: 'testimonials',
    schema: PortraitDuoSchema,
    requiredFields: ['testimonials'],
    optionalFields: ['headline'],
    factualClaimFields: ['testimonials'],
    generatedCopyFields: ['headline'],
    assetSlots: [
      { slot: 'portrait_0', purpose: 'Verified client portrait 1', aspectRatio: '1:1', required: false },
      { slot: 'portrait_1', purpose: 'Verified client portrait 2', aspectRatio: '1:1', required: false },
    ],
  },
  'testimonials-review-carousel-01': {
    componentId: 'testimonials-review-carousel-01',
    category: 'reviews',
    schema: ReviewCarouselSchema,
    requiredFields: ['reviews'],
    optionalFields: ['title', 'subtitle'],
    factualClaimFields: ['reviews'],
    generatedCopyFields: ['title', 'subtitle'],
    assetSlots: [],
  },
  'testimonials-case-study-outcome-01': {
    componentId: 'testimonials-case-study-outcome-01',
    category: 'testimonials',
    schema: CaseStudyOutcomeSchema,
    requiredFields: ['headline'],
    optionalFields: ['eyebrow', 'clientName', 'challenge', 'solution', 'quantifiableResults'],
    factualClaimFields: ['clientName', 'quantifiableResults'],
    generatedCopyFields: ['eyebrow', 'headline', 'challenge', 'solution'],
    assetSlots: [{ slot: 'outcome', purpose: 'Case study project architectural documentation', aspectRatio: '16:9', required: false }],
  },

  // Forms & FAQ
  'forms-multistep-intake-01': {
    componentId: 'forms-multistep-intake-01',
    category: 'forms',
    schema: MultiStepIntakeSchema,
    requiredFields: ['formTitle'],
    optionalFields: ['formSubtitle', 'ctaLabel', 'disclaimer', 'privacyNotice'],
    factualClaimFields: ['disclaimer'],
    generatedCopyFields: ['formTitle', 'formSubtitle', 'ctaLabel', 'privacyNotice'],
    assetSlots: [],
  },
  'forms-single-step-conversion-01': {
    componentId: 'forms-single-step-conversion-01',
    category: 'forms',
    schema: SingleStepConversionSchema,
    requiredFields: ['headline'],
    optionalFields: ['subheadline', 'buttonLabel', 'trustNote', 'phonePlaceholder'],
    factualClaimFields: ['trustNote'],
    generatedCopyFields: ['headline', 'subheadline', 'buttonLabel', 'phonePlaceholder'],
    assetSlots: [],
  },
  'forms-faq-accordion-01': {
    componentId: 'forms-faq-accordion-01',
    category: 'faq',
    schema: FaqAccordionSchema,
    requiredFields: ['headline', 'items'],
    optionalFields: ['eyebrow'],
    factualClaimFields: ['items'],
    generatedCopyFields: ['eyebrow', 'headline'],
    assetSlots: [],
  },

  // CTA
  'cta-monumental-statement-01': {
    componentId: 'cta-monumental-statement-01',
    category: 'cta',
    schema: MonumentalStatementCtaSchema,
    requiredFields: ['statementHeadline', 'primaryCtaLabel'],
    optionalFields: ['kicker', 'subtext', 'primaryCtaHref', 'secondaryCtaLabel'],
    factualClaimFields: [],
    generatedCopyFields: ['kicker', 'statementHeadline', 'subtext', 'primaryCtaLabel', 'secondaryCtaLabel'],
    assetSlots: [],
  },
  'cta-two-tone-urgency-01': {
    componentId: 'cta-two-tone-urgency-01',
    category: 'cta',
    schema: TwoToneUrgencyCtaSchema,
    requiredFields: ['headline', 'ctaButtonLabel'],
    optionalFields: ['urgencyBadge', 'directPhone', 'dispatchTimeNotice'],
    factualClaimFields: ['directPhone', 'dispatchTimeNotice'],
    generatedCopyFields: ['urgencyBadge', 'headline', 'ctaButtonLabel'],
    assetSlots: [],
  },
  'cta-direct-consultation-01': {
    componentId: 'cta-direct-consultation-01',
    category: 'cta',
    schema: DirectConsultationCtaSchema,
    requiredFields: ['headline'],
    optionalFields: ['description', 'directPhone', 'whatsappNumber', 'consultantName', 'consultantRole'],
    factualClaimFields: ['directPhone', 'whatsappNumber', 'consultantName', 'consultantRole'],
    generatedCopyFields: ['headline', 'description'],
    assetSlots: [{ slot: 'consultant', purpose: 'Principal consultant portrait or atelier badge', aspectRatio: '1:1', required: false }],
  },

  // Ecommerce
  'ecommerce-product-grid-01': {
    componentId: 'ecommerce-product-grid-01',
    category: 'ecommerce',
    schema: ProductGridCardRowSchema,
    requiredFields: ['headline', 'products'],
    optionalFields: ['eyebrow', 'subtitle'],
    factualClaimFields: ['products'],
    generatedCopyFields: ['eyebrow', 'headline', 'subtitle'],
    assetSlots: [
      { slot: 'prod_0', purpose: 'Primary product photography', aspectRatio: '1:1', required: true },
      { slot: 'prod_1', purpose: 'Secondary product photography', aspectRatio: '1:1', required: false },
    ],
  },
  'ecommerce-detail-accordion-01': {
    componentId: 'ecommerce-detail-accordion-01',
    category: 'ecommerce',
    schema: ProductDetailAccordionSchema,
    requiredFields: ['productName', 'price', 'accordionItems'],
    optionalFields: ['description'],
    factualClaimFields: ['productName', 'price', 'accordionItems'],
    generatedCopyFields: ['description'],
    assetSlots: [{ slot: 'detail', purpose: 'Macro material detail view', aspectRatio: '1:1', required: false }],
  },
  'ecommerce-cart-drawer-01': {
    componentId: 'ecommerce-cart-drawer-01',
    category: 'ecommerce',
    schema: CartDrawerSummarySchema,
    requiredFields: [],
    optionalFields: ['cartTitle', 'emptyMessage', 'checkoutButtonLabel', 'freeShippingThreshold'],
    factualClaimFields: ['freeShippingThreshold'],
    generatedCopyFields: ['cartTitle', 'emptyMessage', 'checkoutButtonLabel'],
    assetSlots: [],
  },

  // Footer
  'footer-editorial-architectural-01': {
    componentId: 'footer-editorial-architectural-01',
    category: 'footer',
    schema: EditorialFooterSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'brandTagline', 'columns', 'copyright', 'legalLinks'],
    factualClaimFields: ['brandName', 'copyright'],
    generatedCopyFields: ['brandTagline'],
    assetSlots: [{ slot: 'emblem', purpose: 'Footer sovereign architectural monogram', aspectRatio: '1:1', required: false }],
  },
  'footer-directory-multicolumn-01': {
    componentId: 'footer-directory-multicolumn-01',
    category: 'footer',
    schema: MultiColumnDirectoryFooterSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'dispatchContact', 'columns', 'legalNote'],
    factualClaimFields: ['brandName', 'dispatchContact'],
    generatedCopyFields: ['legalNote'],
    assetSlots: [],
  },
  'footer-minimal-legal-01': {
    componentId: 'footer-minimal-legal-01',
    category: 'footer',
    schema: MinimalLegalFooterSchema,
    requiredFields: [],
    optionalFields: ['brandName', 'copyrightYear', 'legalLinks'],
    factualClaimFields: ['brandName', 'copyrightYear'],
    generatedCopyFields: [],
    assetSlots: [],
  },
};

/**
 * Resolves the content contract for a given component ID, accounting for aliases.
 */
export function getContentContract(componentId: string): ComponentContentContract | undefined {
  if (componentContentContracts[componentId]) {
    return componentContentContracts[componentId];
  }
  const alias = componentAliases[componentId];
  if (alias && componentContentContracts[alias]) {
    return componentContentContracts[alias];
  }
  return undefined;
}

/**
 * Validates a component's content object against its contract.
 */
export function validateComponentContent(
  componentId: string,
  content: unknown
): { success: boolean; data?: any; errors?: string[] } {
  const contract = getContentContract(componentId);
  if (!contract) {
    return {
      success: false,
      errors: [`No content contract defined for component "${componentId}".`],
    };
  }

  const result = contract.schema.safeParse(content ?? {});
  if (!result.success) {
    const errorIssues = result.error.issues || (result.error as any).errors || [];
    const formattedErrors = errorIssues.map(
      (err: any) => `${err.path.join('.') || 'root'}: ${err.message}`
    );
    return {
      success: false,
      errors: formattedErrors.length > 0 ? formattedErrors : [result.error.message],
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

export function getAllContentContracts(): ComponentContentContract[] {
  return Object.values(componentContentContracts);
}
