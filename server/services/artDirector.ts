import { GoogleGenAI, Type } from '@google/genai';
import type { Project } from '../../shared/project';
import type { ArtDirectionProposal, ArtDirectorService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';
import { getFallbackArtDirections } from '../../shared/industryTaxonomy';
import { referenceAssetPromptContext, referenceImageParts } from './referenceAssetContext';

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
- Private project brief (context only, never storefront copy): ${project.business.description || 'No private brief supplied'}
- Target Audience: ${project.business.targetAudience || 'Discerning clientele'}
- Primary Conversion Goal: ${project.business.primaryGoal || 'High-intent client inquiries'}
- Language & Direction: ${project.business.language} (${project.business.direction.toUpperCase()})
- Brand Colors: ${project.brand.colors.join(', ') || 'Monochrome & warm stone'}
- References: ${project.brand.referenceSites.join(', ') || 'Awwwards / Siteinspire winners'}
- Content Density: ${project.brand.contentDensity || 'spacious'}
- Mode: ${project.brand.ecommerceMode || (project.projectType === 'shopify' ? 'ecommerce' : 'lead_generation')}

Uploaded product / brand visual references, in the same order as the attached images:
${referenceAssetPromptContext(project)}

REFERENCE IMAGE MANDATE:
- Inspect the supplied images directly when present.
- Treat PRODUCT references as the source of truth for visible product shape, proportions, colors, controls, packaging and material finish.
- Treat LIFESTYLE references as context for audience, environment, photographic tone and usage scenarios.
- Do not infer medical, technical, performance, certification, pricing or efficacy claims from an image.
- Do not redesign the product identity when proposing the site's visual language.
- If references conflict, prioritize the image marked PRIMARY PRODUCT REFERENCE.

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

COMMERCIAL TRUTH MANDATE:
- Design the conversion structure, not promotional facts.
- Do NOT invent discounts, bundles, limited-time offers, free gifts, shipping promises, guarantees, warranties, review counts, ratings, certifications, clinical claims, scarcity, stock levels, or price comparisons.
- If a commercial term is not explicitly present in ProjectFacts or the user brief, leave it out.
- CROApproach should describe placement and hierarchy (for example: product proof near CTA), not fabricate an offer.
- Treat the private business brief as context; never recommend exposing internal instructions on the storefront.

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
      contents: [prompt, ...referenceImageParts(project, 8)],
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

