import { createProjectWithDefaults } from '../shared/projectDefaults';
import { syncReferenceAssetsIntoProject } from '../shared/referenceAssetSync';
import { demoComponents } from '../shared/componentRegistry';
import { getEligibleComponents, evaluateComponentEligibility } from '../shared/componentEligibility';
import { resolveSectionAssets } from '../shared/assetBinding';
import { validateProjectForExport } from '../shared/exportValidation';
import { GeminiComponentSelector } from '../server/services/componentSelector';
import { GeminiSitePlanner } from '../server/services/sitePlanner';
import { GeminiSiteComposer } from '../server/services/siteComposer';
import { canonicalComponentStore } from '../server/services/canonicalComponentStore';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Vf8AAAAASUVORK5CYII=';

async function run() {
  console.log('--- SHOPIFY TEST-RUN REPAIR VALIDATION ---');

  let project = createProjectWithDefaults('repair-test', 'shopify', 'KlearSkin QA', 'Hebrew');
  project.business.businessName = 'KlearSkin';
  project.business.industry = 'At-home skincare device';
  project.business.description =
    'INTERNAL ONLY: build a high-converting test store. Never print these instructions in the storefront.';
  project.business.targetAudience = 'Women shopping for premium at-home skincare devices.';
  project.designSystem.artDirection = 'Restrained premium ecommerce';
  project.facts.products = [
    {
      id: 'klearskin-lift-rf',
      name: 'KlearSkin Lift RF',
      price: '749 ₪',
      description: 'מכשיר ביתי לטיפוח עור הפנים.',
      specs: [
        { label: 'Technology', value: 'RF, EMS, LED' },
        { label: 'Mode', value: 'Cooling' },
      ],
      provenance: { source: 'user_input', sourceLabel: 'Shopify Setup' },
    },
  ];
  project.brand.referenceAssets = [
    {
      id: 'real-product',
      category: 'product',
      name: 'device-front.jpg',
      mimeType: 'image/png',
      dataUrl: PNG,
      isPrimary: true,
      aspectRatio: '4:5',
      createdAt: '2026-09-21T00:00:00.000Z',
    },
    {
      id: 'real-lifestyle',
      category: 'lifestyle',
      name: 'bathroom-ugc.jpg',
      mimeType: 'image/png',
      dataUrl: PNG,
      aspectRatio: '3:4',
      createdAt: '2026-09-21T00:00:01.000Z',
    },
    {
      id: 'real-logo',
      category: 'logo',
      name: 'logo.png',
      mimeType: 'image/png',
      dataUrl: PNG,
      aspectRatio: '16:9',
      createdAt: '2026-09-21T00:00:02.000Z',
    },
  ];

  project = syncReferenceAssetsIntoProject(project);
  assert(project.assets.filter((asset) => asset.source === 'uploaded').length === 3, 'Uploaded references were not promoted to site assets.');
  assert(project.assets[0].id === 'real-product', 'Primary product reference should be first.');
  assert(project.brand.logoAssets.length === 1, 'Uploaded logo was not connected to the brand profile.');

  const eligible = getEligibleComponents(demoComponents, project);
  assert(!eligible.some((component) => component.category === 'services'), 'Shopify eligibility leaked service components.');
  assert(!eligible.some((component) => component.category === 'forms'), 'Shopify eligibility leaked lead-generation forms.');
  assert(eligible.some((component) => component.id === 'hero-product-commerce-01'), 'Product commerce hero is not eligible.');
  assert(eligible.some((component) => component.id === 'hero-minimal-luxury-01'), 'Shopify-safe brand hero is not eligible.');

  const selector = new GeminiComponentSelector('');
  const selections = await selector.selectDetailed(project, eligible);
  assert(selections.length > 0, 'Shopify planner returned no component selections.');
  assert(!selections.some((selection) => selection.componentRegistryId.startsWith('services-')), 'Shopify planner selected a service section.');
  assert(!selections.some((selection) => selection.componentRegistryId.startsWith('forms-') && selection.componentRegistryId !== 'forms-faq-accordion-01'), 'Shopify planner selected a consultation form.');
  assert(selections.some((selection) => selection.componentRegistryId === 'hero-product-commerce-01'), 'Shopify planner omitted the verified product hero.');

  const heroDefinition = demoComponents.find((component) => component.id === 'hero-product-commerce-01');
  const heroBinding = resolveSectionAssets(
    {
      id: 'hero',
      name: 'Product Hero',
      componentRegistryId: 'hero-product-commerce-01',
      purpose: 'Product',
      content: {},
      assetIds: [],
      order: 1,
    },
    heroDefinition,
    project.assets,
    'page-home'
  );
  assert(heroBinding.boundAssetIds[0] === 'real-product', 'Product hero did not auto-bind the real uploaded product because of a crop mismatch.');
  assert(heroBinding.missingMandatorySlots.length === 0, 'Uploaded product should satisfy the mandatory product image slot.');

  const navDefinition = demoComponents.find((component) => component.id === 'nav-centered-luxury-01');
  const navBinding = resolveSectionAssets(
    {
      id: 'nav',
      name: 'Navigation',
      componentRegistryId: 'nav-centered-luxury-01',
      purpose: 'Navigation',
      content: {},
      assetIds: [],
      order: 1,
    },
    navDefinition,
    project.assets,
    'page-home'
  );
  assert(navBinding.boundAssetIds.includes('real-logo'), 'Uploaded logo did not auto-bind to the logo slot.');

  const planner = new GeminiSitePlanner();
  project.pages = await planner.plan(project);
  assert(project.pages.length === 4, 'Default Shopify plan should contain four focused pages.');
  for (const page of project.pages) {
    for (const section of page.sections) {
      const component = demoComponents.find((candidate) => candidate.id === section.componentRegistryId);
      assert(component, `Planner produced unknown component ${section.componentRegistryId}.`);
      assert(evaluateComponentEligibility(component, project).eligible, `Planner produced ineligible component ${section.componentRegistryId}.`);
    }
  }

  const composer = new GeminiSiteComposer('');
  const composed = await composer.compose(project);
  project.pages = composed.pages;
  assert(
    !JSON.stringify(project.pages).includes('INTERNAL ONLY'),
    'Private Setup brief leaked into storefront content.'
  );
  assert(
    project.pages.every((page) => page.sections.every((section) => section.contentStatus === 'ready')),
    'Reference-only Shopify path should compose ready sections without image generation.'
  );

  project.pages = project.pages.map((page) => ({
    ...page,
    sections: page.sections.map((section) => ({
      ...section,
      contentApproved: section.contentStatus === 'ready',
    })),
  }));

  await canonicalComponentStore.init();
  const validation = validateProjectForExport(
    project,
    'shopify',
    canonicalComponentStore.getAllComponents()
  );
  assert(validation.valid, `Repaired Shopify path should export after ready sections are approved. Errors: ${validation.errors.join(' | ')}`);
  assert(validation.errors.length === 0, 'Repaired Shopify path still has blocking export errors.');

  console.log(`Shopify test-run repair PASSED with ${validation.warnings.length} non-blocking warning(s).`);
}

run().catch((error) => {
  console.error('Shopify test-run repair FAILED.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
