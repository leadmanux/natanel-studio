export type ProjectType = 'business_website' | 'shopify';
export type TextDirection = 'ltr' | 'rtl';
export type ProjectStatus =
  | 'brief'
  | 'planning'
  | 'designing'
  | 'generating_assets'
  | 'building'
  | 'review'
  | 'approved'
  | 'exported';

export type ExportTarget = 'wordpress' | 'react' | 'managed' | 'shopify';

export interface SocialLink {
  platform: string;
  url: string;
}

export interface BusinessProfile {
  businessName: string;
  industry: string;
  description: string;
  location?: string;
  targetAudience: string;
  primaryGoal: string;
  secondaryGoals: string[];
  language: string;
  direction: TextDirection;
  phone?: string;
  whatsapp?: string;
  email?: string;
  existingWebsite?: string;
  socialLinks: SocialLink[];
}

export type RetrievalStatus = 'success' | 'failed' | 'limited';

export interface ReferenceAnalysis {
  id: string;
  url: string;
  analyzedAt: string;
  retrievalStatus?: RetrievalStatus;
  retrievedUrl?: string;
  retrievalNotes?: string;
  source?: 'ai' | 'deterministic_fallback';
  screenshots?:
    | {
        desktop?: string;
        mobile?: string;
      }
    | string[];
  summary: string;
  layout: string;
  typography: string;
  whitespace: string;
  navigation: string;
  heroComposition: string;
  imageTreatment: string;
  sectionTransitions: string;
  interactionPatterns: string;
  motion: string;
  conversionTechniques: string;
  extractedDesignPrinciples: string[];
}

export interface BrandProfile {
  logoAssets: string[];
  colors: string[];
  existingFonts: string[];
  brandNotes: string;
  uploadedAssets: string[];
  referenceSites: string[];
  referenceAnalyses?: ReferenceAnalysis[];
  visualPreferences?: string[];
  contentDensity?: 'spacious' | 'balanced' | 'compact' | 'editorial';
  ecommerceMode?: 'ecommerce' | 'lead_generation';
}

export interface Strategy {
  positioning: string;
  primaryCTA: string;
  secondaryCTA?: string;
  requiredPages: string[];
  requiredSections: string[];
  CRORequirements: string[];
  contentNotes: string;
}

export interface DesignSystem {
  artDirection: string;
  creativeConcept?: string;
  visualMood?: string;
  typography: string;
  typographyDirection?: string;
  colors: string[];
  colorDirection?: string;
  spacing: string;
  spacingPhilosophy?: string;
  borderRadius: string;
  imageStyle: string;
  photographyDirection?: string;
  imageGenerationStrategy?: string;
  motionStyle: string;
  motionPhilosophy?: string;
  layoutPhilosophy?: string;
  layoutRules: string[];
  avoidRules: string[];
  CROApproach?: string;
  recommendedComponentStyles?: string[];
  density?: 'spacious' | 'balanced' | 'compact' | 'editorial';
  visualPersonality?: string;
  approvedAt?: string;
}

export interface SiteSection {
  id: string;
  name: string;
  componentRegistryId: string;
  purpose: string;
  content: Record<string, unknown>;
  assetIds: string[];
  order: number;
  reason?: string;
  contentRequirements?: string[];
  imageRequirements?: string[];
  motionPreset?: string;
}

export interface SitePage {
  id: string;
  name: string;
  slug: string;
  purpose: string;
  sections: SiteSection[];
}

export interface GeneratedAsset {
  id: string;
  type: 'image' | 'video' | 'texture' | 'logo' | 'other';
  purpose: string;
  pageId?: string;
  sectionId?: string;
  prompt: string;
  negativePrompt?: string;
  aspectRatio: '1:1' | '4:5' | '3:4' | '9:16' | '16:9' | '21:9' | '4:1' | '8:1';
  resolution: '0.5K' | '1K' | '2K' | '4K';
  referenceAssets: string[];
  model: string;
  source?: 'ai' | 'deterministic_fallback';
  status: 'planned' | 'generating' | 'generated' | 'approved' | 'rejected' | 'failed';
  outputUrl?: string;
  createdAt?: string;
  visualConsistencyInstructions?: string;
}

export interface ExportConfig {
  target?: ExportTarget;
  settings: Record<string, unknown>;
  status: 'not_started' | 'validating' | 'ready' | 'exporting' | 'complete' | 'failed';
}

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  projectType: ProjectType;
  status: ProjectStatus;
  business: BusinessProfile;
  brand: BrandProfile;
  strategy: Strategy;
  designSystem: DesignSystem;
  pages: SitePage[];
  assets: GeneratedAsset[];
  exportConfig: ExportConfig;
}

export const createEmptyProject = (id: string, type: ProjectType, name = 'Untitled project'): Project => {
  const now = new Date().toISOString();
  return {
    id,
    name,
    createdAt: now,
    updatedAt: now,
    projectType: type,
    status: 'brief',
    business: {
      businessName: '',
      industry: '',
      description: '',
      targetAudience: '',
      primaryGoal: '',
      secondaryGoals: [],
      language: 'English',
      direction: 'ltr',
      socialLinks: [],
    },
    brand: {
      logoAssets: [],
      colors: [],
      existingFonts: [],
      brandNotes: '',
      uploadedAssets: [],
      referenceSites: [],
    },
    strategy: {
      positioning: '',
      primaryCTA: '',
      requiredPages: ['Home'],
      requiredSections: [],
      CRORequirements: [],
      contentNotes: '',
    },
    designSystem: {
      artDirection: '',
      typography: '',
      colors: [],
      spacing: '',
      borderRadius: '',
      imageStyle: '',
      motionStyle: '',
      layoutRules: [],
      avoidRules: [
        'Generic purple AI gradients',
        'Excessive rounded cards',
        'Unnecessary glassmorphism',
        'Decorative motion without purpose',
      ],
    },
    pages: [],
    assets: [],
    exportConfig: { settings: {}, status: 'not_started' },
  };
};
