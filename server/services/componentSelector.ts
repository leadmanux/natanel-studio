import { GoogleGenAI, Type } from '@google/genai';
import type { Project } from '../../shared/project';
import type { ComponentDefinition } from '../../shared/componentRegistry';
import type { ComponentSelectionItem, ComponentSelectorService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';
import { normalizeStudioMotionPreset } from '../../shared/studioMotion';
import { referenceAssetPromptContext, referenceImageParts } from './referenceAssetContext';

export class GeminiComponentSelector implements ComponentSelectorService {
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

  async select(project: Project, candidates: ComponentDefinition[]): Promise<string[]> {
    const detailed = await this.selectDetailed(project, candidates);
    return detailed.map((item) => item.componentRegistryId);
  }

  async selectDetailed(project: Project, candidates: ComponentDefinition[]): Promise<ComponentSelectionItem[]> {
    // Enforce mandate: Only APPROVED components may be automatically selected by the website generation agent
    const approvedCandidates = candidates.filter((c) => c.status === 'approved');

    if (this.ai) {
      try {
        const result = await this.selectWithGemini(project, approvedCandidates);
        if (result && result.length > 0) {
          return result;
        }
      } catch (err) {
        console.warn('[ComponentSelector] Gemini selection failed or timed out, using algorithmic selector:', err);
      }
    }

    return this.selectAlgorithmically(project, approvedCandidates);
  }

  private async selectWithGemini(project: Project, approvedCandidates: ComponentDefinition[]): Promise<ComponentSelectionItem[]> {
    if (!this.ai) throw new Error('AI not initialized');

    const prompt = `You are an elite Digital Architect and Technical Lead.
Select approved components from the registry to construct the required pages and sections for this project:
- Project: ${project.business.businessName || 'Studio Project'} (${project.projectType})
- Industry: ${project.business.industry}
- Goal: ${project.business.primaryGoal}
- Language / RTL: ${project.business.language} (${project.business.direction})
- Art Direction: ${project.designSystem.artDirection || 'Architectural Monolith'}
- Required Pages: ${project.strategy.requiredPages.join(', ') || 'Home'}

Uploaded visual references, in the same order as attached images:
${referenceAssetPromptContext(project, 6)}

REFERENCE-AWARE LAYOUT RULE:
When visual references are present, choose sections whose image requirements and composition genuinely fit the supplied product/lifestyle material. Do not force a component that requires visual assets we do not have or cannot credibly generate around the real product.

CRITICAL MANDATES:
1. You may ONLY select from the provided approved components list. Do NOT invent arbitrary markup.
2. Filter for RTL readiness if direction is 'rtl': ${project.business.direction === 'rtl'}.
3. Prioritize mobile quality >= 4.
4. Ensure components match the art direction and conversion goals.

Available Approved Registry Components:
${JSON.stringify(
  approvedCandidates.map((c) => ({
    id: c.id,
    name: c.name,
    category: c.category,
    styleTags: c.styleTags,
    industryFit: c.industryFit,
    conversionPurpose: c.conversionPurpose,
    rtlReady: c.rtlReady,
    mobileQuality: c.mobileQuality,
    motionLevel: c.motionLevel,
    imageRequirements: c.imageRequirements,
  })),
  null,
  2
)}

Return a structured JSON list of section selections that form a cohesive page experience.`;

    const response = await this.ai.models.generateContent({
      model: modelConfig.reasoningModel || 'gemini-3.8-flash',
      contents: [prompt, ...referenceImageParts(project, 6)],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              page: { type: Type.STRING },
              sectionPurpose: { type: Type.STRING },
              componentRegistryId: { type: Type.STRING },
              reason: { type: Type.STRING },
              contentRequirements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              imageRequirements: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              motionPreset: { type: Type.STRING },
            },
            required: [
              'page',
              'sectionPurpose',
              'componentRegistryId',
              'reason',
              'contentRequirements',
              'imageRequirements',
              'motionPreset',
            ],
          },
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response');
    const parsed = JSON.parse(text) as ComponentSelectionItem[];
    // Filter to ensure all chosen IDs exist in approved candidates
    const validIds = new Set(approvedCandidates.map((c) => c.id));
    return parsed
      .filter((item) => validIds.has(item.componentRegistryId))
      .map((item) => ({
        ...item,
        motionPreset: normalizeStudioMotionPreset(item.motionPreset),
      }));
  }

  private selectAlgorithmically(project: Project, approvedCandidates: ComponentDefinition[]): ComponentSelectionItem[] {
    const isRTL = project.business.direction === 'rtl';
    const isEcommerce = project.projectType === 'shopify' || project.brand.ecommerceMode === 'ecommerce';
    const pages = project.strategy.requiredPages.length > 0 ? project.strategy.requiredPages : ['Home'];

    const selections: ComponentSelectionItem[] = [];

    for (const page of pages) {
      // 1. Navigation
      const navComp = approvedCandidates.find((c) => c.category === 'navigation' && (!isRTL || c.rtlReady));
      if (navComp) {
        selections.push({
          page,
          sectionPurpose: 'Site Navigation and Primary Action Anchor',
          componentRegistryId: navComp.id,
          reason: `Provides restrained, accessible navigation with native ${isRTL ? 'RTL' : 'LTR'} alignment and persistent conversion trigger.`,
          contentRequirements: ['Brand Logo', 'Primary Page Links', 'Direct Action Trigger ("Contact" or "Inquire")'],
          imageRequirements: [],
          motionPreset: normalizeStudioMotionPreset('fadeSettle'),
        });
      }

      // 2. Hero Section
      const heroComp =
        approvedCandidates.find(
          (c) =>
            c.category === 'hero' &&
            (!isRTL || c.rtlReady) &&
            (c.id.includes('panorama') || c.id.includes('split'))
        ) || approvedCandidates.find((c) => c.category === 'hero');

      if (heroComp) {
        selections.push({
          page,
          sectionPurpose: 'Hero Statement & Above-the-Fold Positioning',
          componentRegistryId: heroComp.id,
          reason: `Establishes immediate high-craft positioning for ${project.business.businessName || 'the brand'} using cinematic framing and strong typography.`,
          contentRequirements: [
            'Core Value Proposition Headline',
            'Sub-headline detailing specific client transformation',
            'Primary Call-to-Action button',
          ],
          imageRequirements: heroComp.imageRequirements.map((r) => `${r.slot} (${r.aspectRatio}): ${r.purpose}`),
          motionPreset: normalizeStudioMotionPreset('clipReveal'),
        });
      }

      // 3. Trust Strip / Social Proof
      const trustComp = approvedCandidates.find((c) => c.category === 'cro' && (!isRTL || c.rtlReady));
      if (trustComp) {
        selections.push({
          page,
          sectionPurpose: 'Trust Badges & Immediate Credibility Proof',
          componentRegistryId: trustComp.id,
          reason: `Addresses visitor skepticism immediately below the hero with verified certifications, guarantees, and client metrics.`,
          contentRequirements: ['Industry Certifications', 'Verified Outcome Badges', 'Key Guarantee Pillars'],
          imageRequirements: [],
          motionPreset: normalizeStudioMotionPreset('none'),
        });
      }

      // 4. Core Content / Showcase / Ecommerce / Services
      if (isEcommerce) {
        const ecomComp = approvedCandidates.find((c) => c.category === 'ecommerce' && (!isRTL || c.rtlReady));
        if (ecomComp) {
          selections.push({
            page,
            sectionPurpose: 'Featured Product Catalog & Tactile Merchandising',
            componentRegistryId: ecomComp.id,
            reason: `Editorial product presentation with direct cart integration and responsive tactile previews.`,
            contentRequirements: ['Product Titles', 'Price & Material Spec', 'Add-to-Bag Action'],
            imageRequirements: ecomComp.imageRequirements.map((r) => `${r.slot} (${r.aspectRatio}): ${r.purpose}`),
            motionPreset: normalizeStudioMotionPreset('imageScaleOnScroll'),
          });
        }
      } else {
        const portfolioComp = approvedCandidates.find((c) => c.category === 'portfolio' && (!isRTL || c.rtlReady));
        if (portfolioComp) {
          selections.push({
            page,
            sectionPurpose: 'Flagship Portfolio & Craft Demonstration',
            componentRegistryId: portfolioComp.id,
            reason: `Demonstrates verified excellence through asymmetric architectural project layouts and panoramic vignettes.`,
            contentRequirements: ['Project Title', 'Client Brief & Result', 'Materials & Methodology Details'],
            imageRequirements: portfolioComp.imageRequirements.map((r) => `${r.slot} (${r.aspectRatio}): ${r.purpose}`),
            motionPreset: normalizeStudioMotionPreset('imageScaleOnScroll'),
          });
        }
      }

      // 5. Services Matrix
      const serviceComp = approvedCandidates.find((c) => c.category === 'services' && (!isRTL || c.rtlReady));
      if (serviceComp) {
        selections.push({
          page,
          sectionPurpose: 'Comprehensive Service Capabilities Matrix',
          componentRegistryId: serviceComp.id,
          reason: `Presents core capabilities with disciplined typography instead of generic icon boxes.`,
          contentRequirements: ['Capability Titles', 'Detailed Scope Breakdown', 'Expected Timeline & Deliverables'],
          imageRequirements: [],
          motionPreset: normalizeStudioMotionPreset('fadeSettle'),
        });
      }

      // 6. Testimonials / Verified Portraits
      const testComp = approvedCandidates.find((c) => c.category === 'testimonials' && (!isRTL || c.rtlReady));
      if (testComp) {
        selections.push({
          page,
          sectionPurpose: 'Client Testimonial & Verifiable Endorsement',
          componentRegistryId: testComp.id,
          reason: `Pairs authentic portrait photography with quantitative client results to dissolve remaining hesitation.`,
          contentRequirements: ['Client Name and Executive Title', 'Verified Quote', 'Specific Outcome Metric'],
          imageRequirements: testComp.imageRequirements.map((r) => `${r.slot} (${r.aspectRatio}): ${r.purpose}`),
          motionPreset: normalizeStudioMotionPreset('fadeSettle'),
        });
      }

      // 7. Inquiry Form
      const formComp = approvedCandidates.find((c) => c.category === 'forms' && (!isRTL || c.rtlReady));
      if (formComp) {
        selections.push({
          page,
          sectionPurpose: 'High-Intent Frictionless Inquiry Intake',
          componentRegistryId: formComp.id,
          reason: `Provides structured client onboarding with clear expectations and zero unnecessary friction.`,
          contentRequirements: ['Project Timeline Selector', 'Scope Selector', 'Direct Contact Fields'],
          imageRequirements: [],
          motionPreset: normalizeStudioMotionPreset('fadeSettle'),
        });
      }

      // 8. Final CTA
      const ctaComp = approvedCandidates.find((c) => c.category === 'cta' && (!isRTL || c.rtlReady));
      if (ctaComp) {
        selections.push({
          page,
          sectionPurpose: 'High-Contrast Final Action Commitment',
          componentRegistryId: ctaComp.id,
          reason: `Decisive conclusion to the narrative with stark contrast and unambiguous action trigger.`,
          contentRequirements: ['Concluding Thesis Headline', 'Primary Action Button', 'Secondary Contact Option'],
          imageRequirements: [],
          motionPreset: normalizeStudioMotionPreset('fadeSettle'),
        });
      }

      // 9. Footer
      const footComp = approvedCandidates.find((c) => c.category === 'footer' && (!isRTL || c.rtlReady));
      if (footComp) {
        selections.push({
          page,
          sectionPurpose: 'Architectural Footer Directory & Compliance',
          componentRegistryId: footComp.id,
          reason: `Grounds the website with complete navigation directory, copyright, legal links, and business address.`,
          contentRequirements: ['Full Page Sitemap', 'Legal & Privacy Links', 'Business Address & Localized Tax Info'],
          imageRequirements: [],
          motionPreset: normalizeStudioMotionPreset('none'),
        });
      }
    }

    return selections;
  }
}
