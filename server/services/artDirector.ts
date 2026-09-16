import { GoogleGenAI, Type } from '@google/genai';
import type { Project } from '../../shared/project';
import type { ArtDirectionProposal, ArtDirectorService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';
import { getFallbackArtDirections } from '../../shared/industryTaxonomy';

export class GeminiArtDirector implements ArtDirectorService {
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

  async proposeDirections(project: Project): Promise<ArtDirectionProposal[]> {
    if (this.ai) {
      try {
        const proposals = await this.generateWithGemini(project);
        if (proposals && proposals.length === 3) {
          return proposals.map((p) => ({ ...p, source: 'ai' as const }));
        }
      } catch (err) {
        console.warn('[ArtDirector] Gemini call failed or timed out, using calibrated fallback:', err);
      }
    }

    return getFallbackArtDirections(project);
  }

  private async generateWithGemini(project: Project): Promise<ArtDirectionProposal[]> {
    if (!this.ai) throw new Error('AI not initialized');

    const prompt = `You are a world-class Executive Art Director for bespoke luxury and high-performance digital brand experiences.
Analyze this project:
- Business: ${project.business.businessName || 'Bespoke Brand'}
- Industry: ${project.business.industry || 'Modern Business'}
- Description: ${project.business.description || 'High-end service provider'}
- Target Audience: ${project.business.targetAudience || 'Discerning clientele'}
- Primary Conversion Goal: ${project.business.primaryGoal || 'High-intent client inquiries'}
- Language & Direction: ${project.business.language} (${project.business.direction.toUpperCase()})
- Brand Colors: ${project.brand.colors.join(', ') || 'Monochrome & warm stone'}
- References: ${project.brand.referenceSites.join(', ') || 'Awwwards / Siteinspire winners'}
- Content Density: ${project.brand.contentDensity || 'spacious'}
- Mode: ${project.brand.ecommerceMode || (project.projectType === 'shopify' ? 'ecommerce' : 'lead_generation')}

CRITICAL MANDATE:
Generate THREE GENUINELY DIFFERENT design concepts.
They MUST differ in:
1. typography (distinct primary and secondary fonts with clear rationale)
2. layout structure (e.g., asymmetric split vs. rigorous tabular grid vs. open fluid editorial)
3. image treatment (e.g., cinematic 21:9 monochrome vs. tactile warm architectural vs. high-contrast studio vignettes)
4. component choices and styling
5. motion philosophy (restrained vs. kinetic physics vs. deliberate ambient)
6. density (spacious vs. balanced vs. editorial)
7. visual personality

ANTI-SLOP MANDATE:
Do NOT produce generic AI layouts. You must EXPLICITLY enforce rules against:
- Excessive rounded cards (cards within cards)
- Purple-to-blue gradients
- Meaningless bento grids
- Random glassmorphism or glowing drop-shadows
- Giant SaaS-style headlines for every industry
- Excessive pill buttons
- Arbitrary floating shapes
- Generic stock-photo aesthetics
- Identical section rhythm throughout the page

Return structured JSON containing exactly 3 distinct concepts.`;

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
              name: { type: Type.STRING },
              artDirectionName: { type: Type.STRING },
              creativeConcept: { type: Type.STRING },
              visualMood: { type: Type.STRING },
              rationale: { type: Type.STRING },
              typographyDirection: { type: Type.STRING },
              palette: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              colorDirection: { type: Type.STRING },
              photographyDirection: { type: Type.STRING },
              imageDirection: { type: Type.STRING },
              layoutPhilosophy: { type: Type.STRING },
              layoutPrinciples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              motionPhilosophy: { type: Type.STRING },
              motionDirection: { type: Type.STRING },
              spacingPhilosophy: { type: Type.STRING },
              CROApproach: { type: Type.STRING },
              recommendedComponentStyles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              imageGenerationStrategy: { type: Type.STRING },
              avoid: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              density: { type: Type.STRING },
              visualPersonality: { type: Type.STRING },
            },
            required: [
              'id',
              'name',
              'creativeConcept',
              'visualMood',
              'rationale',
              'typographyDirection',
              'palette',
              'colorDirection',
              'photographyDirection',
              'imageDirection',
              'layoutPhilosophy',
              'layoutPrinciples',
              'motionPhilosophy',
              'motionDirection',
              'spacingPhilosophy',
              'CROApproach',
              'recommendedComponentStyles',
              'imageGenerationStrategy',
              'avoid',
            ],
          },
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');
    const parsed = JSON.parse(text) as ArtDirectionProposal[];
    return parsed;
  }
}

