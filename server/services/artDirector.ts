import { GoogleGenAI, Type } from '@google/genai';
import type { Project } from '../../shared/project';
import type { ArtDirectionProposal, ArtDirectorService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';

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
          return proposals;
        }
      } catch (err) {
        console.warn('[ArtDirector] Gemini call failed or timed out, using calibrated fallback:', err);
      }
    }

    return this.generateDeterministicProposals(project);
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

  private generateDeterministicProposals(project: Project): ArtDirectionProposal[] {
    const isEcommerce = project.projectType === 'shopify' || project.brand.ecommerceMode === 'ecommerce';
    const industry = project.business.industry || 'Bespoke Atelier';
    const businessName = project.business.businessName || 'Studio Project';
    const isRTL = project.business.direction === 'rtl';

    return [
      {
        id: 'direction-editorial-monolith',
        name: 'Direction A: Architectural Monolith',
        artDirectionName: 'Architectural Monolith',
        creativeConcept: `Monolithic typography and deliberate cinematic scale that elevates ${businessName} into an authoritative, institutional benchmark.`,
        visualMood: 'Austere luxury, grounded prestige, museum-grade balance with tactile charcoal and bone pigments.',
        rationale: `Positions ${businessName} above commodity competitors in ${industry} by rejecting SaaS templates in favor of bespoke architectural rhythm.`,
        typographyDirection: isRTL
          ? 'Display: Frank Ruehl / Assistant Light 600; Body: Noto Sans Hebrew 400. High-contrast hierarchy with 1.333 scale ratio.'
          : 'Display: Editorial Serif (Cormorant / Instrument Serif); Body: Neutral Grotesk (General Sans 400). Tracking -0.04em on hero headlines.',
        palette: ['#0d0d0f', '#161619', '#e8e6e1', '#b3aba0', '#2a2a2f'],
        colorDirection: 'Deep volcanic obsidian paired with warm limestone and bone white. Zero artificial saturated neon.',
        photographyDirection: '21:9 cinematic architectural vistas, natural directional light, deep geometric shadows, tangible material textures.',
        imageDirection: 'Low-key, tactile materials, high natural contrast, absence of generic studio smile poses.',
        layoutPhilosophy: 'Asymmetric editorial canvas with expansive negative space. Content breathes with zero nested card borders.',
        layoutPrinciples: [
          'Full-bleed 21:9 and 16:9 compositions with sharp proportional rhythm',
          'Single-plane hierarchy: dividers and optical whitespace replace container boxes',
          isRTL ? 'Native right-to-left optical anchors with reversed focal balance' : 'Left-aligned architectural axes with staggered reading paths',
          'Rhythmic alternation between dense tabular facts and panoramic breathing frames',
        ],
        motionPhilosophy: 'Subtle inertia. Gentle opacity fades with 400ms cubic-bezier easing. No whimsical bouncy animations.',
        motionDirection: 'Restrained cubic ease-out transitions on scroll trigger with 0.98 -> 1.0 optical settling.',
        spacingPhilosophy: 'Spacious cadence: 96px to 140px section gutters with strict 24px baseline rhythm.',
        CROApproach: isEcommerce
          ? 'Understated luxury merchandising: direct add-to-bag with tactile preview and immediate material trust badges.'
          : 'High-intent qualifying intake: contextual private consultation triggers positioned after major proof monuments.',
        recommendedComponentStyles: [
          'Panoramic Cinema Hero (21:9)',
          'Asymmetric Project Showcase',
          'Typographic Services Matrix',
          'Verified Client Portrait Duo',
          'High-Contrast Final Action',
        ],
        imageGenerationStrategy: 'Generate cinematic architectural and product assets at 4K and 2K with 21:9 and 4:1 panoramas via gemini-3.1-flash-image.',
        avoid: [
          'Excessive rounded cards (radius strictly capped at 2px or 0px sharp edges)',
          'Purple, blue or pink SaaS gradients',
          'Meaningless 3-column bento grids',
          'Random glassmorphism blur layers',
          'Overused SaaS headlines like "Supercharge your workflow"',
          'Arbitrary floating pill buttons',
          'Generic stock-photo corporate handshakes',
          'Identical 3-box rhythm repeated across sections',
        ],
        density: 'spacious',
        visualPersonality: 'Authoritative, timeless, and unapologetically refined',
      },
      {
        id: 'direction-swiss-precision',
        name: 'Direction B: Swiss Precision & Tactile System',
        artDirectionName: 'Swiss Precision & Tactile System',
        creativeConcept: `Rigorous modernist grid system showcasing ${businessName}'s craft and technical mastery through mathematical clarity.`,
        visualMood: 'Industrial refinement, tabular exactness, tactile graphite and stark paper white contrast.',
        rationale: `Demonstrates operational excellence, uncompromised clarity, and verified performance for ${industry} clients.`,
        typographyDirection: isRTL
          ? 'Display: Heebo Medium 550; Body: Noto Sans Hebrew 400; Mono: Space Mono Hebrew. Tabular numerical metrics.'
          : 'Display: Helvetica / Neue Montreal 500; Body: Inter / Suisse Int 400; Mono: JetBrains Mono for metadata tags.',
        palette: ['#121214', '#1c1c20', '#f4f4f0', '#9c9ca3', '#d9532f'],
        colorDirection: 'Technical graphite canvas (#121214) with pure stark white text and an intentional single vermilion accent (#d9532f) for primary actions.',
        photographyDirection: 'Close-up tactile craft, macro material grain, unretouched honesty, documentary perspective.',
        imageDirection: 'Tangible product detail, calibrated monochrome with selective warm specular highlights.',
        layoutPhilosophy: 'Mathematical modular grid. Explicit hairline dividers (#27272b) providing structural certainty.',
        layoutPrinciples: [
          'Strict modular column alignment with visible structural hairline boundaries',
          'Tabular metric matrices paired with crisp, unambiguous micro-copy',
          'Horizontal flow strips for proof, certifications, and guarantees',
          'Sticky micro-navigation with persistent status indicators',
        ],
        motionPhilosophy: 'Crisp mechanical precision. Fast 180ms linear transitions with instant tactile button feedback.',
        motionDirection: 'Linear micro-snaps, zero inertia overshoot, instant interactive feedback.',
        spacingPhilosophy: 'Balanced geometric grid: 64px to 80px section spacing with compact 16px internal padding.',
        CROApproach: isEcommerce
          ? 'Technical product specifications, immediate variant switcher, transparent shipping calculation, and instant proof.'
          : 'Clear tiered proposition, direct calendar booking or structured project estimator with zero ambiguity.',
        recommendedComponentStyles: [
          'Editorial Split Hero',
          'Conversion Trust Strip',
          'Typographic Services Matrix',
          'High-Intent Frictionless Inquiry',
          'Architectural Monolith Footer',
        ],
        imageGenerationStrategy: 'Generate 4:5 macro portraits and 16:9 focused product documentary assets using gemini-3.1-flash-image.',
        avoid: [
          'Floated puffy pill buttons (all buttons use structured geometric rectangular bounds)',
          'Drop shadows or blurred card glows',
          'Vague conceptual 3D floating shapes',
          'Generic marketing fluff without empirical proof',
          'Identical card grids',
          'Neon cyan highlights on dark backgrounds',
        ],
        density: 'balanced',
        visualPersonality: 'Analytical, razor-sharp, and engineering-grade',
      },
      {
        id: 'direction-editorial-narrative',
        name: 'Direction C: Warm Organic Editorial',
        artDirectionName: 'Warm Organic Editorial',
        creativeConcept: `Rich narrative pacing and warm tonal warmth that turns ${businessName} into a memorable human story.`,
        visualMood: 'Warm linen, olive-tinged neutrals, artisanal depth, inviting warmth without losing high-end rigor.',
        rationale: `Cultivates profound emotional affinity and client confidence for ${businessName} through bespoke storytelling cadence.`,
        typographyDirection: isRTL
          ? 'Display: David Libre / Taamey David; Body: Alef / Assistant. Warm literary tracking and generous leading.'
          : 'Display: Ogg / Playfair Display Medium; Body: Newsreader / Söhne 400. Elegant 1.6 baseline leading.',
        palette: ['#141312', '#1f1d1b', '#f7f5f0', '#d1c7b7', '#73624c'],
        colorDirection: 'Warm roasted espresso (#141312), aged parchment (#f7f5f0), and warm raw umber accents (#73624c).',
        photographyDirection: 'Warm ambient lighting, authentic candid interactions, atmospheric environmental portraiture with golden-hour warmth.',
        imageDirection: 'Warm atmospheric photography, filmic grain, honest human presence, and spatial depth.',
        layoutPhilosophy: 'Varied narrative pacing: shifting between single-column manifestos, panoramic image breaks, and intimate quotes.',
        layoutPrinciples: [
          'Variable narrative rhythm that deliberately breaks monotonous repetition',
          'Generous typographic editorial quotes integrated with client portrait duos',
          'Continuous storytelling scroll with subtle staggered parallax on media',
          'Tactile, warm background transitions across major narrative chapters',
        ],
        motionPhilosophy: 'Organic momentum. Smooth 600ms fluid deceleration simulating physical paper and camera glide.',
        motionDirection: 'Smooth parabolic acceleration and deceleration on view entrance.',
        spacingPhilosophy: 'Airy editorial breathing room: 100px to 160px chapter transitions.',
        CROApproach: isEcommerce
          ? 'Story-driven commerce: heritage and craftsmanship details leading seamlessly into curated bundles and seasonal editions.'
          : 'Relationship-first engagement: founder note and transparent process walkthrough prior to inquiry dispatch.',
        recommendedComponentStyles: [
          'Panoramic Cinema Hero (21:9)',
          'Asymmetric Project Showcase',
          'Verified Client Portrait Duo',
          'High-Intent Frictionless Inquiry',
          'Editorial Product Showcase Reel',
        ],
        imageGenerationStrategy: 'Generate warm atmospheric 4:5 portraits and 21:9 environmental vistas via gemini-3.1-flash-image.',
        avoid: [
          'Cold clinical blue or purple palettes',
          'Sterile corporate SaaS icons in colored circles',
          'Cluttered multi-tier pricing cards with checkmark lists',
          'Generic stock models smiling at screens',
          'Floating decorative blobs',
          'Aggressive high-friction popups',
        ],
        density: 'editorial',
        visualPersonality: 'Intimate, cultured, and thoughtfully handcrafted',
      },
    ];
  }
}
