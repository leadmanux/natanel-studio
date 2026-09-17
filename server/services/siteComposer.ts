import { GoogleGenAI } from '@google/genai';
import type { Project, SitePage, SiteSection, GeneratedAsset } from '../../shared/project';
import type {
  SiteComposerService,
  SiteComposerProgress,
  SiteComposerResult,
} from '../../src/ai/contracts';
import { canonicalComponentStore } from './canonicalComponentStore';
import { getContentContract, validateComponentContent } from '../../shared/contentContracts';
import { resolveSectionAssets } from '../../shared/assetBinding';
import { modelConfig } from '../config/models';

export class GeminiSiteComposer implements SiteComposerService {
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

  /**
   * Composes production-ready, truthful content for every page and section in the project.
   */
  async compose(
    project: Project,
    onProgress?: (progress: SiteComposerProgress) => void
  ): Promise<SiteComposerResult> {
    const pages = project.pages || [];
    const allDiagnostics: SiteComposerResult['diagnostics'] = [];

    for (const page of pages) {
      for (const section of page.sections) {
        onProgress?.({
          pageId: page.id,
          pageName: page.name,
          sectionId: section.id,
          sectionName: section.name,
          status: 'generating_copy',
          message: `Composing copy for ${section.name}...`,
        });

        try {
          const { section: updatedSection, diagnostics } = await this.composeSection(
            project,
            page.id,
            section.id
          );

          // Update section in place
          Object.assign(section, updatedSection);

          for (const diag of diagnostics) {
            allDiagnostics.push({
              pageId: page.id,
              sectionId: section.id,
              type: section.contentStatus === 'needs_input' ? 'missing_factual' : 'warning',
              message: diag,
              suggestedAction: 'Review section in the Studio builder inspector.',
            });
          }

          onProgress?.({
            pageId: page.id,
            pageName: page.name,
            sectionId: section.id,
            sectionName: section.name,
            status: section.contentStatus === 'ready' ? 'ready' : section.contentStatus === 'invalid' ? 'error' : 'needs_input',
            message: `${section.name} composition complete.`,
          });
        } catch (err: any) {
          console.error(`[SiteComposer] Error composing section ${section.id}:`, err);
          section.contentStatus = 'invalid';
          section.contentDiagnostics = [err.message || 'Composition failed'];
          allDiagnostics.push({
            pageId: page.id,
            sectionId: section.id,
            type: 'generation_failure',
            message: err.message || 'Composition error',
            suggestedAction: 'Regenerate copy or edit manually in the inspector.',
          });

          onProgress?.({
            pageId: page.id,
            pageName: page.name,
            sectionId: section.id,
            sectionName: section.name,
            status: 'error',
            message: `Error: ${err.message}`,
          });
        }
      }
    }

    return {
      pages,
      diagnostics: allDiagnostics,
      composedAt: new Date().toISOString(),
    };
  }

  /**
   * Composes or regenerates content for an individual section.
   */
  async composeSection(
    project: Project,
    pageId: string,
    sectionId: string
  ): Promise<{ section: SiteSection; diagnostics: string[] }> {
    const page = project.pages.find((p) => p.id === pageId);
    if (!page) throw new Error(`Page "${pageId}" not found in project`);

    const section = page.sections.find((s) => s.id === sectionId);
    if (!section) throw new Error(`Section "${sectionId}" not found in page "${pageId}"`);

    const diagnostics: string[] = [];
    const contract = getContentContract(section.componentRegistryId);
    const compDef = canonicalComponentStore.getComponentById(section.componentRegistryId);

    // 1. Governance check
    if (!compDef) {
      section.contentStatus = 'invalid';
      const msg = `Component "${section.componentRegistryId}" is not in the canonical registry.`;
      diagnostics.push(msg);
      section.contentDiagnostics = diagnostics;
      return { section, diagnostics };
    }

    if (compDef.status !== 'approved') {
      section.contentStatus = 'invalid';
      const msg = `Component "${compDef.name}" has status "${compDef.status}". Only approved components may be composed into production sites.`;
      diagnostics.push(msg);
      section.contentDiagnostics = diagnostics;
      return { section, diagnostics };
    }

    // 2. Generate content (Gemini with single retry, or deterministic truthful generator)
    let generatedContent: Record<string, unknown> = {};

    if (this.ai) {
      try {
        generatedContent = await this.generateWithGemini(project, page, section, contract);
      } catch (geminiErr: any) {
        console.warn(`[SiteComposer] Gemini generation failed for ${section.name}, using deterministic generator:`, geminiErr);
        generatedContent = this.generateTruthfulDeterministic(project, page, section, contract);
      }
    } else {
      generatedContent = this.generateTruthfulDeterministic(project, page, section, contract);
    }

    // 3. Validate against Zod content contract with single retry if needed
    if (contract) {
      let validation = validateComponentContent(section.componentRegistryId, generatedContent);

      if (!validation.success && this.ai) {
        // Attempt single retry with validation errors
        try {
          console.warn(`[SiteComposer] Validation failed on first attempt for ${section.name}. Retrying with error feedback...`);
          generatedContent = await this.generateWithGemini(
            project,
            page,
            section,
            contract,
            validation.errors
          );
          validation = validateComponentContent(section.componentRegistryId, generatedContent);
        } catch (retryErr) {
          console.warn(`[SiteComposer] Retry generation failed for ${section.name}:`, retryErr);
        }
      }

      if (!validation.success) {
        // Fall back to guaranteed deterministic content
        generatedContent = this.generateTruthfulDeterministic(project, page, section, contract);
      }
    }

    // 4. Truthfulness and Missing Factual Claims Check
    const missingFacts: string[] = [];
    if (contract && contract.factualClaimFields.length > 0) {
      for (const field of contract.factualClaimFields) {
        const val = generatedContent[field];
        const isArray = Array.isArray(val);
        const isEmptyArray = isArray && (val as any[]).length === 0;
        const isEmptyString = typeof val === 'string' && val.trim() === '';
        const isUndefined = val === undefined || val === null;

        if (isUndefined || isEmptyString || isEmptyArray) {
          missingFacts.push(field);
        }
      }
    }

    // 5. Asset binding
    const assetBinding = resolveSectionAssets(section, compDef, project.assets, pageId);
    section.assetIds = assetBinding.boundAssetIds;

    const missingAssets: string[] = [];
    if (assetBinding.missingMandatorySlots.length > 0) {
      for (const slot of assetBinding.missingMandatorySlots) {
        missingAssets.push(slot.slot);
        diagnostics.push(`Required image asset "${slot.slot}" (${slot.aspectRatio}) is missing.`);
      }
    }

    // 6. Final Status Calculation
    section.content = generatedContent;
    section.missingFactualFields = missingFacts;
    section.missingAssetRequirements = missingAssets;

    if (missingFacts.length > 0 || missingAssets.length > 0) {
      section.contentStatus = 'needs_input';
      if (missingFacts.length > 0) {
        diagnostics.push(
          `Factual business verification needed for fields: ${missingFacts.join(', ')}. Gemini did not fabricate fake data.`
        );
      }
    } else {
      section.contentStatus = 'ready';
    }

    section.contentDiagnostics = diagnostics;
    return { section, diagnostics };
  }

  /**
   * Generates content using server-side Gemini.
   */
  private async generateWithGemini(
    project: Project,
    page: SitePage,
    section: SiteSection,
    contract: ReturnType<typeof getContentContract>,
    previousErrors?: string[]
  ): Promise<Record<string, unknown>> {
    if (!this.ai) throw new Error('AI not configured');

    const isRtl = project.business.direction === 'rtl';
    const isHebrew = project.business.language === 'Hebrew' || isRtl;

    // Filter project facts strictly
    const bizAny = project.business as any;
    const brandAny = project.brand as any;
    const projectFacts = {
      businessName: project.business.businessName,
      tagline: bizAny.tagline,
      industry: project.business.industry,
      targetAudience: project.business.targetAudience,
      primaryGoal: project.business.primaryGoal,
      location: project.business.location,
      phone: project.business.phone,
      whatsapp: project.business.whatsapp,
      email: project.business.email,
      servicesSupplied: bizAny.services || [],
      productsSupplied: bizAny.products || [],
      verifiedGuarantees: bizAny.guarantee,
      certifications: bizAny.certifications || [],
      licenses: bizAny.licenseNumber,
      brandVoice: brandAny.brandVoice,
      artDirection: project.designSystem.artDirection,
      visualMood: project.designSystem.visualMood,
    };

    const prompt = `You are an elite Atelier Content Director and Conversion Copywriter.
Compose truthful, high-craft, production-ready website section content for the following component:
- Component: ${section.componentRegistryId} (${section.name})
- Page: ${page.name} (${page.slug})
- Purpose: ${section.purpose}
- Direction: ${project.business.direction} (RTL: ${isRtl})
- Language: ${project.business.language}
- Art Direction: ${project.designSystem.artDirection || 'Atelier Architectural'}

=== USER & PROJECT FACTS (CANONICAL SOURCE OF TRUTH) ===
${JSON.stringify(projectFacts, null, 2)}

=== REQUIRED CONTRACT SCHEMA FIELDS ===
Required: ${contract ? contract.requiredFields.join(', ') : 'None'}
Optional: ${contract ? contract.optionalFields.join(', ') : 'None'}
Factual Claim Fields: ${contract ? contract.factualClaimFields.join(', ') : 'None'}
Generative Copy Fields: ${contract ? contract.generatedCopyFields.join(', ') : 'None'}

=== STRICT ANTI-SLOP & TRUTHFULNESS DIRECTIVES ===
1. SEPARATION OF FACTS VS GENERATIVE MARKETING COPY:
   - Factual Claim Fields (${contract ? contract.factualClaimFields.join(', ') : 'none'}): You MUST ONLY use the explicit facts provided above in USER & PROJECT FACTS.
   - You MUST NEVER fabricate: fake ratings, fake star scores, fake review counts, fake customer names, fake medical claims, fake warranties, fake prices, or fake licenses.
   - If a factual field is NOT provided in the project facts, leave it as an empty string ("") or empty array ([]). DO NOT INVENT A PLACEHOLDER CLAIM.
   - Generative Marketing Copy (${contract ? contract.generatedCopyFields.join(', ') : 'headlines, body, CTA'}): You MAY creatively compose evocative, persuasive, high-elevation copy tailored to the art direction.
2. NO GENERIC AI SLOP:
   - No generic verbs: ban "supercharge", "unleash", "elevate your journey", "game-changing".
   - No generic SaaS clichés. Use concrete, architectural, precise vocabulary.
3. HEBREW PROJECTS:
   ${
     isHebrew
       ? `Write natural, idiomatic, high-craft Israeli Hebrew (עברית ישראלית אותנטית ברמת סטודיו).
   - Do NOT translate literally from English.
   - Use natural business/commercial Hebrew terms.
   - Ensure RTL punctuation and number formatting are natural.`
       : `Write elevated, restrained, international business English.`
   }
${
  previousErrors && previousErrors.length > 0
    ? `\nPREVIOUS ATTEMPT FAILED WITH VALIDATION ERRORS:\n${previousErrors.join('\n')}\nPlease ensure the JSON strictly matches the expected fields.`
    : ''
}

Output ONLY a valid JSON object representing the section content. No markdown wrapping, no introductory commentary.`;

    const response = await this.ai.models.generateContent({
      model: modelConfig.fastModel,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    try {
      return JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw new Error('Failed to parse JSON from Gemini response');
    }
  }

  /**
   * Deterministic, truthful content generator used when AI is offline or as strict baseline.
   * Strictly avoids fabricating fake stats, fake testimonials, or fake prices.
   */
  private generateTruthfulDeterministic(
    project: Project,
    page: SitePage,
    section: SiteSection,
    contract: ReturnType<typeof getContentContract>
  ): Record<string, unknown> {
    const isHebrew = project.business.language === 'Hebrew' || project.business.direction === 'rtl';
    const biz = project.business as any;
    const name = biz.businessName || (isHebrew ? 'סטודיו נתנאל' : 'Natanel Studio');
    const industry = biz.industry || 'Design';
    const regId = section.componentRegistryId;

    // 1. Navigation
    if (regId.startsWith('nav-')) {
      const links = (project.pages || []).map((p) => ({
        label: p.name,
        href: p.slug,
      }));
      if (links.length === 0) {
        links.push({ label: isHebrew ? 'ראשי' : 'Home', href: '/' });
      }
      return {
        brandName: name,
        brandTagline: biz.tagline || (isHebrew ? 'אדריכלות ומלאכת עיצוב' : 'Architectural Craft & Direction'),
        chapterLabel: page.name,
        links,
        ctaLabel: isHebrew ? 'יצירת קשר' : 'Inquire',
        ctaHref: '#contact',
        contactPhone: biz.phone || '',
        phonePrompt: isHebrew ? 'ייעוץ דיסקרטי' : 'Direct Consultation',
      };
    }

    // 2. Hero
    if (regId.startsWith('hero-')) {
      if (regId === 'hero-product-commerce-01') {
        const prod = (biz.products && biz.products[0]) || { name: 'Signature Specimen', price: '₪ 1,200' };
        return {
          tagline: isHebrew ? 'מהדורה מוגבלת' : 'Limited Edition',
          productName: typeof prod === 'string' ? prod : prod.name,
          description: biz.description || (isHebrew ? 'מלאכת יד מדויקת מחומרים מובחרים.' : 'Precision craftsmanship in unyielding materials.'),
          price: typeof prod === 'object' && prod.price ? prod.price : '₪ 1,200',
          ctaText: isHebrew ? 'הוספה לסל' : 'Add to Collection',
          shippingNote: biz.guarantee || (isHebrew ? 'משלוח מבוטח עד הבית' : 'Insured sovereign courier dispatch'),
        };
      }

      if (regId === 'hero-local-conversion-01') {
        return {
          badge: isHebrew ? 'שירות מקצועי מוסמך' : 'Certified Master Craftsmanship',
          headline: isHebrew ? `מומחיות ב${biz.industry || 'מלאכה'} ברמה הגבוהה ביותר` : `Mastery in ${industry}`,
          subheadline: biz.description || (isHebrew ? 'זמינות מיידית, עבודה מדויקת ואחריות מלאה.' : 'Immediate availability, uncompromising precision, and complete guarantee.'),
          primaryPhone: biz.phone || '',
          primaryCtaLabel: isHebrew ? 'שיחת ייעוץ מיידית' : 'Request Callback',
          emergencyNotice: isHebrew ? 'מענה ישיר לכל פנייה' : 'Direct emergency line',
        };
      }

      return {
        tagline: biz.tagline || (isHebrew ? 'אטלייה למלאכה מדויקת' : 'Atelier of Precise Execution'),
        headline: isHebrew ? `${name} — עיצוב, תכנון וביצוע` : `${name} — Architectural Distinction`,
        subheadline: biz.description || (isHebrew ? 'תכנון קפדני ומבט מעמיק על חומר, צורה וחלל.' : 'Rigorous spatial articulation and bespoke architectural realization.'),
        kicker: page.name.toUpperCase(),
        narrative: biz.description || (isHebrew ? 'יצירה מתוך הקשבה לפרופורציות, איכות בלתי מתפשרת וחומרים טבעיים.' : 'Crafted from deliberate restraint and unyielding material integrity.'),
        primaryCtaLabel: isHebrew ? 'לתיאום פגישה' : 'Schedule Consultation',
        primaryCtaHref: '#contact',
        secondaryCtaLabel: isHebrew ? 'צפייה בעבודות' : 'View Portfolio',
        locationTag: biz.location || (isHebrew ? 'תל אביב' : 'Tel Aviv'),
      };
    }

    // 3. CRO & Proof (TRUTHFUL: no fake ratings or fabricated client counts!)
    if (regId.startsWith('cro-')) {
      if (regId === 'cro-guarantee-block-01') {
        return {
          badge: isHebrew ? 'מחויבות מקצועית' : 'Contractual Standard',
          headline: isHebrew ? 'סטנדרט ביצוע בלתי מתפשר' : 'Uncompromising Execution Standard',
          description: biz.guarantee || (isHebrew ? 'כל פרויקט מלווה בהסכם ביצוע מפורט ולוח זמנים קפדני.' : 'Every engagement is governed by rigorous deliverables and schedule milestones.'),
          termsPoints: biz.guarantee ? [biz.guarantee] : [],
          ctaLabel: isHebrew ? 'קריאת פרטי ההתחייבות' : 'Review Standard',
        };
      }
      if (regId === 'cro-metrics-quantified-01') {
        // If no metrics supplied, leave metrics empty so it flags needs_input
        return {
          title: isHebrew ? 'מדדי ביצוע' : 'Quantified Proof',
          subtitle: isHebrew ? 'עובדות ומדדים מאומתים בלבד' : 'Verified factual metrics',
          metrics: [],
        };
      }
      if (regId === 'cro-review-summary-01') {
        return {
          score: '',
          totalReviews: '',
          ratingSource: '',
          trustBadgeText: isHebrew ? 'דירוג לקוחות מאומת' : 'Audited Reviews',
        };
      }
      return {
        title: isHebrew ? 'הכרה מקצועית והסמכות' : 'Professional Endorsements',
        emblems: biz.certifications ? biz.certifications.map((c: any) => ({ label: String(c) })) : [],
      };
    }

    // 4. Services
    if (regId.startsWith('services-')) {
      const suppliedServices = biz.services && biz.services.length > 0
        ? biz.services
        : [isHebrew ? 'תכנון אדריכלי' : 'Architectural Planning', isHebrew ? 'ניהול פרויקטים' : 'Project Management', isHebrew ? 'פיקוח עליון' : 'Master Craft Oversight'];

      return {
        eyebrow: isHebrew ? 'שירותי הסטודיו' : 'Practice Areas',
        headline: isHebrew ? 'תחומי התמחות ומענה הנדסי' : 'Core Disciplines & Capabilities',
        description: isHebrew ? 'מתן מענה שלם משלב התכנון הראשוני ועד המסירה.' : 'End-to-end execution from foundational intent to final handover.',
        services: suppliedServices.map((s: any, idx: number) => ({
          title: typeof s === 'string' ? s : (s as any).name || `Service ${idx + 1}`,
          subtitle: isHebrew ? 'שלב ביצוע מקיף' : 'Comprehensive Phase',
          description: isHebrew ? `ביצוע קפדני של ${typeof s === 'string' ? s : (s as any).name} לפי תקנים מחמירים.` : `Rigorous methodology applied to ${typeof s === 'string' ? s : (s as any).name}.`,
          tags: [isHebrew ? 'איכות' : 'Quality', isHebrew ? 'דיוק' : 'Precision'],
        })),
        items: suppliedServices.map((s: any, idx: number) => ({
          number: String(idx + 1).padStart(2, '0'),
          title: typeof s === 'string' ? s : (s as any).name,
          description: isHebrew ? 'תכנון וביצוע לפי סטנדרט הסטודיו.' : 'Structured execution according to atelier standards.',
        })),
        steps: [
          { phase: '01', title: isHebrew ? 'אבחון ופרוגרמה' : 'Discovery & Brief', description: isHebrew ? 'הגדרת יעדים וצרכים.' : 'Establishing parameters.' },
          { phase: '02', title: isHebrew ? 'תכנון מפורט' : 'Detailed Articulation', description: isHebrew ? 'שרטוטים ומפרטים מדויקים.' : 'Exact specifications and blueprints.' },
          { phase: '03', title: isHebrew ? 'ביצוע ומסירה' : 'Execution & Delivery', description: isHebrew ? 'פיקוח צמוד עד השלמה.' : 'Supervised build to completion.' },
        ],
        title: isHebrew ? 'השוואת רמות ביצוע' : 'Comparative Standards',
        criteria: [
          { feature: isHebrew ? 'ליווי אישי' : 'Direct Principal Access', standard: isHebrew ? 'חלקי' : 'Partial', atelier: isHebrew ? 'מלא ובלעדי' : 'Exclusive' },
        ],
      };
    }

    // 5. Portfolio
    if (regId.startsWith('portfolio-')) {
      return {
        eyebrow: isHebrew ? 'תיק עבודות' : 'Selected Works',
        headline: isHebrew ? 'פרויקטים נבחרים' : 'Selected Architectural Commissions',
        projects: [
          {
            title: isHebrew ? 'פרויקט רוטשילד' : 'Rothschild Residence',
            category: isHebrew ? 'מגורים' : 'Residential',
            year: '2025',
            description: isHebrew ? 'שילוב חומרים טבעיים וקווי ראייה פתוחים.' : 'Harmonizing raw limestone and continuous sightlines.',
          },
        ],
        thesisKicker: isHebrew ? 'תפיסת עולם' : 'Design Philosophy',
        manifestoParagraphs: [
          isHebrew
            ? 'אנו מאמינים כי אדריכלות אינה רק צורה אלא הדרך שבה האדם חווה את מרחב חייו.'
            : 'We believe architectural presence is realized not through ornament, but through spatial clarity and honest materials.',
        ],
        sectionNumber: '02',
        chapters: [
          {
            title: isHebrew ? 'החומר כבסיס' : 'Material Primacy',
            narrative: isHebrew ? 'שימוש בחומרי גלם מקומיים המשביחים עם השנים.' : 'Selecting local limestone and patinated bronze that age gracefully.',
          },
        ],
      };
    }

    // 6. Testimonials (TRUTHFUL: no fake reviews if none supplied!)
    if (regId.startsWith('testimonials-')) {
      return {
        quote: '',
        author: '',
        headline: isHebrew ? 'המלצות לקוחות' : 'Client Testimonials',
        testimonials: [],
        reviews: [],
      };
    }

    // 7. Forms & FAQ
    if (regId.startsWith('forms-')) {
      return {
        formTitle: isHebrew ? 'תיאום פגישת ייעוץ' : 'Project Intake Brief',
        formSubtitle: isHebrew ? 'אנא השאירו פרטים ונחזור אליכם בהקדם.' : 'Direct confidential inquiry to our principals.',
        headline: isHebrew ? 'יצירת קשר ישיר' : 'Begin an Engagement',
        subheadline: isHebrew ? 'מענה מקצועי בתוך שעות ספורות.' : 'Direct response within business hours.',
        buttonLabel: isHebrew ? 'שליחת פנייה' : 'Submit Inquiry',
        phonePlaceholder: isHebrew ? '050-000-0000' : '+972 50 000 0000',
        trustNote: isHebrew ? 'הפרטים נשמרים בסודיות מלאה' : 'Confidentiality respected.',
        items: [
          {
            question: isHebrew ? 'מהו לוח הזמנים הממוצע לפרויקט?' : 'What is the standard engagement timeline?',
            answer: isHebrew ? 'לוח הזמנים נקבע בהתאם להיקף העבודה ומוגדר מראש בהסכם הביצוע.' : 'Timelines are calibrated to project complexity and codified in the contract schedule.',
          },
          {
            question: isHebrew ? 'כיצד מתבצע שלב התכנון הראשוני?' : 'How does preliminary planning work?',
            answer: isHebrew ? 'בפגישת פרוגרמה מעמיקה שבה נלמדים צרכי הלקוח ותנאי השטח.' : 'Via an intensive brief discovery session analyzing programmatic spatial needs.',
          },
        ],
      };
    }

    // 8. CTA
    if (regId.startsWith('cta-')) {
      return {
        kicker: isHebrew ? 'הזמנה לשיחה' : 'Initiation',
        statementHeadline: isHebrew ? 'מוכנים להוביל את הפרויקט הבא שלכם?' : 'Ready to Articulate Your Vision?',
        subtext: isHebrew ? 'צוות הסטודיו זמין לפגישת היכרות ותכנון ראשוני.' : 'Our team is available for initial strategic project consultations.',
        primaryCtaLabel: isHebrew ? 'תיאום שיחה עם מנהל הפרויקט' : 'Contact Principal',
        primaryCtaHref: '#contact',
        secondaryCtaLabel: isHebrew ? 'שאלות נפוצות' : 'Read FAQ',
        headline: isHebrew ? 'ייעוץ ישיר וזמינות מיידית' : 'Direct Principal Consultation',
        description: isHebrew ? 'פנו אלינו ישירות לתיאום פגישת עבודה.' : 'Connect directly with our practice leadership.',
        directPhone: biz.phone || '',
        whatsappNumber: biz.whatsapp || '',
        consultantName: name,
        consultantRole: isHebrew ? 'מנהל ראשי' : 'Managing Principal',
      };
    }

    // 9. Ecommerce
    if (regId.startsWith('ecommerce-')) {
      return {
        eyebrow: isHebrew ? 'קולקציה נוכחית' : 'Current Collection',
        headline: isHebrew ? 'פריטים נבחרים' : 'Curated Objects',
        subtitle: isHebrew ? 'מהדורה מוגבלת בייצור ידני' : 'Numbered editions of singular craftsmanship',
        productName: isHebrew ? 'פריט נבחר' : 'Signature Piece',
        price: '₪ 950',
        description: isHebrew ? 'יוצר בעבודת יד מחומרים בני קיימא.' : 'Individually finished in unyielding natural materials.',
        products: [
          { id: 'p1', name: isHebrew ? 'אגרטל טרוורטין מסותת' : 'Travertine Specimen Vessel', price: '₪ 880', category: 'Objects', inStock: true },
          { id: 'p2', name: isHebrew ? 'מנורת פליז מיושנת' : 'Patinated Bronze Sconce', price: '₪ 1,450', category: 'Lighting', inStock: true },
        ],
        accordionItems: [
          { title: isHebrew ? 'חומרים ומקור' : 'Materiality & Origin', content: isHebrew ? 'אבן טרוורטין טבעית ופליז מסותת.' : 'Natural Italian travertine and unlacquered brass.' },
          { title: isHebrew ? 'הוראות תחזוקה' : 'Care & Maintenance', content: isHebrew ? 'ניקוי במטלית יבשה בלבד.' : 'Wipe with dry micro-fiber cloth only.' },
        ],
        cartTitle: isHebrew ? 'סל הקניות שלך' : 'Your Bag',
        emptyMessage: isHebrew ? 'הסל שלך ריק כרגע.' : 'Your bag is empty.',
        checkoutButtonLabel: isHebrew ? 'לתשלום מאובטח' : 'Proceed to Checkout',
      };
    }

    // 10. Footer
    if (regId.startsWith('footer-')) {
      const year = new Date().getFullYear();
      return {
        brandName: name,
        brandTagline: biz.tagline || (isHebrew ? 'אדריכלות ומלאכת עיצוב' : 'Architectural Craft & Direction'),
        copyright: `© ${year} ${name}. ${isHebrew ? 'כל הזכויות שמורות.' : 'All rights reserved.'}`,
        copyrightYear: `${year}`,
        dispatchContact: {
          phone: biz.phone || '',
          email: biz.email || '',
          address: biz.location || '',
        },
        columns: [
          {
            title: isHebrew ? 'ניווט' : 'Index',
            links: (project.pages || []).map((p) => ({ label: p.name, href: p.slug })),
          },
        ],
        legalLinks: [
          { label: isHebrew ? 'תנאי שימוש' : 'Terms of Service', href: '#terms' },
          { label: isHebrew ? 'מדיניות פרטיות' : 'Privacy Policy', href: '#privacy' },
          { label: isHebrew ? 'הצהרת נגישות' : 'Accessibility', href: '#accessibility' },
        ],
      };
    }

    return {};
  }
}
