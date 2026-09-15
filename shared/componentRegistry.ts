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
  status: 'draft' | 'approved' | 'deprecated';
}

export const demoComponents: ComponentDefinition[] = [
  {
    id: 'hero-editorial-split-01',
    name: 'Editorial Split Hero',
    category: 'hero',
    description: 'Large editorial headline with offset media and restrained motion.',
    source: 'internal',
    license: 'Proprietary internal component',
    tags: ['editorial', 'premium', 'image-led'],
    industryFit: ['interiors', 'architecture', 'fashion', 'professional-services'],
    styleTags: ['editorial', 'minimal', 'luxury'],
    conversionPurpose: ['positioning', 'primary-cta'],
    mobileQuality: 5,
    rtlReady: true,
    motionLevel: 'subtle',
    imageRequirements: [{ slot: 'hero', aspectRatio: '16:9', purpose: 'Primary brand image', required: true }],
    dependencies: [],
    framework: 'platform-neutral',
    codeLocation: 'src/components/registry/demo/EditorialSplitHero.tsx',
    status: 'approved',
  },
  {
    id: 'cro-trust-strip-01',
    name: 'Conversion Trust Strip',
    category: 'cro',
    description: 'Compact trust row for guarantees, shipping, payments and proof.',
    source: 'internal',
    license: 'Proprietary internal component',
    tags: ['trust', 'cro', 'ecommerce'],
    industryFit: ['ecommerce'],
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
];
