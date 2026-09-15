import type { GeneratedAsset, Project } from '@shared/project';
import type { ComponentDefinition } from '@shared/componentRegistry';

export interface ArtDirectionProposal {
  id: string;
  name: string;
  rationale: string;
  typographyDirection: string;
  palette: string[];
  imageDirection: string;
  motionDirection: string;
  layoutPrinciples: string[];
  avoid: string[];
}

export interface ArtDirectorService {
  proposeDirections(project: Project): Promise<ArtDirectionProposal[]>;
}

export interface SitePlannerService {
  plan(project: Project): Promise<Project['pages']>;
}

export interface ComponentSelectorService {
  select(project: Project, candidates: ComponentDefinition[]): Promise<string[]>;
}

export interface AssetPlannerService {
  plan(project: Project): Promise<GeneratedAsset[]>;
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

export interface DesignCriticService {
  review(project: Project, screenshots: string[]): Promise<DesignCriticFinding[]>;
}
