import type { GeneratedAsset, Project, ReferenceAnalysis } from '@shared/project';
import type { ComponentDefinition } from '@shared/componentRegistry';

export interface ArtDirectionProposal {
  id: string;
  name: string; // artDirectionName
  artDirectionName?: string;
  creativeConcept: string;
  visualMood: string;
  rationale: string;
  typographyDirection: string;
  palette: string[];
  colorDirection: string;
  photographyDirection: string;
  imageDirection: string;
  layoutPhilosophy: string;
  layoutPrinciples: string[];
  motionPhilosophy: string;
  motionDirection: string;
  spacingPhilosophy: string;
  CROApproach: string;
  recommendedComponentStyles: string[];
  imageGenerationStrategy: string;
  avoid: string[]; // avoidRules
  density?: 'spacious' | 'balanced' | 'compact' | 'editorial';
  visualPersonality?: string;
}

export interface ArtDirectorService {
  proposeDirections(project: Project): Promise<ArtDirectionProposal[]>;
}

export interface SitePlannerService {
  plan(project: Project): Promise<Project['pages']>;
}

export interface ComponentSelectionItem {
  page: string;
  sectionPurpose: string;
  componentRegistryId: string;
  reason: string;
  contentRequirements: string[];
  imageRequirements: string[];
  motionPreset: string;
}

export interface ComponentSelectorService {
  select(project: Project, candidates: ComponentDefinition[]): Promise<string[]>;
  selectDetailed(project: Project, candidates: ComponentDefinition[]): Promise<ComponentSelectionItem[]>;
}

export interface AssetPlannerService {
  plan(project: Project): Promise<GeneratedAsset[]>;
}

export interface ReferenceAnalyzerService {
  analyze(url: string, projectContext?: Partial<Project>): Promise<ReferenceAnalysis>;
}

export interface ImageGeneratorRequest {
  prompt: string;
  negativePrompt?: string;
  aspectRatio: GeneratedAsset['aspectRatio'];
  resolution: GeneratedAsset['resolution'];
  referenceImageUrls?: string[];
}

export interface ImageGeneratorResponse {
  mimeType: string;
  base64Data: string;
  text?: string;
}

export interface ImageGeneratorService {
  generate(request: ImageGeneratorRequest): Promise<ImageGeneratorResponse>;
}

export interface DesignCriticFinding {
  category: 'visual' | 'mobile' | 'rtl' | 'cro' | 'accessibility' | 'performance' | 'content';
  severity: 'low' | 'medium' | 'high';
  message: string;
  suggestedFix: string;
}

export interface CategoryCritique {
  category:
    | 'hierarchy'
    | 'typography'
    | 'spacing'
    | 'visual repetition'
    | 'excessive cards'
    | 'image quality'
    | 'brand consistency'
    | 'conversion clarity'
    | 'CTA prominence'
    | 'mobile experience'
    | 'RTL quality'
    | 'AI-generated website feeling';
  status: 'passed' | 'warning' | 'alert';
  score: number; // 0 - 100
  findings: string[];
  actionableCorrections: string[];
}

export interface DesignCriticReport {
  summary: string;
  categories: CategoryCritique[];
  findings: DesignCriticFinding[];
  evaluatedAt: string;
}

export interface DesignCriticService {
  review(project: Project, screenshots?: string[]): Promise<DesignCriticReport>;
}

