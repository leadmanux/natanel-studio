import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createEmptyProject, type Project, type SiteSection } from '../shared/project';
import { demoComponents } from '../shared/componentRegistry';
import { hasComponentImplementation } from '../shared/componentImplementations';
import { getContentContract } from '../shared/contentContracts';
import { normalizeStudioMotionPreset, STUDIO_MOTION_PRESETS } from '../shared/studioMotion';
import { resolveSectionAssets } from '../shared/assetBinding';
import { GeminiSiteComposer } from '../server/services/siteComposer';
import { createStablePageSlug } from '../server/services/sitePlanner';
import { evaluateComponentEligibility } from '../server/services/componentEligibility';
import { EditorialSplitHero } from '../src/studio-components/hero/EditorialSplitHero';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeSection(componentRegistryId: string, id = 'section-1'): SiteSection {
  return {
    id,
    name: componentRegistryId,
    componentRegistryId,
    purpose: 'Composer integrity test',
    content: {},
    assetIds: [],
    order: 1,
    motionPreset: 'fadeSettle',
    contentStatus: 'needs_input',
    contentApproved: false,
  };
}

function makeProject(type: 'business_website' | 'shopify' = 'business_website'): Project {
  const project = createEmptyProject('composer-integrity', type, 'Composer Integrity');
  project.business.businessName = 'Verified Business';
  project.business.description = 'A user-supplied description of the business and its services.';
  project.business.targetAudience = 'People evaluating the business';
  project.business.primaryGoal = 'Generate qualified inquiries';
  project.strategy.positioning = 'Clear, trustworthy service presentation';
  project.strategy.primaryCTA = 'Contact us';
  return project;
}

async function composeSingle(project: Project, componentId: string) {
  const section = makeSection(componentId);
  project.pages = [{ id: 'home', name: 'Home', slug: '/', purpose: 'Home', sections: [section] }];
  const composer = new GeminiSiteComposer('');
  return composer.composeSection(project, 'home', section.id);
}

async function run() {
  console.log('--- RUNNING SITE COMPOSER PRODUCTION INTEGRITY VALIDATION ---');

  // 1. Every approved auto-composable component must be renderable and contract-backed.
  for (const component of demoComponents.filter((item) => item.status === 'approved')) {
    assert(hasComponentImplementation(component.id), `Approved component ${component.id} has no implementation.`);
    assert(getContentContract(component.id), `Approved component ${component.id} has no content contract.`);
  }

  // 2. Missing product facts may never turn into fabricated product names/prices.
  const shopify = makeProject('shopify');
  const productResult = await composeSingle(shopify, 'hero-product-commerce-01');
  assert(productResult.section.contentStatus === 'needs_input', 'Product hero without product facts must need input.');
  const productJson = JSON.stringify(productResult.section.content);
  assert(!productJson.includes('Signature Specimen'), 'Composer leaked the old fake product name.');
  assert(!productJson.includes('1,200'), 'Composer leaked the old fake product price.');
  assert(productResult.section.missingFactualFields?.includes('productName'), 'Missing productName was not detected.');
  assert(productResult.section.missingFactualFields?.includes('price'), 'Missing price was not detected.');

  // 3. No testimonial data means no invented customer identity or quote.
  const testimonialProject = makeProject();
  const testimonialResult = await composeSingle(testimonialProject, 'testimonials-editorial-quote-01');
  assert(testimonialResult.section.contentStatus === 'needs_input', 'Testimonial without facts must need input.');
  assert(!testimonialResult.section.content.author, 'Composer invented a testimonial author.');
  assert(!testimonialResult.section.content.quote, 'Composer invented a testimonial quote.');

  // 4. Metrics and guarantees must remain empty when not supplied.
  const metricProject = makeProject();
  const metricResult = await composeSingle(metricProject, 'cro-metrics-quantified-01');
  assert(metricResult.section.contentStatus === 'needs_input', 'Metrics section without facts must need input.');
  assert(Array.isArray(metricResult.section.content.metrics) && metricResult.section.content.metrics.length === 0, 'Composer invented metrics.');

  const guaranteeProject = makeProject();
  const guaranteeResult = await composeSingle(guaranteeProject, 'cro-guarantee-block-01');
  assert(guaranteeResult.section.contentStatus === 'needs_input', 'Guarantee section without verified terms must need input.');
  const guaranteeJson = JSON.stringify(guaranteeResult.section.content);
  assert(!guaranteeJson.includes('10-year'), 'Composer leaked a demo warranty.');
  assert(!guaranteeJson.includes('100% Quality'), 'Composer leaked a demo guarantee.');

  // 5. Production hero cannot silently render Unsplash/demo imagery.
  const heroMarkup = renderToStaticMarkup(
    React.createElement(EditorialSplitHero, {
      contentMode: 'production',
      direction: 'ltr',
      content: { headline: 'Verified headline' },
      assets: {},
    })
  );
  assert(!heroMarkup.includes('images.unsplash.com'), 'Production hero rendered an Unsplash fallback.');
  assert(!heroMarkup.includes('140 rigorously'), 'Production hero rendered a demo proof claim.');

  // 6. Eligibility must reject incompatible/rejected components.
  const businessProject = makeProject('business_website');
  const ecommerce = demoComponents.find((item) => item.id === 'ecommerce-product-grid-01');
  assert(ecommerce, 'Missing ecommerce test component.');
  assert(!evaluateComponentEligibility(ecommerce, businessProject).eligible, 'Business project accepted Shopify ecommerce component.');
  assert(
    !evaluateComponentEligibility({ ...ecommerce, status: 'rejected' }, { ...businessProject, projectType: 'shopify' }).eligible,
    'Rejected component remained eligible.'
  );
  assert(
    !evaluateComponentEligibility(
      { ...ecommerce, supportedDirections: ['ltr'], rtlReady: false },
      { ...businessProject, projectType: 'shopify', business: { ...businessProject.business, direction: 'rtl' } }
    ).eligible,
    'RTL-incompatible component remained eligible.'
  );

  // 7. Approved asset must beat generated asset regardless of source-array order.
  const assetSection = makeSection('hero-editorial-split-01');
  const heroDefinition = demoComponents.find((item) => item.id === 'hero-editorial-split-01');
  assert(heroDefinition, 'Missing hero definition.');
  const binding = resolveSectionAssets(
    assetSection,
    heroDefinition,
    [
      {
        id: 'generated-first', type: 'image', purpose: 'hero', aspectRatio: '4:5', resolution: '1K', referenceAssets: [], model: 'test', status: 'generated', outputUrl: 'generated://asset', prompt: '',
      },
      {
        id: 'approved-second', type: 'image', purpose: 'hero', aspectRatio: '4:5', resolution: '1K', referenceAssets: [], model: 'test', status: 'approved', outputUrl: 'approved://asset', prompt: '',
      },
    ],
    'home'
  );
  assert(binding.boundAssetIds[0] === 'approved-second', 'Approved asset did not outrank generated asset.');

  // 8. Motion values are canonicalized.
  assert(normalizeStudioMotionPreset('smooth-parallax') === 'fadeSettle', 'Unknown motion preset was not normalized.');
  assert(STUDIO_MOTION_PRESETS.includes(normalizeStudioMotionPreset('clipReveal')), 'Known motion preset failed normalization.');

  // 9. Hebrew page names produce stable unique ASCII slugs.
  const used = new Set<string>();
  const homeSlug = createStablePageSlug('ראשי', 0, used);
  const aboutSlug = createStablePageSlug('אודות', 1, used);
  const duplicateAboutSlug = createStablePageSlug('אודות', 2, used);
  assert(homeSlug === '/', 'Hebrew home page did not map to /.');
  assert(/^\/[a-z0-9-]+$/.test(aboutSlug), `Hebrew slug is not safe ASCII: ${aboutSlug}`);
  assert(aboutSlug !== duplicateAboutSlug, 'Duplicate Hebrew page names produced colliding slugs.');

  console.log('Site Composer integrity validation PASSED.');
}

run().catch((error) => {
  console.error('\nSite Composer integrity validation FAILED:');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
