import { GoogleGenAI } from '@google/genai';
import type {
  Project,
  ProjectFacts,
  SitePage,
  SiteSection,
} from '../../shared/project';
import type {
  ComponentContentContract,
} from '../../shared/contentContracts';
import type {
  SiteComposerService,
  SiteComposerProgress,
  SiteComposerResult,
} from '../../src/ai/contracts';
import { canonicalComponentStore } from './canonicalComponentStore';
import { evaluateComponentEligibility } from './componentEligibility';
import { getContentContract, validateComponentContent } from '../../shared/contentContracts';
import { componentAliases } from '../../shared/componentImplementations';
import { resolveSectionAssets } from '../../shared/assetBinding';
import { normalizeStudioMotionPreset } from '../../shared/studioMotion';
import { modelConfig } from '../config/models';
import { referenceAssetPromptContext, referenceImageParts } from './referenceAssetContext';

const EMPTY_FACTS: ProjectFacts = {
  services: [],
  products: [],
  portfolioProjects: [],
  testimonials: [],
  metrics: [],
  certifications: [],
  licenses: [],
  guarantees: [],
  process: [],
};

const REQUIRED_FACT_OVERRIDES: Record<string, string[]> = {
  'nav-minimal-dock-01': ['brandName'],
  'nav-editorial-asymmetric-01': ['brandName'],
  'nav-centered-luxury-01': ['brandName'],
  'nav-conversion-cta-01': ['brandName', 'contactPhone'],
  'hero-product-commerce-01': ['productName', 'price'],
  'hero-local-conversion-01': ['primaryPhone'],
  'cro-trust-strip-01': ['emblems'],
  'cro-guarantee-block-01': ['termsPoints'],
  'cta-two-tone-urgency-01': ['directPhone'],
  'footer-editorial-architectural-01': ['brandName'],
  'footer-directory-multicolumn-01': ['brandName'],
  'footer-minimal-legal-01': ['brandName'],
};

function canonicalId(id: string): string {
  return componentAliases[id] || id;
}

function factsFor(project: Project): ProjectFacts {
  return project.facts || EMPTY_FACTS;
}

function isMissingValue(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string') return value.trim() === '';
  if (Array.isArray(value)) return value.length === 0;
  return false;
}

function pickFields(
  input: Record<string, unknown>,
  allowed: string[]
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const field of allowed) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      out[field] = input[field];
    }
  }
  return out;
}

export class GeminiSiteComposer implements SiteComposerService {
  private ai: GoogleGenAI | null = null;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
    }
  }

  async compose(
    project: Project,
    onProgress?: (progress: SiteComposerProgress) => void
  ): Promise<SiteComposerResult> {
    await canonicalComponentStore.init();

    const workingProject: Project = {
      ...project,
      facts: project.facts || { ...EMPTY_FACTS },
      pages: (project.pages || []).map((page) => ({
        ...page,
        sections: page.sections.map((section) => ({
          ...section,
          content: { ...(section.content || {}) },
          assetIds: [...(section.assetIds || [])],
        })),
      })),
    };

    const diagnostics: SiteComposerResult['diagnostics'] = [];

    for (const page of workingProject.pages) {
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
          const result = await this.composeSection(workingProject, page.id, section.id);
          Object.assign(section, result.section);

          for (const message of result.diagnostics) {
            diagnostics.push({
              pageId: page.id,
              sectionId: section.id,
              type:
                section.contentStatus === 'invalid'
                  ? 'validation_failure'
                  : section.contentStatus === 'needs_input'
                    ? 'missing_input'
                    : 'warning',
              message,
              suggestedAction: 'Review this section in the Builder inspector.',
            });
          }

          onProgress?.({
            pageId: page.id,
            pageName: page.name,
            sectionId: section.id,
            sectionName: section.name,
            status:
              section.contentStatus === 'ready'
                ? 'ready'
                : section.contentStatus === 'invalid'
                  ? 'error'
                  : 'needs_input',
            message: `${section.name} composition complete.`,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Composition failed';
          section.contentStatus = 'invalid';
          section.contentApproved = false;
          section.contentDiagnostics = [message];
          diagnostics.push({
            pageId: page.id,
            sectionId: section.id,
            type: 'generation_failure',
            message,
            suggestedAction: 'Regenerate copy or edit the section manually.',
          });
          onProgress?.({
            pageId: page.id,
            pageName: page.name,
            sectionId: section.id,
            sectionName: section.name,
            status: 'error',
            message,
          });
        }
      }
    }

    return {
      pages: workingProject.pages,
      diagnostics,
      composedAt: new Date().toISOString(),
    };
  }

  async composeSection(
    project: Project,
    pageId: string,
    sectionId: string
  ): Promise<{ section: SiteSection; diagnostics: string[] }> {
    await canonicalComponentStore.init();

    const page = project.pages.find((candidate) => candidate.id === pageId);
    if (!page) throw new Error(`Page "${pageId}" not found in project.`);

    const existingSection = page.sections.find((candidate) => candidate.id === sectionId);
    if (!existingSection) throw new Error(`Section "${sectionId}" not found in page "${pageId}".`);

    const section: SiteSection = {
      ...existingSection,
      content: { ...(existingSection.content || {}) },
      assetIds: [...(existingSection.assetIds || [])],
      motionPreset: normalizeStudioMotionPreset(existingSection.motionPreset),
      contentApproved: false,
    };

    const diagnostics: string[] = [];
    const definition = canonicalComponentStore.getComponentById(section.componentRegistryId);

    if (!definition) {
      return this.invalidSection(section, `Component "${section.componentRegistryId}" is not in the canonical registry.`);
    }

    const eligibility = evaluateComponentEligibility(definition, project);
    if (!eligibility.eligible) {
      return this.invalidSection(
        section,
        `Component "${definition.name}" is not eligible: ${eligibility.reasons.join('; ')}.`
      );
    }

    const contract = getContentContract(section.componentRegistryId);
    if (!contract) {
      return this.invalidSection(section, `No content contract exists for "${section.componentRegistryId}".`);
    }

    const generatedCopy = await this.generateCopy(project, page, section, contract);
    const structuralContent = this.resolveStructuralContent(project, page, section);
    const factualContent = this.resolveFactualContent(project, page, section);

    // Verified facts always win over generative copy. Gemini never supplies factual fields.
    const contractContent: Record<string, unknown> = {
      ...structuralContent,
      ...generatedCopy,
      ...factualContent,
    };

    const requiredFactualFields = this.requiredFactualFields(section.componentRegistryId, contract);
    const missingFactualFields = requiredFactualFields.filter((field) => isMissingValue(contractContent[field]));

    const validation = validateComponentContent(section.componentRegistryId, contractContent);
    if (!validation.success && missingFactualFields.length === 0) {
      diagnostics.push(`Content validation failed: ${(validation.errors || []).join(' | ')}`);
    }

    const assetBinding = resolveSectionAssets(section, definition, project.assets || [], pageId);
    const missingAssets = assetBinding.missingMandatorySlots.map((slot) => slot.slot);
    diagnostics.push(...assetBinding.diagnostics);

    if (missingFactualFields.length > 0) {
      diagnostics.push(
        `Verified factual input required: ${missingFactualFields.join(', ')}. No placeholder facts were generated.`
      );
    }

    const renderContent = this.adaptContentForImplementation(
      section.componentRegistryId,
      contractContent,
      project
    );

    section.content = renderContent;
    section.assetIds = assetBinding.boundAssetIds;
    section.missingFactualFields = missingFactualFields;
    section.missingAssetRequirements = missingAssets;
    section.contentDiagnostics = diagnostics;
    section.contentApproved = false;

    if (!validation.success && missingFactualFields.length === 0) {
      section.contentStatus = 'invalid';
    } else if (missingFactualFields.length > 0 || missingAssets.length > 0) {
      section.contentStatus = 'needs_input';
    } else {
      section.contentStatus = 'ready';
    }

    return { section, diagnostics };
  }

  private invalidSection(
    section: SiteSection,
    message: string
  ): { section: SiteSection; diagnostics: string[] } {
    const next: SiteSection = {
      ...section,
      contentStatus: 'invalid',
      contentApproved: false,
      contentDiagnostics: [message],
    };
    return { section: next, diagnostics: [message] };
  }

  private async generateCopy(
    project: Project,
    page: SitePage,
    section: SiteSection,
    contract: ComponentContentContract
  ): Promise<Record<string, unknown>> {
    if (contract.generatedCopyFields.length === 0) return {};

    if (this.ai) {
      try {
        return await this.generateCopyWithGemini(project, page, section, contract);
      } catch (error) {
        console.warn(`[SiteComposer] Gemini copy generation failed for ${section.id}; using safe deterministic copy.`, error);
      }
    }

    return this.generateDeterministicCopy(project, page, section, contract);
  }

  private async generateCopyWithGemini(
    project: Project,
    page: SitePage,
    section: SiteSection,
    contract: ComponentContentContract
  ): Promise<Record<string, unknown>> {
    if (!this.ai) return {};

    const isHebrew = project.business.language.toLowerCase().includes('hebrew') || project.business.direction === 'rtl';
    const allowedFields = contract.generatedCopyFields;
    const existingGeneratedCopy = pickFields(section.content || {}, allowedFields);

    const prompt = `You are the content composer for Natanel Studio.
Write production website MARKETING COPY ONLY for one section.

Project context:
- Business name: ${project.business.businessName || '(not supplied)'}
- Industry: ${project.business.industry || '(not supplied)'}
- Business description supplied by user: ${project.business.description || '(not supplied)'}
- Audience: ${project.business.targetAudience || '(not supplied)'}
- Primary goal: ${project.business.primaryGoal || '(not supplied)'}
- Positioning: ${project.strategy.positioning || '(not supplied)'}
- Primary CTA direction: ${project.strategy.primaryCTA || '(not supplied)'}
- Art direction: ${project.designSystem.artDirection || '(not supplied)'}
- Page: ${page.name}
- Section purpose: ${section.purpose}
- Component: ${section.componentRegistryId}
- Language: ${project.business.language}
- Direction: ${project.business.direction}

Uploaded visual references, in the same order as the attached images:
${referenceAssetPromptContext(project, 4)}

VISUAL REFERENCE RULES:
- Use visible product identity and usage context to make the copy more specific when helpful.
- Product images may inform visible descriptors such as form factor, finish, color family, packaging style or usage context.
- Images are NOT evidence for technical specs, medical/beauty efficacy, certifications, performance claims, discounts, materials, ingredients or guarantees unless those facts are also explicitly present in ProjectFacts/user-supplied text.
- Never invent a feature just because the image resembles a known product.
- Preserve the distinction between PRODUCT references and LIFESTYLE references.

You may output ONLY these generative copy fields:
${allowedFields.join(', ')}

Existing user-edited copy for those fields:
${JSON.stringify(existingGeneratedCopy, null, 2)}

STRICT RULES:
- Do not output any field outside the allowed list.
- Do not invent prices, discounts, product specs, customer names, testimonials, ratings, review totals, metrics, awards, press mentions, licenses, certifications, guarantees, warranty terms, shipping times, addresses, phone numbers, years in business, portfolio projects, or quantified results.
- Do not invent claims of being certified, insured, award-winning, number one, fastest, guaranteed, or medically effective.
- Keep copy specific to the supplied business description and positioning without adding unsupported factual claims.
- Avoid generic AI phrases such as "unlock", "revolutionize", "game-changing", "elevate your journey", and "supercharge".
${isHebrew ? '- Write native, idiomatic Israeli Hebrew directly. Do not translate English phrasing literally.' : '- Write restrained, natural professional English.'}

Return ONLY a JSON object.`;

    const response = await this.ai.models.generateContent({
      model: modelConfig.fastModel,
      contents: [prompt, ...referenceImageParts(project, 4)],
      config: { responseMimeType: 'application/json' },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text) as Record<string, unknown>;
    return pickFields(parsed, allowedFields);
  }

  private generateDeterministicCopy(
    project: Project,
    page: SitePage,
    section: SiteSection,
    contract: ComponentContentContract
  ): Record<string, unknown> {
    const isHebrew = project.business.language.toLowerCase().includes('hebrew') || project.business.direction === 'rtl';
    const businessName = project.business.businessName.trim();
    const description = project.business.description.trim();
    const positioning = project.strategy.positioning.trim();
    const cta = project.strategy.primaryCTA.trim();
    const id = canonicalId(section.componentRegistryId);

    const safeHeadline =
      positioning ||
      description ||
      (businessName
        ? (isHebrew ? `${businessName} — פתרון מקצועי שמתחיל בצרכים שלך` : `${businessName} — built around your brief`)
        : (isHebrew ? 'פתרון מקצועי שמתחיל בצרכים שלך' : 'A focused solution built around your brief'));

    const safeBody = description || positioning || '';
    const result: Record<string, unknown> = {};

    const set = (field: string, value: unknown) => {
      if (contract.generatedCopyFields.includes(field)) result[field] = value;
    };

    set('headline', safeHeadline);
    set('statementHeadline', safeHeadline);
    set('description', safeBody);
    set('subheadline', safeBody);
    set('body', safeBody);
    set('subtitle', safeBody);
    set('subtext', safeBody);
    set('narrative', safeBody);
    set('brandTagline', positioning || safeBody);
    set('tagline', positioning || safeBody);
    set('eyebrow', project.business.industry || page.name);
    set('kicker', page.name);
    set('chapterLabel', page.name);
    set('ctaLabel', cta || (isHebrew ? 'יצירת קשר' : 'Contact'));
    set('ctaText', cta || (isHebrew ? 'לפרטים' : 'Learn more'));
    set('primaryCtaLabel', cta || (isHebrew ? 'יצירת קשר' : 'Contact'));
    set('primaryCta', cta || (isHebrew ? 'יצירת קשר' : 'Contact'));
    set('secondaryCtaLabel', isHebrew ? 'מידע נוסף' : 'Learn more');
    set('secondaryCta', isHebrew ? 'מידע נוסף' : 'Learn more');
    set('buttonLabel', cta || (isHebrew ? 'שליחת פנייה' : 'Submit'));
    set('ctaButtonLabel', cta || (isHebrew ? 'יצירת קשר' : 'Contact'));
    set('formTitle', isHebrew ? 'השאירו פרטים' : 'Tell us about your project');
    set('formSubtitle', isHebrew ? 'נחזור אליכם עם מענה מותאם לפרטים שתמסרו.' : 'Share the essentials and we will follow up based on the information provided.');
    set('trustNote', isHebrew ? 'הפרטים ישמשו לצורך המענה לפנייה.' : 'Your details are used to respond to your inquiry.');
    set('privacyNotice', isHebrew ? 'שליחת הטופס מאשרת שימוש בפרטים לצורך חזרה אליכם.' : 'Submitting this form allows the business to use these details to respond to your inquiry.');
    set('emptyMessage', isHebrew ? 'הסל עדיין ריק.' : 'Your cart is empty.');
    set('cartTitle', isHebrew ? 'הסל שלך' : 'Your cart');
    set('checkoutButtonLabel', isHebrew ? 'המשך לתשלום' : 'Continue to checkout');
    set('legalNote', '');

    if (contract.generatedCopyFields.includes('manifestoParagraphs')) {
      result.manifestoParagraphs = safeBody ? [safeBody] : [];
    }

    if (id === 'portfolio-sticky-split-01' && contract.generatedCopyFields.includes('chapters')) {
      result.chapters = safeBody ? [{ title: page.name, narrative: safeBody }] : [];
    }

    if (id === 'testimonials-case-study-outcome-01') {
      set('challenge', '');
      set('solution', '');
    }

    return result;
  }

  private resolveStructuralContent(
    project: Project,
    page: SitePage,
    section: SiteSection
  ): Record<string, unknown> {
    const id = canonicalId(section.componentRegistryId);
    const links = project.pages.map((candidate) => ({ label: candidate.name, href: candidate.slug }));
    const currentYear = String(new Date().getFullYear());

    if (id.startsWith('nav-')) {
      return {
        links,
        ctaHref: project.strategy.primaryCTA ? '#contact' : undefined,
      };
    }

    if (id === 'footer-editorial-architectural-01') {
      return {
        columns: [{ title: page.name, links }],
        copyright: project.business.businessName
          ? `© ${currentYear} ${project.business.businessName}. All rights reserved.`
          : '',
      };
    }

    if (id === 'footer-directory-multicolumn-01') {
      return {
        columns: [{ title: page.name, links }],
      };
    }

    if (id === 'footer-minimal-legal-01') {
      return {
        copyrightYear: currentYear,
        legalLinks: [],
      };
    }

    if (id.startsWith('hero-') || id.startsWith('cta-')) {
      return {
        ctaHref: '#contact',
        primaryCtaHref: '#contact',
      };
    }

    return {};
  }

  private resolveFactualContent(
    project: Project,
    _page: SitePage,
    section: SiteSection
  ): Record<string, unknown> {
    const id = canonicalId(section.componentRegistryId);
    const facts = factsFor(project);
    const business = project.business;
    const firstProduct = facts.products[0];
    const firstTestimonial = facts.testimonials[0];
    const firstGuarantee = facts.guarantees[0];
    const firstProject = facts.portfolioProjects[0];
    const review = facts.reviewSummary;

    if (id.startsWith('nav-')) {
      return {
        brandName: business.businessName || '',
        monogram: business.businessName
          ? business.businessName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
          : '',
        contactPhone: business.phone || '',
      };
    }

    switch (id) {
      case 'hero-editorial-split-01':
        return { badge: '', proofBadge: '' };
      case 'hero-architectural-panorama-02':
        return { locationTag: business.location || '' };
      case 'hero-asymmetric-typography-01':
        return {
          stats: facts.metrics.map((metric) => ({ value: metric.value, label: metric.label })),
        };
      case 'hero-product-commerce-01':
        return {
          productName: firstProduct?.name || '',
          price: firstProduct?.price || '',
          originalPrice: firstProduct?.originalPrice || '',
          ratingScore: review?.score || '',
          reviewCount: review?.totalReviews || '',
          shippingNote: firstProduct?.shippingNote || facts.shipping?.note || '',
        };
      case 'hero-local-conversion-01':
        return {
          primaryPhone: business.phone || '',
          responseTimeGuarantee: '',
        };
      case 'cro-trust-strip-01': {
        const publications = facts.certifications.map((item) => ({
          name: item.issuer || item.title,
          accolade: item.code || item.title,
        }));
        return {
          emblems: facts.certifications.map((item) => ({ label: item.title, source: item.issuer })),
          publications,
        };
      }
      case 'cro-metrics-quantified-01':
        return {
          metrics: facts.metrics.map((metric) => ({
            value: metric.value,
            label: metric.label,
            context: metric.context,
          })),
        };
      case 'cro-certification-badges-01':
        return {
          badges: facts.certifications.map((item) => ({
            title: item.title,
            code: item.code,
            issuer: item.issuer,
          })),
        };
      case 'cro-review-summary-01':
        return {
          score: review?.score || '',
          totalReviews: review?.totalReviews || '',
          ratingSource: review?.ratingSource || '',
          platforms: review?.platforms || [],
        };
      case 'cro-guarantee-block-01':
        return {
          termsPoints: firstGuarantee?.points || [],
          points: firstGuarantee?.points || [],
          badge: firstGuarantee?.badge || '',
          headline: firstGuarantee?.headline || '',
          description: firstGuarantee?.description || '',
        };
      case 'services-editorial-matrix-01':
        return {
          services: facts.services.map((service) => ({
            title: service.name,
            subtitle: service.subtitle,
            description: service.description || '',
            tags: service.tags || [],
          })),
        };
      case 'services-numbered-index-01':
        return {
          items: facts.services.map((service, index) => ({
            number: String(index + 1).padStart(2, '0'),
            title: service.name,
            description: service.description || '',
            deliverable: service.deliverable,
          })),
        };
      case 'services-process-timeline-01':
        return {
          steps: facts.process.map((step, index) => ({
            phase: step.phase || String(index + 1).padStart(2, '0'),
            title: step.title,
            duration: step.duration,
            description: step.description || '',
          })),
        };
      case 'services-comparison-table-01':
        return { criteria: [] };
      case 'portfolio-asymmetric-narrative-01':
      case 'portfolio-horizontal-reel-01':
        return {
          projects: facts.portfolioProjects.map((projectFact) => ({
            title: projectFact.title,
            category: projectFact.category || '',
            location: projectFact.location,
            year: projectFact.year,
            description: projectFact.description,
            metric: projectFact.metric,
          })),
        };
      case 'portfolio-before-after-01':
        return {
          metrics: facts.metrics.map((metric) => ({ label: metric.label, value: metric.value })),
        };
      case 'testimonials-editorial-quote-01':
        return {
          quote: firstTestimonial?.quote || '',
          author: firstTestimonial?.author || '',
          role: firstTestimonial?.role || '',
          company: firstTestimonial?.company || '',
        };
      case 'testimonials-portrait-duo-01':
        return {
          testimonials: facts.testimonials.map((testimonial) => ({
            quote: testimonial.quote,
            author: testimonial.author,
            role: testimonial.role,
            verifiedProject: testimonial.projectType,
          })),
        };
      case 'testimonials-review-carousel-01':
        return {
          reviews: facts.testimonials.map((testimonial) => ({
            author: testimonial.author,
            rating: testimonial.rating,
            verifiedDate: testimonial.verifiedDate,
            reviewText: testimonial.quote,
            projectType: testimonial.projectType,
          })),
        };
      case 'testimonials-case-study-outcome-01':
        return {
          clientName: firstTestimonial?.author || '',
          quantifiableResults: firstProject?.metric
            ? [{ metric: 'Verified result', outcome: firstProject.metric }]
            : [],
        };
      case 'cta-two-tone-urgency-01':
        return {
          directPhone: business.phone || '',
          dispatchTimeNotice: '',
        };
      case 'cta-direct-consultation-01':
        return {
          directPhone: business.phone || '',
          whatsappNumber: business.whatsapp || '',
          consultantName: '',
          consultantRole: '',
        };
      case 'ecommerce-product-grid-01':
        return {
          products: facts.products.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price || '',
            originalPrice: product.originalPrice,
            category: product.category,
            collection: product.category || '',
            inStock: product.inStock,
            image: '',
            rating: '',
          })),
        };
      case 'ecommerce-detail-accordion-01':
        return {
          productName: firstProduct?.name || '',
          price: firstProduct?.price || '',
          accordionItems: (firstProduct?.specs || []).map((spec) => ({
            title: spec.label,
            content: spec.value,
          })),
        };
      case 'ecommerce-cart-drawer-01':
        return {
          freeShippingThreshold: facts.shipping?.freeShippingThreshold || '',
        };
      case 'footer-editorial-architectural-01':
        return {
          brandName: business.businessName || '',
          address: business.location || '',
          telephone: business.phone || '',
          email: business.email || '',
          license: facts.licenses[0]?.label || facts.licenses[0]?.code || '',
        };
      case 'footer-directory-multicolumn-01':
        return {
          brandName: business.businessName || '',
          dispatchContact: {
            phone: business.phone || '',
            email: business.email || '',
            address: business.location || '',
          },
        };
      case 'footer-minimal-legal-01':
        return { brandName: business.businessName || '' };
      default:
        return {};
    }
  }

  private requiredFactualFields(
    componentId: string,
    contract: ComponentContentContract
  ): string[] {
    const id = canonicalId(componentId);
    const required = new Set<string>();

    for (const field of contract.requiredFields) {
      if (contract.factualClaimFields.includes(field)) required.add(field);
    }

    for (const field of REQUIRED_FACT_OVERRIDES[id] || []) {
      required.add(field);
    }

    if (id === 'cta-direct-consultation-01') {
      // One verified direct-contact channel is enough. This is handled separately by the caller through synthetic key.
      required.add('__directContact');
    }

    return Array.from(required);
  }

  private adaptContentForImplementation(
    componentId: string,
    content: Record<string, unknown>,
    project: Project
  ): Record<string, unknown> {
    const id = canonicalId(componentId);
    const next: Record<string, unknown> = { ...content };

    if (id === 'hero-editorial-split-01') {
      next.eyebrow = content.tagline ?? '';
      next.description = content.subheadline ?? '';
      next.primaryCta = content.ctaLabel ?? '';
      next.secondaryCta = content.secondaryCtaLabel ?? '';
      next.proofBadge = content.badge ?? '';
    }

    if (id === 'cro-guarantee-block-01') {
      next.points = content.termsPoints ?? content.points ?? [];
    }

    if (id === 'cro-review-summary-01') {
      next.platforms = content.platforms ?? [];
      next.ctaLabel = next.ctaLabel ?? '';
    }

    if (id === 'ecommerce-product-grid-01') {
      next.title = content.headline ?? content.title ?? '';
      next.products = Array.isArray(content.products)
        ? content.products.map((product: any) => ({
            ...product,
            collection: product.collection ?? product.category ?? '',
            image: product.image ?? '',
            rating: product.rating ?? '',
          }))
        : [];
    }

    if (id === 'footer-editorial-architectural-01') {
      next.tagline = content.brandTagline ?? content.tagline ?? '';
      next.copyright = content.copyright || (project.business.businessName
        ? `© ${new Date().getFullYear()} ${project.business.businessName}. All rights reserved.`
        : '');
    }

    return next;
  }
}
