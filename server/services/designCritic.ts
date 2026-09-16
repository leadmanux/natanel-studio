import { GoogleGenAI, Type } from '@google/genai';
import type { Project } from '../../shared/project';
import type { CategoryCritique, DesignCriticReport, DesignCriticService, DesignCriticFinding } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';

export class GeminiDesignCritic implements DesignCriticService {
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

  async review(
    project: Project,
    screenshots?: string[] | { desktop?: string; mobile?: string }
  ): Promise<DesignCriticReport> {
    if (this.ai) {
      try {
        const report = await this.reviewWithGemini(project, screenshots);
        if (report && report.categories.length > 0) {
          return report;
        }
      } catch (err) {
        console.warn('[DesignCritic] Gemini review failed, using deep rule-based design evaluation engine:', err);
      }
    }

    return this.evaluateAlgorithmicReport(project, screenshots);
  }

  private async reviewWithGemini(
    project: Project,
    screenshots?: string[] | { desktop?: string; mobile?: string }
  ): Promise<DesignCriticReport> {
    if (!this.ai) throw new Error('AI not initialized');

    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    let hasDesktop = false;
    let hasMobile = false;

    if (screenshots) {
      if (Array.isArray(screenshots)) {
        screenshots.forEach((shot, idx) => {
          const match = shot.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
          if (match) {
            imageParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
            if (idx === 0) hasDesktop = true;
            if (idx === 1) hasMobile = true;
          }
        });
      } else if (typeof screenshots === 'object') {
        if (screenshots.desktop) {
          const match = screenshots.desktop.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
          if (match) {
            imageParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
            hasDesktop = true;
          }
        }
        if (screenshots.mobile) {
          const match = screenshots.mobile.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
          if (match) {
            imageParts.push({
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            });
            hasMobile = true;
          }
        }
      }
    }

    const hasImages = imageParts.length > 0;

    const prompt = `You are a legendary Senior Design Critic and Web Design Judge.
Critique the proposed site architecture and rendered design for this project:
- Business: ${project.business.businessName} (${project.business.industry})
- Direction: ${project.business.direction} (RTL: ${project.business.direction === 'rtl'})
- Art Direction: ${project.designSystem.artDirection}
- Layout Philosophy: ${project.designSystem.layoutPhilosophy || 'Bespoke editorial'}
- Avoid Rules: ${project.designSystem.avoidRules.join(', ')}
- Pages & Sections:
${project.pages
  .map(
    (p) =>
      `Page: ${p.name}\nSections: ${p.sections.map((s) => `${s.name} (component: ${s.componentRegistryId}, purpose: ${s.purpose})`).join(', ')}`
  )
  .join('\n')}

${
  hasImages
    ? `VISUAL SCREENSHOT INSPECTION MANDATE:
You have been provided actual rendered screenshots of the website (${hasDesktop ? 'Desktop' : ''} ${hasMobile ? 'Mobile' : ''}).
You MUST perform real visual inspection of these screenshots.
For every category:
- Set evidenceLevel to 'visually_verified' if the observation is directly confirmed in the screenshots (e.g., rendered typography, actual spacing, visual contrast, button styling, layout reflow).
- Set evidenceLevel to 'architecture_inference' if the observation is deduced from the specifications or component tree because it is offscreen or not visible in the screenshot.
- Provide 'visualObservations': array of concrete visual facts directly seen in the screenshots (e.g. "Observed 112px hero section padding", "Verified high-contrast white text against dark limestone slate", "Hero CTA button rendered with 48px height and 24px padding").`
    : `NOTE: No visual screenshots were provided. Set evidenceLevel to 'architecture_inference' across all categories, and evaluate based on architecture, component schemas, and design specifications.`
}

MANDATORY CRITIQUE CRITERIA:
Do NOT reduce this to one meaningless overall score. Evaluate EACH of the following 12 individual categories:
1. hierarchy (scale contrast, visual pacing, clear dominance)
2. typography (pairing tension, line-length, tracking, readability)
3. spacing (rhythmic breathing room, padding logic, absence of claustrophobic crowding)
4. visual repetition (is the page repeating the same 3-box or 2-column layout endlessly?)
5. excessive cards (are cards inside cards or gratuitous card containers used where clean typography and dividers suffice?)
6. image quality (aspect ratio variety, photographic authenticity, absence of generic stock)
7. brand consistency (alignment with stated industry, color discipline, authentic tone)
8. conversion clarity (is the core value proposition immediate and friction-free?)
9. CTA prominence (is the primary call to action obvious, unambiguous, and well-timed?)
10. mobile experience (touch targets >= 44px, single-column reflow, no horizontal overflow)
11. RTL quality (are visual anchors, alignments, typography scales properly mirrored for RTL when applicable?)
12. “AI-generated website” feeling (detect and call out any lingering purple gradients, useless bento grids, floating glassmorphism shapes, or empty SaaS buzzwords)

Return structured JSON containing summary, array of category reviews (category, status: passed|warning|alert, score: 0-100, findings, actionableCorrections, evidenceLevel, visualObservations), and specific findings.`;

    const contents: any[] = [prompt, ...imageParts];

    const response = await this.ai.models.generateContent({
      model: modelConfig.reasoningModel || 'gemini-3.8-flash',
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            categories: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  status: { type: Type.STRING },
                  score: { type: Type.INTEGER },
                  findings: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  actionableCorrections: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  evidenceLevel: { type: Type.STRING },
                  visualObservations: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                },
                required: ['category', 'status', 'score', 'findings', 'actionableCorrections'],
              },
            },
            findings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  message: { type: Type.STRING },
                  suggestedFix: { type: Type.STRING },
                },
                required: ['category', 'severity', 'message', 'suggestedFix'],
              },
            },
          },
          required: ['summary', 'categories', 'findings'],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response');
    const cleanedJson = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanedJson);

    return {
      summary: parsed.summary,
      categories: parsed.categories.map((c: any) => ({
        ...c,
        score: typeof c.score === 'number' ? c.score : null,
        evidenceLevel: hasImages
          ? (c.evidenceLevel === 'visually_verified' ? 'visually_verified' : c.evidenceLevel || 'architecture_inference')
          : (c.evidenceLevel === 'visually_verified' ? 'architecture_inference' : c.evidenceLevel || 'architecture_inference'),
        visualObservations: hasImages ? (c.visualObservations || []) : [],
      })),
      findings: parsed.findings,
      evaluatedAt: new Date().toISOString(),
      source: 'ai',
      inspectedScreenshots: {
        desktop: hasImages && hasDesktop,
        mobile: hasImages && hasMobile,
        count: hasImages ? imageParts.length : 0,
      },
    };
  }

  private evaluateAlgorithmicReport(
    project: Project,
    _screenshots?: string[] | { desktop?: string; mobile?: string }
  ): DesignCriticReport {
    const isRtl = project.business.direction === 'rtl';
    const hasApprovedArtDirection = !!project.designSystem.artDirection;
    const allSections = project.pages.flatMap((p) => p.sections);
    const hasHero = allSections.some((s) => s.componentRegistryId.includes('hero') || s.name.toLowerCase().includes('hero'));
    const hasCTA = allSections.some((s) => s.componentRegistryId.includes('cta') || s.name.toLowerCase().includes('cta') || s.componentRegistryId.includes('forms'));
    const hasTrust = allSections.some((s) => s.componentRegistryId.includes('cro') || s.componentRegistryId.includes('testimonials'));

    const sectionComponentIds = allSections.map((s) => s.componentRegistryId);
    const hasConsecutiveDuplicates = sectionComponentIds.some((id, i) => i > 0 && id === sectionComponentIds[i - 1]);
    const uniqueComponentTypes = new Set(sectionComponentIds).size;
    const hasSectionVariety = uniqueComponentTypes >= Math.min(3, sectionComponentIds.length) && !hasConsecutiveDuplicates;

    // CRITICAL: The deterministic fallback NEVER inspects screenshot pixels.
    // - evidenceLevel must NEVER be 'visually_verified'.
    // - visualObservations must ALWAYS be empty.
    // - inspectedScreenshots must indicate NO AI inspection took place.
    // - Visual-only claims that cannot be verified from metadata are marked as 'insufficient_evidence' with score: null.
    const categories: CategoryCritique[] = [
      {
        category: 'hierarchy',
        status: hasHero ? 'passed' : 'alert',
        score: hasHero ? 82 : 45,
        findings: hasHero
          ? ['Hero section component planned above the fold as initial focal anchor in component tree.']
          : ['No primary hero section detected above the fold in page component tree.'],
        actionableCorrections: hasHero
          ? ['Ensure heading component enforces clear scale contrast when rendered.']
          : ['Introduce a dedicated hero component to anchor page hierarchy.'],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'typography',
        status: 'not_evaluated',
        score: null,
        findings: [
          `Specification designates "${project.designSystem.typography || 'Standard typography'}", but rendered typographic pairing, line length, and scale contrast cannot be visually verified without AI screenshot inspection.`,
        ],
        actionableCorrections: [
          'Upload rendered screenshots for multimodal AI typography and readability inspection.',
        ],
        evidenceLevel: 'insufficient_evidence',
        visualObservations: [],
      },
      {
        category: 'spacing',
        status: 'not_evaluated',
        score: null,
        findings: [
          'Exact rendered padding, gutter rhythm, and element breathing room cannot be verified from metadata alone without AI screenshot inspection.',
        ],
        actionableCorrections: [
          'Upload rendered screenshots to visually inspect negative space, padding rhythm, and section transitions.',
        ],
        evidenceLevel: 'insufficient_evidence',
        visualObservations: [],
      },
      {
        category: 'visual repetition',
        status: hasSectionVariety ? 'passed' : 'warning',
        score: hasSectionVariety ? 82 : 60,
        findings: hasSectionVariety
          ? [`Component sequence demonstrates structural variety across ${uniqueComponentTypes} distinct component definition(s) without consecutive duplicate sections.`]
          : ['Consecutive duplicate component types or low component variety detected in page section sequence.'],
        actionableCorrections: hasSectionVariety
          ? ['Maintain section cadence during layout implementation.']
          : ['Introduce alternating editorial or asymmetric section layouts to avoid repetition.'],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'excessive cards',
        status: 'not_evaluated',
        score: null,
        findings: [
          'Card container nesting, borders, and visual card density cannot be verified from metadata alone without AI screenshot inspection.',
        ],
        actionableCorrections: [
          'Inspect rendered layout to confirm absence of nested cards and excessive boxed containers.',
        ],
        evidenceLevel: 'insufficient_evidence',
        visualObservations: [],
      },
      {
        category: 'image quality',
        status: project.assets.length > 0 ? 'passed' : 'warning',
        score: project.assets.length > 0 ? 80 : 55,
        findings: project.assets.length > 0
          ? [`${project.assets.length} planned image asset(s) defined in manifest with specified aspect ratios (${[...new Set(project.assets.map((a) => a.aspectRatio))].join(', ')}).`]
          : ['No planned image assets configured in the project manifest.'],
        actionableCorrections: project.assets.length > 0
          ? ['Generate production image assets and inspect rendered compositions in preview.']
          : ['Configure image asset requirements in the Asset Planner.'],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'brand consistency',
        status: hasApprovedArtDirection ? 'passed' : 'warning',
        score: hasApprovedArtDirection ? 84 : 58,
        findings: [
          hasApprovedArtDirection
            ? `Art direction "${project.designSystem.artDirection}" configured for ${project.business.industry || 'the business'} target audience (${project.business.targetAudience || 'discerning clientele'}).`
            : 'Art direction specification is pending definition.',
        ],
        actionableCorrections: [
          hasApprovedArtDirection
            ? 'Ensure implementation tokens strictly follow configured art direction.'
            : 'Define cohesive art direction in the Art Director workspace.',
        ],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'conversion clarity',
        status: hasTrust ? 'passed' : 'warning',
        score: hasTrust ? 80 : 55,
        findings: [
          hasTrust
            ? 'Social proof / trust components included in page architecture to address user objections.'
            : 'No dedicated social proof or trust component detected in page architecture.',
        ],
        actionableCorrections: [
          hasTrust
            ? 'Verify placement of trust signals relative to key conversion commitment points.'
            : 'Add testimonials or social proof components to the section sequence.',
        ],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'CTA prominence',
        status: hasCTA ? 'passed' : 'alert',
        score: hasCTA ? 80 : 45,
        findings: [
          hasCTA
            ? 'Dedicated call-to-action component configured in page architecture.'
            : 'No dedicated call-to-action or inquiry component found in section list.',
        ],
        actionableCorrections: [
          hasCTA
            ? 'Verify call-to-action button contrast and label clarity during implementation.'
            : 'Insert a conversion CTA section to guide user action.',
        ],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'mobile experience',
        status: 'not_evaluated',
        score: null,
        findings: [
          'Rendered touch target dimensions (>=44px), thumb-zone ergonomics, and mobile reflow cannot be verified from metadata alone without AI screenshot inspection.',
        ],
        actionableCorrections: [
          'Upload a mobile viewport screenshot for visual touch target and reflow evaluation.',
        ],
        evidenceLevel: 'insufficient_evidence',
        visualObservations: [],
      },
      {
        category: 'RTL quality',
        status: isRtl ? 'passed' : 'passed',
        score: isRtl ? 80 : 85,
        findings: [
          isRtl
            ? 'Project configured with RTL layout direction in business settings.'
            : 'Standard LTR configuration active in business settings.',
        ],
        actionableCorrections: [
          isRtl
            ? 'Upload RTL screenshots to visually verify mirrored alignments, margins, and bidirectional punctuation.'
            : 'No action required for LTR configuration.',
        ],
        evidenceLevel: 'architecture_inference',
        visualObservations: [],
      },
      {
        category: 'AI-generated website feeling',
        status: 'not_evaluated',
        score: null,
        findings: [
          `Design system metadata contains ${project.designSystem.avoidRules.length} anti-slop avoid rule(s), but rendered visual aesthetics, gradients, and styling authenticity cannot be verified without AI screenshot inspection.`,
        ],
        actionableCorrections: [
          'Upload rendered screenshots for AI visual slop and gradient inspection.',
        ],
        evidenceLevel: 'insufficient_evidence',
        visualObservations: [],
      },
    ];

    const findings: DesignCriticFinding[] = [
      {
        category: 'visual',
        severity: 'low',
        message: 'Ensure hero media has appropriate focal-point centering on smaller viewports.',
        suggestedFix: 'Apply object-position: center or mobile-specific crop in CSS styling.',
      },
      {
        category: 'cro',
        severity: 'low',
        message: 'Ensure trust and testimonial markers maintain high visual contrast against dark backgrounds.',
        suggestedFix: 'Use high-contrast monochrome vector assets with adequate padding.',
      },
    ];

    if (isRtl) {
      findings.push({
        category: 'rtl',
        severity: 'low',
        message: 'Verify quotation marks and punctuation in testimonials orient properly according to Hebrew typographic conventions.',
        suggestedFix: 'Use localized Hebrew typographic quotes in quotation component.',
      });
    }

    return {
      summary: `Architectural specification evaluation for ${project.business.businessName || 'the project'} (Deterministic Fallback). Evaluates component sequence, hierarchy anchors, and metadata rules. Visual-only categories (typography, spacing, excessive cards, mobile ergonomics, and visual slop) remain unevaluated without AI screenshot inspection.`,
      categories,
      findings,
      evaluatedAt: new Date().toISOString(),
      source: 'deterministic_fallback',
      inspectedScreenshots: {
        desktop: false,
        mobile: false,
        count: 0,
      },
    };
  }
}

