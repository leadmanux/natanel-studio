import { GoogleGenAI, Type } from '@google/genai';
import type { GeneratedAsset, Project } from '../../shared/project';
import type { AssetPlannerService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';
import { referenceAssetIds, referenceAssetPromptContext, referenceImageParts } from './referenceAssetContext';
import { getFallbackAssets } from '../../shared/industryTaxonomy';

export class GeminiAssetPlanner implements AssetPlannerService {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' },
        },
      });
    }
  }

  async plan(project: Project): Promise<GeneratedAsset[]> {
    if (this.ai) {
      try {
        const assets = await this.planWithGemini(project);
        if (assets && assets.length > 0) {
          return assets;
        }
      } catch (err) {
        console.warn('[AssetPlanner] Gemini call failed, using calibrated industry asset generator:', err);
      }
    }

    return getFallbackAssets(project);
  }

  private async planWithGemini(project: Project): Promise<GeneratedAsset[]> {
    if (!this.ai) throw new Error('AI not initialized');

    const prompt = `You are an elite Digital Art Director and Production Lead.
Create a complete, cohesive website asset manifest for this project:
- Brand: ${project.business.businessName || 'Bespoke Brand'} (${project.business.industry})
- Art Direction: ${project.designSystem.artDirection || 'Architectural Monolith'}
- Creative Concept: ${project.designSystem.creativeConcept || 'Understated luxury, museum-grade balance'}
- Photography Direction: ${project.designSystem.photographyDirection || 'Natural directional light, tactile material textures, 21:9 and 4:1 wide aspect ratios'}
- Color Palette: ${project.designSystem.colors.join(', ')}
- Required Pages: ${project.strategy.requiredPages.join(', ') || 'Home'}

Uploaded visual references, in the same order as attached images:
${referenceAssetPromptContext(project)}

REFERENCE-BOUND GENERATION RULES:
- Inspect uploaded references directly when present.
- Product-focused generated assets must preserve the visible identity of the real product: proportions, silhouette, colors, controls, head shape, packaging and finish.
- Lifestyle references define believable context, audience and photographic tone; do not copy a person's identity.
- Do not introduce visible product features that are absent from the supplied product references.
- Do not infer product efficacy, medical claims, specifications or certifications from imagery.
- Write prompts that explicitly tell the image model which visible reference details must remain unchanged.

CRITICAL RULES:
1. Create a complete, production-ready manifest covering all primary visual slots:
   - Hero: e.g. hero-main (21:9 or 16:9, 4K)
   - Projects/Showcase: e.g. project-panorama-1 (4:1, 4K), project-detail-1 (16:9, 2K)
   - Testimonials: e.g. customer-portrait-1 (4:5, 2K)
   - Product/Feature: e.g. product-focus-1 (1:1 or 4:5, 2K)
2. Every prompt must be photographic, high-end, realistic, and specific.
3. Every asset must include visualConsistencyInstructions to ensure cohesive lighting, color grading, and camera focal length across the entire suite.
4. Set model to 'gemini-3.1-flash-image'.
5. Set status to 'planned'.

Return structured JSON array of assets.`;

    const response = await this.ai.models.generateContent({
      model: modelConfig.reasoningModel || 'gemini-3.8-flash',
      contents: [prompt, ...referenceImageParts(project, 8)],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              purpose: { type: Type.STRING },
              pageId: { type: Type.STRING },
              sectionId: { type: Type.STRING },
              prompt: { type: Type.STRING },
              negativePrompt: { type: Type.STRING },
              aspectRatio: { type: Type.STRING },
              resolution: { type: Type.STRING },
              visualConsistencyInstructions: { type: Type.STRING },
            },
            required: [
              'id',
              'purpose',
              'prompt',
              'aspectRatio',
              'resolution',
              'visualConsistencyInstructions',
            ],
          },
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response');
    const parsed = JSON.parse(text);

    return parsed.map((item: any) => ({
      id: item.id || `asset-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'image' as const,
      purpose: item.purpose,
      pageId: item.pageId || 'Home',
      sectionId: item.sectionId || 'hero',
      prompt: item.prompt,
      negativePrompt: item.negativePrompt || 'cartoon, render, oversaturated, blurry, 3d, artificial plastic sheen, deformed hands, stock photo smile',
      aspectRatio: normalizeAspectRatio(item.aspectRatio),
      resolution: normalizeResolution(item.resolution),
      referenceAssets: referenceAssetIds(project, 6),
      model: 'gemini-3.1-flash-image',
      status: 'planned' as const,
      source: 'ai' as const,
      createdAt: new Date().toISOString(),
      visualConsistencyInstructions: item.visualConsistencyInstructions,
    }));
  }
}

function normalizeAspectRatio(ratio: string): GeneratedAsset['aspectRatio'] {
  const valid: GeneratedAsset['aspectRatio'][] = ['1:1', '4:5', '3:4', '9:16', '16:9', '21:9', '4:1', '8:1'];
  return valid.includes(ratio as any) ? (ratio as any) : '16:9';
}

function normalizeResolution(res: string): GeneratedAsset['resolution'] {
  const valid: GeneratedAsset['resolution'][] = ['0.5K', '1K', '2K', '4K'];
  return valid.includes(res as any) ? (res as any) : '2K';
}
