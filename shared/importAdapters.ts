import type { ComponentCategory, ComponentDefinition } from './componentRegistry';

export interface ExternalComponentPayload {
  sourceUrl: string;
  source: 'magic-ui' | 'motion-primitives' | 'kokonut-ui' | '21st-dev' | 'custom' | string;
  author: string;
  license: string;
  originalCategory: string;
  name: string;
  description: string;
  rawCode: string;
  dependencies: string[];
  tags: string[];
}

export interface ImportedComponentResult {
  sourceUrl: string;
  license: string;
  author: string;
  source: string;
  dependencies: string[];
  originalCategory: string;
  internalTransformedVersion: ComponentDefinition;
  importedAt: string;
}

export interface ComponentImportAdapter {
  id: string;
  name: string;
  sourceType: 'magic-ui' | 'motion-primitives' | 'kokonut-ui' | '21st-dev' | 'custom';
  description: string;
  supportedLicenses: string[];
  canAdapt(payload: ExternalComponentPayload): boolean;
  adapt(payload: ExternalComponentPayload): Promise<ImportedComponentResult>;
}

export class MagicUiAdapter implements ComponentImportAdapter {
  id = 'adapter-magic-ui';
  name = 'Magic UI Adapter';
  sourceType = 'magic-ui' as const;
  description = 'Adapts Tailwind/Motion Primitives components from Magic UI with RTL support and neutral tokens.';
  supportedLicenses = ['MIT', 'Apache-2.0'];

  canAdapt(payload: ExternalComponentPayload): boolean {
    return payload.source === 'magic-ui';
  }

  async adapt(payload: ExternalComponentPayload): Promise<ImportedComponentResult> {
    const transformed: ComponentDefinition = {
      id: `magic-ui-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: payload.name,
      category: mapCategory(payload.originalCategory),
      description: payload.description,
      source: 'magic-ui',
      license: payload.license,
      tags: [...payload.tags, 'magic-ui', 'curated-animation'],
      industryFit: ['technology', 'architecture', 'creative', 'modern-commerce'],
      styleTags: ['modern', 'dynamic', 'refined'],
      conversionPurpose: ['visual-interest', 'interaction'],
      mobileQuality: 4,
      rtlReady: true,
      motionLevel: 'subtle',
      imageRequirements: [],
      dependencies: payload.dependencies,
      framework: 'platform-neutral',
      codeLocation: `src/components/registry/imported/magic-ui/${payload.name}.tsx`,
      status: 'candidate',
    };

    return {
      sourceUrl: payload.sourceUrl,
      license: payload.license,
      author: payload.author,
      source: payload.source,
      dependencies: payload.dependencies,
      originalCategory: payload.originalCategory,
      internalTransformedVersion: transformed,
      importedAt: new Date().toISOString(),
    };
  }
}

export class MotionPrimitivesAdapter implements ComponentImportAdapter {
  id = 'adapter-motion-primitives';
  name = 'Motion Primitives Adapter';
  sourceType = 'motion-primitives' as const;
  description = 'Translates gesture and fluid viewport transition primitives into Natanel Studio motion systems.';
  supportedLicenses = ['MIT'];

  canAdapt(payload: ExternalComponentPayload): boolean {
    return payload.source === 'motion-primitives';
  }

  async adapt(payload: ExternalComponentPayload): Promise<ImportedComponentResult> {
    const transformed: ComponentDefinition = {
      id: `motion-prim-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: payload.name,
      category: mapCategory(payload.originalCategory),
      description: payload.description,
      source: 'motion-primitives',
      license: payload.license,
      tags: [...payload.tags, 'motion-primitives', 'physics-based'],
      industryFit: ['luxury', 'fashion', 'agency', 'interiors'],
      styleTags: ['fluid', 'editorial', 'restrained'],
      conversionPurpose: ['storytelling', 'delight'],
      mobileQuality: 5,
      rtlReady: true,
      motionLevel: 'moderate',
      imageRequirements: [],
      dependencies: payload.dependencies,
      framework: 'platform-neutral',
      codeLocation: `src/components/registry/imported/motion-primitives/${payload.name}.tsx`,
      status: 'candidate',
    };

    return {
      sourceUrl: payload.sourceUrl,
      license: payload.license,
      author: payload.author,
      source: payload.source,
      dependencies: payload.dependencies,
      originalCategory: payload.originalCategory,
      internalTransformedVersion: transformed,
      importedAt: new Date().toISOString(),
    };
  }
}

export class KokonutUiAdapter implements ComponentImportAdapter {
  id = 'adapter-kokonut-ui';
  name = 'Kokonut UI Adapter';
  sourceType = 'kokonut-ui' as const;
  description = 'Integrates micro-interactions, inputs and interactive cards from Kokonut UI.';
  supportedLicenses = ['MIT'];

  canAdapt(payload: ExternalComponentPayload): boolean {
    return payload.source === 'kokonut-ui';
  }

  async adapt(payload: ExternalComponentPayload): Promise<ImportedComponentResult> {
    const transformed: ComponentDefinition = {
      id: `kokonut-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: payload.name,
      category: mapCategory(payload.originalCategory),
      description: payload.description,
      source: 'kokonut-ui',
      license: payload.license,
      tags: [...payload.tags, 'kokonut-ui', 'micro-interactions'],
      industryFit: ['saas', 'commerce', 'services'],
      styleTags: ['tactile', 'minimal'],
      conversionPurpose: ['engagement', 'conversion'],
      mobileQuality: 4,
      rtlReady: true,
      motionLevel: 'subtle',
      imageRequirements: [],
      dependencies: payload.dependencies,
      framework: 'platform-neutral',
      codeLocation: `src/components/registry/imported/kokonut/${payload.name}.tsx`,
      status: 'candidate',
    };

    return {
      sourceUrl: payload.sourceUrl,
      license: payload.license,
      author: payload.author,
      source: payload.source,
      dependencies: payload.dependencies,
      originalCategory: payload.originalCategory,
      internalTransformedVersion: transformed,
      importedAt: new Date().toISOString(),
    };
  }
}

export class TwentyFirstDevAdapter implements ComponentImportAdapter {
  id = 'adapter-21st-dev';
  name = '21st.dev Pattern Adapter';
  sourceType = '21st-dev' as const;
  description = 'Sanitizes and refactors community 21st.dev blocks into the Natanel Studio quality standard.';
  supportedLicenses = ['MIT', 'Unlicense'];

  canAdapt(payload: ExternalComponentPayload): boolean {
    return payload.source === '21st-dev';
  }

  async adapt(payload: ExternalComponentPayload): Promise<ImportedComponentResult> {
    const transformed: ComponentDefinition = {
      id: `twentyfirst-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: payload.name,
      category: mapCategory(payload.originalCategory),
      description: payload.description,
      source: '21st-dev',
      license: payload.license,
      tags: [...payload.tags, '21st-dev', 'community-vetted'],
      industryFit: ['modern-business', 'lifestyle'],
      styleTags: ['contemporary', 'clean'],
      conversionPurpose: ['conversion'],
      mobileQuality: 4,
      rtlReady: true,
      motionLevel: 'subtle',
      imageRequirements: [],
      dependencies: payload.dependencies,
      framework: 'platform-neutral',
      codeLocation: `src/components/registry/imported/21st-dev/${payload.name}.tsx`,
      status: 'candidate',
    };

    return {
      sourceUrl: payload.sourceUrl,
      license: payload.license,
      author: payload.author,
      source: payload.source,
      dependencies: payload.dependencies,
      originalCategory: payload.originalCategory,
      internalTransformedVersion: transformed,
      importedAt: new Date().toISOString(),
    };
  }
}

export class CustomComponentAdapter implements ComponentImportAdapter {
  id = 'adapter-custom';
  name = 'Studio Custom Adapter';
  sourceType = 'custom' as const;
  description = 'Internal custom components designed specifically for bespoke agency client sites.';
  supportedLicenses = ['Proprietary'];

  canAdapt(payload: ExternalComponentPayload): boolean {
    return payload.source === 'custom' || payload.source === 'internal';
  }

  async adapt(payload: ExternalComponentPayload): Promise<ImportedComponentResult> {
    const transformed: ComponentDefinition = {
      id: `custom-${payload.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: payload.name,
      category: mapCategory(payload.originalCategory),
      description: payload.description,
      source: 'custom',
      license: payload.license,
      tags: [...payload.tags, 'studio-bespoke'],
      industryFit: ['all'],
      styleTags: ['bespoke', 'architectural'],
      conversionPurpose: ['lead-capture', 'trust'],
      mobileQuality: 5,
      rtlReady: true,
      motionLevel: 'subtle',
      imageRequirements: [],
      dependencies: payload.dependencies,
      framework: 'platform-neutral',
      codeLocation: `src/components/registry/custom/${payload.name}.tsx`,
      status: 'approved',
    };

    return {
      sourceUrl: payload.sourceUrl,
      license: payload.license,
      author: payload.author,
      source: payload.source,
      dependencies: payload.dependencies,
      originalCategory: payload.originalCategory,
      internalTransformedVersion: transformed,
      importedAt: new Date().toISOString(),
    };
  }
}

function mapCategory(cat: string): ComponentCategory {
  const normalized = cat.toLowerCase();
  if (normalized.includes('hero')) return 'hero';
  if (normalized.includes('nav') || normalized.includes('header')) return 'navigation';
  if (normalized.includes('feature')) return 'features';
  if (normalized.includes('service')) return 'services';
  if (normalized.includes('testim') || normalized.includes('review')) return 'testimonials';
  if (normalized.includes('foot')) return 'footer';
  if (normalized.includes('form') || normalized.includes('contact')) return 'forms';
  if (normalized.includes('cta')) return 'cta';
  if (normalized.includes('stat') || normalized.includes('metric')) return 'stats';
  if (normalized.includes('port') || normalized.includes('work') || normalized.includes('gallery')) return 'portfolio';
  if (normalized.includes('shop') || normalized.includes('ecom') || normalized.includes('product')) return 'ecommerce';
  if (normalized.includes('trust') || normalized.includes('cro')) return 'cro';
  return 'features';
}

export const componentImportAdapters: ComponentImportAdapter[] = [
  new MagicUiAdapter(),
  new MotionPrimitivesAdapter(),
  new KokonutUiAdapter(),
  new TwentyFirstDevAdapter(),
  new CustomComponentAdapter(),
];
