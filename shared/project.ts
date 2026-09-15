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

export interface BrandProfile {
  logoAssets: string[];
  colors: string[];
  existingFonts: string[];
  brandNotes: string;
  uploadedAssets: string[];
  referenceSites: string[];
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
  typography: string;
  colors: string[];
  spacing: string;
  borderRadius: string;
  imageStyle: string;
  motionStyle: string;
  layoutRules: string[];
  avoidRules: string[];
}

export interface SiteSection {
  id: string;
  name: string;
  componentRegistryId: string;
  purpose: string;
  content: Record<string, unknown>;
  assetIds: string[];
  order: number;
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
  status: 'planned' | 'generating' | 'generated' | 'approved' | 'rejected' | 'failed';
  outputUrl?: string;
  createdAt?: string;
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
