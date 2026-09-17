import type { Project, SitePage, SiteSection } from '../../shared/project';
import type { ComponentDefinition } from '../../shared/componentRegistry';
import type { SitePlannerService } from '../../src/ai/contracts';
import { canonicalComponentStore } from './canonicalComponentStore';
import { GeminiComponentSelector } from './componentSelector';

export class GeminiSitePlanner implements SitePlannerService {
  private componentSelector: GeminiComponentSelector;

  constructor() {
    this.componentSelector = new GeminiComponentSelector();
  }

  async plan(project: Project): Promise<Project['pages']> {
    // 1. Fetch only canonically approved components from canonical component store
    const approvedComponents = canonicalComponentStore.getApprovedComponents();

    // 2. Select components for the project architecture
    const selections = await this.componentSelector.selectDetailed(project, approvedComponents);

    // 3. Determine required pages from strategy
    const requiredPages = project.strategy.requiredPages && project.strategy.requiredPages.length > 0
      ? project.strategy.requiredPages
      : project.projectType === 'shopify'
        ? ['Home', 'Catalog', 'Product', 'About']
        : ['Home', 'About', 'Services', 'Contact'];

    const pagesMap = new Map<string, SitePage>();

    // Initialize required pages
    requiredPages.forEach((pageName, index) => {
      const slug = index === 0 || pageName.toLowerCase() === 'home'
        ? '/'
        : `/${pageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;

      pagesMap.set(pageName.toLowerCase(), {
        id: `page_${Date.now()}_${index}_${Math.random().toString(36).substring(2, 6)}`,
        name: pageName,
        slug,
        purpose: `${pageName} experience for ${project.business.businessName || 'the studio client'}.`,
        sections: [],
      });
    });

    // 4. Distribute selected components into pages
    let globalSectionCount = 0;

    for (const item of selections) {
      const pageKey = (item.page || 'Home').toLowerCase();
      let targetPage = pagesMap.get(pageKey);

      // If page doesn't exist, create it or default to home
      if (!targetPage) {
        if (pagesMap.has('home')) {
          targetPage = pagesMap.get('home')!;
        } else {
          const firstPage = Array.from(pagesMap.values())[0];
          targetPage = firstPage;
        }
      }

      if (targetPage) {
        globalSectionCount++;
        const sectionId = `sec_${Date.now()}_${globalSectionCount}_${Math.random().toString(36).substring(2, 6)}`;

        const newSection: SiteSection = {
          id: sectionId,
          name: item.sectionPurpose || `Section ${targetPage.sections.length + 1}`,
          componentRegistryId: item.componentRegistryId,
          purpose: item.sectionPurpose,
          content: {},
          assetIds: [],
          order: targetPage.sections.length + 1,
          reason: item.reason,
          contentRequirements: item.contentRequirements,
          imageRequirements: item.imageRequirements,
          motionPreset: item.motionPreset || 'fadeSettle',
          contentStatus: 'needs_input',
        };

        targetPage.sections.push(newSection);
      }
    }

    // Ensure every page has at least a Navigation, Hero/Content, and Footer
    for (const page of pagesMap.values()) {
      this.ensureEssentialPageStructure(page, approvedComponents, project);
    }

    return Array.from(pagesMap.values());
  }

  private ensureEssentialPageStructure(
    page: SitePage,
    approved: ComponentDefinition[],
    project: Project
  ) {
    const isHome = page.slug === '/' || page.name.toLowerCase() === 'home';
    const isRtl = project.business.direction === 'rtl';

    // Eligible components matching direction
    const eligible = approved.filter((c) => !isRtl || c.rtlReady !== false);

    // Check if navigation exists
    const hasNav = page.sections.some((s) => s.componentRegistryId.startsWith('nav-'));
    if (!hasNav) {
      const navComp = eligible.find((c) => c.category === 'navigation') || approved.find((c) => c.category === 'navigation');
      if (navComp) {
        page.sections.unshift({
          id: `sec_nav_${page.id}`,
          name: 'Primary Navigation',
          componentRegistryId: navComp.id,
          purpose: 'Global sovereign navigation and chapter index',
          content: {},
          assetIds: [],
          order: 1,
          motionPreset: 'fadeSettle',
          contentStatus: 'needs_input',
        });
      }
    }

    // Check if footer exists
    const hasFooter = page.sections.some((s) => s.componentRegistryId.startsWith('footer-'));
    if (!hasFooter) {
      const footerComp = eligible.find((c) => c.category === 'footer') || approved.find((c) => c.category === 'footer');
      if (footerComp) {
        page.sections.push({
          id: `sec_footer_${page.id}`,
          name: 'Footer & Sovereign Colophon',
          componentRegistryId: footerComp.id,
          purpose: 'Legal disclosure, navigation directory, and architectural colophon',
          content: {},
          assetIds: [],
          order: page.sections.length + 1,
          motionPreset: 'fadeSettle',
          contentStatus: 'needs_input',
        });
      }
    }

    // Re-index order numbers sequentially
    page.sections.forEach((s, idx) => {
      s.order = idx + 1;
    });
  }
}
