import type { Project, SitePage, SiteSection } from '../../shared/project';
import type { ComponentDefinition } from '../../shared/componentRegistry';
import type { SitePlannerService } from '../../src/ai/contracts';
import { normalizeStudioMotionPreset } from '../../shared/studioMotion';
import { createStablePageSlug } from '../../shared/pageSlug';
import { getEligibleComponents } from '../../shared/componentEligibility';
import { canonicalComponentStore } from './canonicalComponentStore';
import { GeminiComponentSelector } from './componentSelector';

export { createStablePageSlug } from '../../shared/pageSlug';

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

    const requiredPages = project.strategy.requiredPages?.length
      ? project.strategy.requiredPages
      : project.projectType === 'shopify'
        ? ['Home', 'Catalog', 'Product', 'About']
        : ['Home', 'About', 'Services', 'Contact'];

    const pagesMap = new Map<string, SitePage>();
    const usedSlugs = new Set<string>();

    requiredPages.forEach((pageName, index) => {
      pagesMap.set(pageName.toLowerCase(), {
        id: `page_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        name: pageName,
        slug: createStablePageSlug(pageName, index, usedSlugs),
        purpose: `${pageName} experience for ${project.business.businessName || 'the project'}.`,
        sections: [],
      });
    });

    let globalSectionCount = 0;
    const eligibleIds = new Set(eligibleComponents.map((component) => component.id));

    for (const item of selections) {
      if (!eligibleIds.has(item.componentRegistryId)) continue;

      const pageKey = (item.page || 'Home').toLowerCase();
      const targetPage = pagesMap.get(pageKey) || pagesMap.get('home') || Array.from(pagesMap.values())[0];
      if (!targetPage) continue;

      globalSectionCount++;
      const section: SiteSection = {
        id: `sec_${Date.now()}_${globalSectionCount}_${Math.random().toString(36).substring(2, 6)}`,
        name: item.sectionPurpose || `Section ${targetPage.sections.length + 1}`,
        componentRegistryId: item.componentRegistryId,
        purpose: item.sectionPurpose,
        content: {},
        assetIds: [],
        assetBindings: {},
        order: targetPage.sections.length + 1,
        reason: item.reason,
        contentRequirements: item.contentRequirements,
        imageRequirements: item.imageRequirements,
        motionPreset: normalizeStudioMotionPreset(item.motionPreset),
        contentStatus: 'needs_input',
        contentApproved: false,
      };
      targetPage.sections.push(section);
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
          assetBindings: {},
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
          assetBindings: {},
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
