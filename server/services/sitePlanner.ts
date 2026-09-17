import type { Project, SitePage, SiteSection } from '../../shared/project';
import type { ComponentDefinition } from '../../shared/componentRegistry';
import type { SitePlannerService } from '../../src/ai/contracts';
import { normalizeStudioMotionPreset } from '../../shared/studioMotion';
import { canonicalComponentStore } from './canonicalComponentStore';
import { GeminiComponentSelector } from './componentSelector';
import { getEligibleComponents } from './componentEligibility';

const HEBREW_TRANSLITERATION: Record<string, string> = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'h', ט: 't', י: 'y',
  כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's', ע: 'a', פ: 'p', ף: 'p',
  צ: 'ts', ץ: 'ts', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
};

export function createStablePageSlug(pageName: string, index: number, used: Set<string>): string {
  if (index === 0 || pageName.trim().toLowerCase() === 'home' || pageName.trim() === 'ראשי') {
    used.add('/');
    return '/';
  }

  const transliterated = Array.from(pageName.trim())
    .map((char) => HEBREW_TRANSLITERATION[char] ?? char)
    .join('');

  let base = transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base) base = `page-${index + 1}`;

  let candidate = `/${base}`;
  let suffix = 2;
  while (used.has(candidate)) {
    candidate = `/${base}-${suffix++}`;
  }
  used.add(candidate);
  return candidate;
}

export class GeminiSitePlanner implements SitePlannerService {
  private componentSelector: GeminiComponentSelector;

  constructor() {
    this.componentSelector = new GeminiComponentSelector();
  }

  async plan(project: Project): Promise<Project['pages']> {
    await canonicalComponentStore.init();

    const eligibleComponents = getEligibleComponents(
      canonicalComponentStore.getAllComponents(),
      project
    );

    if (eligibleComponents.length === 0) {
      throw new Error('No canonically approved, renderable, contract-backed components are eligible for this project.');
    }

    const selections = await this.componentSelector.selectDetailed(project, eligibleComponents);

    const requiredPages = project.strategy.requiredPages && project.strategy.requiredPages.length > 0
      ? project.strategy.requiredPages
      : project.projectType === 'shopify'
        ? ['Home', 'Catalog', 'Product', 'About']
        : ['Home', 'About', 'Services', 'Contact'];

    const pagesMap = new Map<string, SitePage>();
    const usedSlugs = new Set<string>();

    requiredPages.forEach((pageName, index) => {
      const slug = createStablePageSlug(pageName, index, usedSlugs);
      pagesMap.set(pageName.toLowerCase(), {
        id: `page_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        name: pageName,
        slug,
        purpose: `${pageName} experience for ${project.business.businessName || 'the project'}.`,
        sections: [],
      });
    });

    let globalSectionCount = 0;
    const eligibleIds = new Set(eligibleComponents.map((component) => component.id));

    for (const item of selections) {
      if (!eligibleIds.has(item.componentRegistryId)) continue;

      const pageKey = (item.page || 'Home').toLowerCase();
      let targetPage = pagesMap.get(pageKey);

      if (!targetPage) {
        targetPage = pagesMap.get('home') || Array.from(pagesMap.values())[0];
      }

      if (!targetPage) continue;

      globalSectionCount++;
      const newSection: SiteSection = {
        id: `sec_${Date.now()}_${globalSectionCount}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.sectionPurpose || `Section ${targetPage.sections.length + 1}`,
        componentRegistryId: item.componentRegistryId,
        purpose: item.sectionPurpose,
        content: {},
        assetIds: [],
        order: targetPage.sections.length + 1,
        reason: item.reason,
        contentRequirements: item.contentRequirements,
        imageRequirements: item.imageRequirements,
        motionPreset: normalizeStudioMotionPreset(item.motionPreset),
        contentStatus: 'needs_input',
        contentApproved: false,
      };

      targetPage.sections.push(newSection);
    }

    for (const page of pagesMap.values()) {
      this.ensureEssentialPageStructure(page, eligibleComponents);
    }

    return Array.from(pagesMap.values());
  }

  private ensureEssentialPageStructure(page: SitePage, eligible: ComponentDefinition[]) {
    const hasNav = page.sections.some((section) => section.componentRegistryId.startsWith('nav-'));
    if (!hasNav) {
      const navComp = eligible.find((component) => component.category === 'navigation');
      if (navComp) {
        page.sections.unshift({
          id: `sec_nav_${page.id}`,
          name: 'Primary Navigation',
          componentRegistryId: navComp.id,
          purpose: 'Global site navigation and primary action anchor',
          content: {},
          assetIds: [],
          order: 1,
          motionPreset: 'fadeSettle',
          contentStatus: 'needs_input',
          contentApproved: false,
        });
      }
    }

    const hasFooter = page.sections.some((section) => section.componentRegistryId.startsWith('footer-'));
    if (!hasFooter) {
      const footerComp = eligible.find((component) => component.category === 'footer');
      if (footerComp) {
        page.sections.push({
          id: `sec_footer_${page.id}`,
          name: 'Footer',
          componentRegistryId: footerComp.id,
          purpose: 'Site directory, legal information, and verified business contact information',
          content: {},
          assetIds: [],
          order: page.sections.length + 1,
          motionPreset: 'fadeSettle',
          contentStatus: 'needs_input',
          contentApproved: false,
        });
      }
    }

    page.sections.forEach((section, index) => {
      section.order = index + 1;
      section.motionPreset = normalizeStudioMotionPreset(section.motionPreset);
    });
  }
}
