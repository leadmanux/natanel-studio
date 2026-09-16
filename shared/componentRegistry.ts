export type ComponentCategory =
  | 'navigation'
  | 'hero'
  | 'logos'
  | 'features'
  | 'services'
  | 'gallery'
  | 'portfolio'
  | 'storytelling'
  | 'stats'
  | 'comparison'
  | 'before_after'
  | 'testimonials'
  | 'reviews'
  | 'faq'
  | 'forms'
  | 'cta'
  | 'footer'
  | 'motion'
  | 'ecommerce'
  | 'cro';

export interface ImageRequirement {
  slot: string;
  aspectRatio: string;
  purpose: string;
  required: boolean;
}

export interface ComponentDefinition {
  id: string;
  name: string;
  category: ComponentCategory;
  description: string;
  source: 'internal' | 'magic-ui' | 'motion-primitives' | 'kokonut-ui' | 'custom' | string;
  license: string;
  tags: string[];
  industryFit: string[];
  styleTags: string[];
  conversionPurpose: string[];
  mobileQuality: 1 | 2 | 3 | 4 | 5;
  rtlReady: boolean;
  motionLevel: 'none' | 'subtle' | 'moderate' | 'advanced';
  imageRequirements: ImageRequirement[];
  dependencies: string[];
  framework: 'react' | 'liquid' | 'wordpress' | 'platform-neutral';
  codeLocation: string;
  previewImage?: string;
  status: 'candidate' | 'approved' | 'rejected' | 'draft' | 'deprecated';
}

export const demoComponents: ComponentDefinition[] = [
  {
    id: 'hero-editorial-split-01',
    name: 'Editorial Split Hero',
    category: 'hero',
    description: 'Large editorial headline with offset media and restrained typography layout.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['editorial', 'premium', 'image-led'],
    industryFit: ['interiors', 'architecture', 'fashion', 'professional-services', 'general'],
    styleTags: ['editorial', 'minimal', 'luxury', 'high-contrast'],
    conversionPurpose: ['positioning', 'primary-cta'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [{ slot: 'hero', aspectRatio: '16:9', purpose: 'Primary brand architectural/product image', required: true }],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/EditorialSplitHero.tsx',
    status: 'approved',
  },
  {
    id: 'hero-architectural-panorama-02',
    name: 'Panoramic Cinema Hero',
    category: 'hero',
    description: 'Ultra-wide 21:9 visual banner with grounded typographic hierarchy and direct CTA.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['panoramic', 'cinema', 'immersive'],
    industryFit: ['real-estate', 'architecture', 'hospitality', 'automotive'],
    styleTags: ['cinematic', 'architectural', 'bold'],
    conversionPurpose: ['brand-authority', 'primary-cta'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [{ slot: 'hero-panorama', aspectRatio: '21:9', purpose: 'Panoramic high-res banner', required: true }],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/PanoramicHero.tsx',
    status: 'approved',
  },
  {
    id: 'nav-minimal-dock-01',
    name: 'Restrained Studio Nav',
    category: 'navigation',
    description: 'Floating or border-docked minimal navigation with pristine RTL alignment and contact trigger.',
    source: 'motion-primitives',
    license: 'MIT',
    tags: ['navigation', 'dock', 'sticky'],
    industryFit: ['all', 'creative', 'agency', 'ecommerce'],
    styleTags: ['minimal', 'restrained'],
    conversionPurpose: ['navigation', 'sticky-cta'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [],
    dependencies: ['lucide-react'],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/StudioNav.tsx',
    status: 'approved',
  },
  {
    id: 'cro-trust-strip-01',
    name: 'Conversion Trust Strip',
    category: 'cro',
    description: 'Compact trust row for guarantees, verified outcomes, certifications and client proof.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['trust', 'cro', 'proof'],
    industryFit: ['ecommerce', 'finance', 'consulting', 'medical', 'services'],
    styleTags: ['clean', 'conversion'],
    conversionPurpose: ['trust', 'objection-handling'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'none',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/TrustStrip.tsx',
    status: 'approved',
  },
  {
    id: 'portfolio-asymmetric-narrative-01',
    name: 'Asymmetric Project Showcase',
    category: 'portfolio',
    description: 'Editorial layout presenting case studies with 4:1 panoramas and detail vignettes.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['case-study', 'editorial', 'gallery'],
    industryFit: ['architecture', 'interiors', 'design', 'luxury'],
    styleTags: ['editorial', 'asymmetric', 'high-craft'],
    conversionPurpose: ['demonstration', 'social-proof'],
    mobileQuality: 4,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [
      { slot: 'project-panorama-1', aspectRatio: '4:1', purpose: 'Ultra-wide project view', required: true },
      { slot: 'project-detail-1', aspectRatio: '16:9', purpose: 'Detail craftsmanship capture', required: true },
    ],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/AsymmetricPortfolio.tsx',
    status: 'approved',
  },
  {
    id: 'services-editorial-matrix-01',
    name: 'Typographic Services Matrix',
    category: 'services',
    description: 'Textured typographic service tiers without generic icon boxes or card proliferation.',
    source: 'magic-ui',
    license: 'MIT',
    tags: ['services', 'editorial', 'cards-alternative'],
    industryFit: ['consulting', 'law', 'advisory', 'architecture'],
    styleTags: ['typographic', 'restrained', 'sophisticated'],
    conversionPurpose: ['service-clarity', 'inquiry'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/ServicesMatrix.tsx',
    status: 'approved',
  },
  {
    id: 'testimonials-portrait-duo-01',
    name: 'Verified Client Portrait Duo',
    category: 'testimonials',
    description: 'High-credibility quotation block pairing authentic 4:5 portrait imagery with quantified impact.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['testimonials', 'credibility', 'portrait'],
    industryFit: ['b2b', 'consulting', 'ecommerce', 'services'],
    styleTags: ['authentic', 'editorial', 'high-trust'],
    conversionPurpose: ['social-proof', 'de-risking'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'none',
    imageRequirements: [{ slot: 'customer-portrait-1', aspectRatio: '4:5', purpose: 'Authentic executive/client portrait', required: true }],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/PortraitTestimonials.tsx',
    status: 'approved',
  },
  {
    id: 'forms-high-intent-inquiry-01',
    name: 'High-Intent Frictionless Inquiry',
    category: 'forms',
    description: 'Structured proposal intake form with clear value exchange and native RTL micro-interactions.',
    source: 'kokonut-ui',
    license: 'MIT',
    tags: ['lead-capture', 'inquiry', 'cro'],
    industryFit: ['lead-gen', 'agency', 'contractors', 'luxury-services'],
    styleTags: ['direct', 'tactile', 'minimal'],
    conversionPurpose: ['primary-conversion', 'lead-qualification'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/InquiryForm.tsx',
    status: 'approved',
  },
  {
    id: 'cta-contrast-closure-01',
    name: 'High-Contrast Final Action',
    category: 'cta',
    description: 'Full-bleed decisive closing section with stark typography and unmissable call-to-action.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['cta', 'final-push', 'high-contrast'],
    industryFit: ['all'],
    styleTags: ['stark', 'authoritative'],
    conversionPurpose: ['final-conversion'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/FinalActionCTA.tsx',
    status: 'approved',
  },
  {
    id: 'footer-architectural-01',
    name: 'Architectural Monolith Footer',
    category: 'footer',
    description: 'Subtle section divider, clean directory layout, legal badges, and localized business presence.',
    source: 'internal',
    license: 'Proprietary Studio',
    tags: ['footer', 'directory', 'legal'],
    industryFit: ['all'],
    styleTags: ['architectural', 'structured'],
    conversionPurpose: ['site-depth', 'trust'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'none',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/ArchitecturalFooter.tsx',
    status: 'approved',
  },
  {
    id: 'ecommerce-editorial-reel-01',
    name: 'Editorial Product Showcase Reel',
    category: 'ecommerce',
    description: 'Clean product catalog reel with direct Shopify cart integration and tactile image hover.',
    source: 'kokonut-ui',
    license: 'MIT',
    tags: ['shopify', 'catalog', 'ecommerce'],
    industryFit: ['shopify', 'ecommerce', 'fashion', 'homeware'],
    styleTags: ['editorial', 'commerce'],
    conversionPurpose: ['add-to-cart', 'product-discovery'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [{ slot: 'product-feature-1', aspectRatio: '4:5', purpose: 'Product studio shot', required: true }],
    dependencies: [],
    framework: 'liquid',
    codeLocation: 'src/components/registry/demo/ProductShowcaseReel.tsx',
    status: 'approved',
  },
  {
    id: 'features-floating-bento-candidate-01',
    name: 'Experimental Floating Grid',
    category: 'features',
    description: 'Candidate component featuring asymmetric feature groupings; pending visual rhythm verification.',
    source: '21st-dev',
    license: 'MIT',
    tags: ['grid', 'experimental', 'candidate'],
    industryFit: ['technology', 'software'],
    styleTags: ['modern', 'experimental'],
    conversionPurpose: ['feature-tour'],
    mobileQuality: 3,
    rtlReady: false,
    motionLevel: 'moderate',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/candidate/FloatingGrid.tsx',
    status: 'candidate',
  },
  {
    id: 'hero-purple-gradient-rejected-01',
    name: 'Generic SaaS Card Cluster',
    category: 'hero',
    description: 'Rejected cliché design with purple-to-cyan gradient background and excessive floating cards.',
    source: 'custom',
    license: 'Proprietary',
    tags: ['rejected', 'cliche', 'generic-ai'],
    industryFit: ['none'],
    styleTags: ['glassmorphism', 'purple-gradient'],
    conversionPurpose: ['none'],
    mobileQuality: 2,
    rtlReady: false,
    motionLevel: 'advanced',
    imageRequirements: [],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/rejected/GenericSaaS.tsx',
    status: 'rejected',
  },
];
