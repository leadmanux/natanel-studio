import { GoogleGenAI, Type } from '@google/genai';
import type { GeneratedAsset, Project } from '../../shared/project';
import type { AssetPlannerService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';

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
        console.warn('[AssetPlanner] Gemini call failed, using calibrated studio asset generator:', err);
      }
    }

    return this.planDeterministicAssets(project);
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
      contents: prompt,
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
      referenceAssets: [],
      model: 'gemini-3.1-flash-image',
      status: 'planned' as const,
      createdAt: new Date().toISOString(),
      visualConsistencyInstructions: item.visualConsistencyInstructions,
    }));
  }

  private planDeterministicAssets(project: Project): GeneratedAsset[] {
    const businessName = project.business.businessName || 'The Atelier';
    const industry = project.business.industry || 'Architecture & Interior Design';
    const primaryColor = project.designSystem.colors?.[0] || '#0d0d0f';
    const paletteNotes = project.designSystem.colors?.join(', ') || 'Obsidian, bone white, raw travertine stone';
    const visualConsistency = `Match overall art direction: ${project.designSystem.artDirection || 'Architectural Monolith'}. Restrained warm-cool balance, directional 35mm natural side lighting, filmic subtle grain, zero oversaturation, palette harmony with ${paletteNotes}.`;

    return [
      {
        id: 'hero-main-banner',
        type: 'image',
        purpose: 'Primary Homepage Panoramic Cinema Hero',
        pageId: 'Home',
        sectionId: 'hero-section',
        prompt: `Architectural cinematic photograph representing ${industry} for ${businessName}. Ultra-wide 21:9 composition, exquisite minimalist spatial composition with cast shadows, tactile stone and dark walnut wood textures, natural soft diffuse morning daylight entering from the right, Hasselblad medium format camera clarity, 45mm lens, f/5.6, hyper-realistic materiality, editorial museum-grade aesthetic.`,
        negativePrompt: 'blurry, cartoon, 3d render, oversaturated, neon, generic corporate stock photo, artificial studio flash, distorted perspective',
        aspectRatio: '21:9',
        resolution: '4K',
        referenceAssets: [],
        model: 'gemini-3.1-flash-image',
        status: 'planned',
        createdAt: new Date().toISOString(),
        visualConsistencyInstructions: visualConsistency,
      },
      {
        id: 'project-panorama-1',
        type: 'image',
        purpose: 'Portfolio Flagship Panorama Banner',
        pageId: 'Home',
        sectionId: 'portfolio-showcase',
        prompt: `Bespoke ultra-wide 4:1 panorama showcase for ${industry}. Continuous linear architectural elevation, pristine natural materials, subtle cast shadows, clean horizontal symmetry, authentic material junctions with brushed dark bronze and pale travertine, shot on Leica S3, editorial architectural monograph standard.`,
        negativePrompt: 'cgi, cartoon, plastic, distorted lines, low resolution, watermark, text, saturated colors',
        aspectRatio: '4:1',
        resolution: '4K',
        referenceAssets: [],
        model: 'gemini-3.1-flash-image',
        status: 'planned',
        createdAt: new Date().toISOString(),
        visualConsistencyInstructions: visualConsistency,
      },
      {
        id: 'project-detail-vignette-1',
        type: 'image',
        purpose: 'Craftsmanship Detail Vignette',
        pageId: 'Home',
        sectionId: 'portfolio-showcase',
        prompt: `Intimate close-up detail vignette of craftsmanship in ${industry}. 16:9 ratio, shallow depth of field, focused on authentic raw textures, micro-bevels, tactile joinery, delicate ambient rim lighting, shot with 85mm prime lens f/2.8, restrained and tactile.`,
        negativePrompt: 'blurry, harsh flash, plastic texture, fake 3d, blown out highlights',
        aspectRatio: '16:9',
        resolution: '2K',
        referenceAssets: [],
        model: 'gemini-3.1-flash-image',
        status: 'planned',
        createdAt: new Date().toISOString(),
        visualConsistencyInstructions: visualConsistency,
      },
      {
        id: 'customer-portrait-1',
        type: 'image',
        purpose: 'Executive Client Testimonial Portrait',
        pageId: 'Home',
        sectionId: 'testimonials-section',
        prompt: `Authentic editorial portrait of an executive client, 4:5 vertical framing. Natural window light in a modern architect-designed office, thoughtful composed expression, genuine human demeanor, neutral tailored dark linen attire, soft out-of-focus architectural background with warm ambient depth, shot on Contax 645, 80mm lens f/2, non-corporate, editorial portrait style.`,
        negativePrompt: 'fake smiling model, generic stock photo, corporate thumbs up, heavy airbrush, distorted teeth, plastic skin',
        aspectRatio: '4:5',
        resolution: '2K',
        referenceAssets: [],
        model: 'gemini-3.1-flash-image',
        status: 'planned',
        createdAt: new Date().toISOString(),
        visualConsistencyInstructions: visualConsistency,
      },
      {
        id: 'product-macro-craft-1',
        type: 'image',
        purpose: 'Tactile Material & Offer Foundation',
        pageId: 'Home',
        sectionId: 'services-section',
        prompt: `Studio still life highlighting premium physical materials for ${businessName}. 1:1 square composition, dark slate background, warm directional spotlight casting soft linear shadow, honest physical tactile materials, minimal composition, Japanese wabi-sabi precision.`,
        negativePrompt: 'busy background, neon colors, text, artificial glow, cheap plastic, 3d render',
        aspectRatio: '1:1',
        resolution: '2K',
        referenceAssets: [],
        model: 'gemini-3.1-flash-image',
        status: 'planned',
        createdAt: new Date().toISOString(),
        visualConsistencyInstructions: visualConsistency,
      },
    ];
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
