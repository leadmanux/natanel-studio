import { createEmptyProject, type Project, type ProjectType, type TextDirection } from './project';

export type SupportedStudioLanguage = 'English' | 'Hebrew';

export interface ProjectTypeDefaults {
  label: string;
  shortDescription: string;
  ecommerceMode: 'ecommerce' | 'lead_generation';
  contentDensity: 'spacious' | 'balanced' | 'compact' | 'editorial';
  primaryGoal: string;
  primaryCTA: string;
  secondaryCTA: string;
  requiredPages: string[];
  requiredSections: string[];
  croRequirements: string[];
  exportTarget: 'wordpress' | 'shopify';
}

export const PROJECT_TYPE_DEFAULTS: Record<ProjectType, ProjectTypeDefaults> = {
  business_website: {
    label: 'Business Website',
    shortDescription: 'Lead-generation or brand website for a service business.',
    ecommerceMode: 'lead_generation',
    contentDensity: 'spacious',
    primaryGoal: 'Generate qualified leads and inquiries',
    primaryCTA: 'Contact us',
    secondaryCTA: 'Learn more',
    requiredPages: ['Home', 'Services', 'About', 'Contact'],
    requiredSections: ['Navigation', 'Hero', 'Services', 'Trust', 'CTA', 'FAQ', 'Footer'],
    croRequirements: ['Clear primary CTA', 'Trust signals', 'Contact path', 'Mobile-first inquiry flow'],
    exportTarget: 'wordpress',
  },
  shopify: {
    label: 'Shopify Store',
    shortDescription: 'Conversion-focused ecommerce store with native Shopify checkout.',
    ecommerceMode: 'ecommerce',
    contentDensity: 'editorial',
    primaryGoal: 'Drive online purchases',
    primaryCTA: 'Shop now',
    secondaryCTA: 'View product',
    requiredPages: ['Home', 'Shop', 'Product', 'About', 'Contact'],
    requiredSections: ['Navigation', 'Product Hero', 'Product Grid', 'Product Details', 'Trust', 'FAQ', 'Footer'],
    croRequirements: ['Clear Add to Cart', 'Product trust', 'Shipping clarity', 'Mobile-first purchase flow'],
    exportTarget: 'shopify',
  },
};

export function directionForLanguage(language: SupportedStudioLanguage): TextDirection {
  return language === 'Hebrew' ? 'rtl' : 'ltr';
}

export function normalizeStudioLanguage(language?: string): SupportedStudioLanguage {
  return language?.toLowerCase().startsWith('heb') || language?.includes('עבר') ? 'Hebrew' : 'English';
}

export function applyProjectTypeDefaults(
  project: Project,
  type: ProjectType,
  options: { preserveUserStrategy?: boolean } = {}
): Project {
  const defaults = PROJECT_TYPE_DEFAULTS[type];
  const preserve = options.preserveUserStrategy ?? false;

  return {
    ...project,
    projectType: type,
    updatedAt: new Date().toISOString(),
    business: {
      ...project.business,
      primaryGoal: preserve && project.business.primaryGoal ? project.business.primaryGoal : defaults.primaryGoal,
    },
    brand: {
      ...project.brand,
      ecommerceMode: defaults.ecommerceMode,
      contentDensity: project.brand.contentDensity || defaults.contentDensity,
    },
    strategy: {
      ...project.strategy,
      primaryCTA: preserve && project.strategy.primaryCTA ? project.strategy.primaryCTA : defaults.primaryCTA,
      secondaryCTA: preserve && project.strategy.secondaryCTA ? project.strategy.secondaryCTA : defaults.secondaryCTA,
      requiredPages: preserve && project.strategy.requiredPages.length ? project.strategy.requiredPages : [...defaults.requiredPages],
      requiredSections:
        preserve && project.strategy.requiredSections.length ? project.strategy.requiredSections : [...defaults.requiredSections],
      CRORequirements:
        preserve && project.strategy.CRORequirements.length ? project.strategy.CRORequirements : [...defaults.croRequirements],
    },
    exportConfig: {
      ...project.exportConfig,
      target: defaults.exportTarget,
      status: 'not_started',
    },
  };
}

export function applyLanguage(
  project: Project,
  language: SupportedStudioLanguage
): Project {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    business: {
      ...project.business,
      language,
      direction: directionForLanguage(language),
    },
  };
}


export function createProjectWithDefaults(
  id: string,
  type: ProjectType,
  name: string,
  language: SupportedStudioLanguage = 'English'
): Project {
  const project = createEmptyProject(id, type, name);
  const withTypeDefaults = applyProjectTypeDefaults(project, type);
  return applyLanguage(withTypeDefaults, language);
}
