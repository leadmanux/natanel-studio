import { GoogleGenAI } from '@google/genai';
import type { Project, ReferenceAnalysis } from '../../shared/project';
import type { ReferenceAnalyzerService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';

export class GeminiReferenceAnalyzer implements ReferenceAnalyzerService {
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

  async analyze(
    url: string,
    projectContext?: Partial<Project>,
    screenshots?: { desktop?: string; mobile?: string } | string[]
  ): Promise<ReferenceAnalysis> {
    const shotArray: string[] = Array.isArray(screenshots)
      ? screenshots
      : screenshots
        ? ([screenshots.desktop, screenshots.mobile].filter(Boolean) as string[])
        : [];

    if (this.ai) {
      try {
        const analysis = await this.analyzeWithGemini(url, projectContext, shotArray);
        if (analysis) {
          return analysis;
        }
      } catch (err) {
        console.warn('[ReferenceAnalyzer] Gemini URL retrieval/analysis failed:', err);
      }
    }

    // DO NOT generate a fabricated "analysis" when URL retrieval fails!
    // Return a clear failure state and allow user to upload screenshots instead.
    return {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url,
      analyzedAt: new Date().toISOString(),
      retrievalStatus: 'failed',
      retrievedUrl: url,
      retrievalNotes:
        'Live URL retrieval failed or was inaccessible. Bot protection, login paywalls, or offline hosts may prevent direct access. Please upload reference screenshots instead so the visual layout can be inspected directly.',
      summary: 'Website content could not be retrieved from the provided URL. No fabricated analysis generated.',
      layout: 'Unavailable (requires live URL access or uploaded screenshots)',
      typography: 'Unavailable (requires live URL access or uploaded screenshots)',
      whitespace: 'Unavailable (requires live URL access or uploaded screenshots)',
      navigation: 'Unavailable (requires live URL access or uploaded screenshots)',
      heroComposition: 'Unavailable (requires live URL access or uploaded screenshots)',
      imageTreatment: 'Unavailable (requires live URL access or uploaded screenshots)',
      sectionTransitions: 'Unavailable (requires live URL access or uploaded screenshots)',
      interactionPatterns: 'Unavailable (requires live URL access or uploaded screenshots)',
      motion: 'Unavailable (requires live URL access or uploaded screenshots)',
      conversionTechniques: 'Unavailable (requires live URL access or uploaded screenshots)',
      extractedDesignPrinciples: [],
      screenshots: shotArray,
      source: 'deterministic_fallback',
    };
  }

  private async analyzeWithGemini(
    url: string,
    projectContext?: Partial<Project>,
    screenshots?: string[]
  ): Promise<ReferenceAnalysis> {
    if (!this.ai) throw new Error('AI not initialized');

    const imageParts: Array<{ inlineData: { mimeType: string; data: string } }> = [];
    if (screenshots && screenshots.length > 0) {
      for (const shot of screenshots) {
        const match = shot.match(/^data:(image\/[a-zA-Z0-9.-]+);base64,(.+)$/);
        if (match) {
          imageParts.push({
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          });
        }
      }
    }

    const prompt = `You are an elite Senior Design Architect and Art Director analyzing high-end web design references.
Analyze this reference website: ${url}

Project Context:
- Business: ${projectContext?.business?.businessName || 'Design Studio Project'}
- Industry: ${projectContext?.business?.industry || 'Modern Premium Brand'}
- Target Audience: ${projectContext?.business?.targetAudience || 'Discerning clientele'}
- Direction: ${projectContext?.business?.direction || 'ltr'}

INSTRUCTIONS & TRUTHFULNESS MANDATE:
1. You MUST access and inspect the live content of the provided URL using the urlContext tool.
2. If you also have screenshots provided, inspect their visual structure directly.
3. CRITICAL: Only describe details that are genuinely supported by successfully retrieved live URL content or by the provided screenshots. DO NOT hallucinate, guess, or invent claims.
4. Extract reusable design characteristics into our internal design language:
   - summary: Honest summary of what is observed.
   - layout: Structural grid, asymmetric vs symmetric balance.
   - typography: Scale contrast, font dynamics, line height.
   - whitespace: Negative space usage, padding cadence.
   - navigation: Navigation architecture, sticky/floating, links vs hamburger.
   - heroComposition: Media framing, headline scale, visual anchor.
   - imageTreatment: Color temperature, contrast, aspect ratio, lighting.
   - sectionTransitions: Dividers, contrast shifts.
   - interactionPatterns: Hover states, micro-interactions (if observed or inferable from structure).
   - motion: Motion and easing (if observed or inferable, otherwise state 'Not verified from static retrieval').
   - conversionTechniques: CTA placement, proof placement, value proposition.
   - extractedDesignPrinciples: 3-5 concrete design principles extracted from observed facts.

Return valid JSON ONLY with these keys.`;

    const contents: any[] = [prompt, ...imageParts];

    const response = await this.ai.models.generateContent({
      model: modelConfig.reasoningModel || 'gemini-3.8-flash',
      contents,
      config: {
        tools: [{ urlContext: {} }],
      },
    });

    const urlMetadata = response.candidates?.[0]?.urlContextMetadata?.urlMetadata || [];
    const primaryMatch =
      urlMetadata.find((m: any) => m.retrievedUrl?.includes(url) || url.includes(m.retrievedUrl || '')) ||
      urlMetadata[0];

    const urlSuccess = primaryMatch ? primaryMatch.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_SUCCESS' : false;
    const hasScreenshots = imageParts.length > 0;

    // If neither URL retrieval succeeded NOR screenshots were provided, DO NOT fabricate!
    if (!urlSuccess && !hasScreenshots) {
      const isPaywall = primaryMatch?.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_PAYWALL';
      const isUnsafe = primaryMatch?.urlRetrievalStatus === 'URL_RETRIEVAL_STATUS_UNSAFE';
      const failureReason = isPaywall
        ? 'URL retrieval failed: Target site is behind a paywall or requires authentication.'
        : isUnsafe
        ? 'URL retrieval failed: Target URL was flagged as unsafe.'
        : 'URL retrieval failed: The site blocked automated access, timed out, or was unreachable.';

      return {
        id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        url,
        analyzedAt: new Date().toISOString(),
        retrievalStatus: 'failed',
        retrievedUrl: primaryMatch?.retrievedUrl || url,
        retrievalNotes: `${failureReason} Upload screenshots of this reference website to inspect its visual layout directly.`,
        summary: 'Website content could not be retrieved from the provided URL. No fabricated analysis generated. Please upload screenshots.',
        layout: 'Unavailable due to failed URL retrieval',
        typography: 'Unavailable due to failed URL retrieval',
        whitespace: 'Unavailable due to failed URL retrieval',
        navigation: 'Unavailable due to failed URL retrieval',
        heroComposition: 'Unavailable due to failed URL retrieval',
        imageTreatment: 'Unavailable due to failed URL retrieval',
        sectionTransitions: 'Unavailable due to failed URL retrieval',
        interactionPatterns: 'Unavailable due to failed URL retrieval',
        motion: 'Unavailable due to failed URL retrieval',
        conversionTechniques: 'Unavailable due to failed URL retrieval',
        extractedDesignPrinciples: [],
        screenshots: [],
        source: 'deterministic_fallback',
      };
    }

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response from Gemini');

    // Clean any markdown code blocks
    const cleanedJson = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(cleanedJson);

    const retrievalStatus = urlSuccess ? 'success' : 'limited';
    const retrievalNotes = urlSuccess
      ? (hasScreenshots ? 'Retrieved via Gemini URL Context and visually validated with uploaded screenshots.' : 'Successfully retrieved and grounded via Gemini URL Context.')
      : 'Live URL retrieval was blocked or failed; visual analysis was performed directly on uploaded screenshots.';

    return {
      id: `ref-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url,
      analyzedAt: new Date().toISOString(),
      summary: parsed.summary || 'Analysis grounded in retrieved content.',
      layout: parsed.layout || 'Layout structure derived from retrieved reference.',
      typography: parsed.typography || 'Typography hierarchy derived from reference.',
      whitespace: parsed.whitespace || 'Spacing cadence derived from reference.',
      navigation: parsed.navigation || 'Navigation structure derived from reference.',
      heroComposition: parsed.heroComposition || 'Hero framing derived from reference.',
      imageTreatment: parsed.imageTreatment || 'Image treatment derived from reference.',
      sectionTransitions: parsed.sectionTransitions || 'Section transitions derived from reference.',
      interactionPatterns: parsed.interactionPatterns || 'Interaction patterns derived from reference.',
      motion: parsed.motion || 'Motion dynamics derived from reference.',
      conversionTechniques: parsed.conversionTechniques || 'Conversion mechanisms derived from reference.',
      extractedDesignPrinciples: parsed.extractedDesignPrinciples || [],
      retrievalStatus,
      retrievedUrl: primaryMatch?.retrievedUrl || url,
      retrievalNotes,
      screenshots: screenshots || [],
      source: 'ai',
    };
  }
}

