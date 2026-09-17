import JSZip from 'jszip';
import { createEmptyProject, type Project, type SiteSection } from '../shared/project';
import { SiteExportService } from '../server/services/exportService';
import { normalizeShopifyThemeZip } from '../server/services/shopifyZipNormalizer';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function readySection(id: string): SiteSection {
  return {
    id: `section-${id}`,
    name: id,
    componentRegistryId: id,
    purpose: 'Export validation section',
    content: {
      brandName: 'Verified Business',
      headline: 'Verified Business',
      description: 'User supplied project description.',
    },
    assetIds: [],
    order: 1,
    motionPreset: 'fadeSettle',
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
  };
}

function businessProject(): Project {
  const project = createEmptyProject('export-business', 'business_website', 'Verified Business');
  project.business.businessName = 'Verified Business';
  project.business.description = 'User supplied project description.';
  project.business.targetAudience = 'Customers';
  project.business.primaryGoal = 'Qualified inquiries';
  project.designSystem.artDirection = 'Restrained editorial';
  project.pages = [{ id: 'home', name: 'Home', slug: '/', purpose: 'Home', sections: [readySection('footer-minimal-legal-01')] }];
  return project;
}

function shopifyProject(): Project {
  const project = createEmptyProject('export-shopify', 'shopify', 'Verified Store');
  project.business.businessName = 'Verified Store';
  project.business.description = 'User supplied store description.';
  project.business.targetAudience = 'Customers';
  project.business.primaryGoal = 'Sell products';
  project.designSystem.artDirection = 'Product editorial';
  project.pages = [{ id: 'home', name: 'Home', slug: '/', purpose: 'Home', sections: [readySection('footer-minimal-legal-01')] }];
  return project;
}

async function entries(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  return new Set(Object.keys(zip.files));
}

async function run() {
  console.log('--- RUNNING EXPORT DELIVERY VALIDATION ---');
  const service = new SiteExportService();

  const business = businessProject();
  const reactValidation = await service.validate(business, 'react');
  assert(reactValidation.valid, `React export unexpectedly invalid: ${JSON.stringify(reactValidation.issues)}`);
  const react = await service.generate(business, 'react');
  const reactEntries = await entries(react.buffer);
  const reactRoot = 'verified-business-react/';
  assert(reactEntries.has(`${reactRoot}package.json`), 'React ZIP missing package.json.');
  assert(reactEntries.has(`${reactRoot}src/App.tsx`), 'React ZIP missing App.tsx.');
  assert(reactEntries.has(`${reactRoot}src/project.json`), 'React ZIP missing project.json.');
  assert(Array.from(reactEntries).some((name) => name.includes('StudioSiteRenderer.tsx')), 'React ZIP missing StudioSiteRenderer source.');

  const wordpress = await service.generate(business, 'wordpress');
  const wordpressEntries = await entries(wordpress.buffer);
  const wpRoot = 'verified-business-theme/';
  assert(wordpressEntries.has(`${wpRoot}style.css`), 'WordPress ZIP missing style.css.');
  assert(wordpressEntries.has(`${wpRoot}theme.json`), 'WordPress ZIP missing theme.json.');
  assert(wordpressEntries.has(`${wpRoot}templates/index.html`), 'WordPress ZIP missing index template.');

  const shopify = shopifyProject();
  const shopifyValidation = await service.validate(shopify, 'shopify');
  assert(shopifyValidation.valid, `Shopify export unexpectedly invalid: ${JSON.stringify(shopifyValidation.issues)}`);
  const shopifyArtifact = await service.generate(shopify, 'shopify');
  const normalizedShopify = await normalizeShopifyThemeZip(shopifyArtifact.buffer);
  const shopifyEntries = await entries(normalizedShopify);
  assert(shopifyEntries.has('layout/theme.liquid'), 'Shopify ZIP missing root layout/theme.liquid.');
  assert(shopifyEntries.has('templates/index.json'), 'Shopify ZIP missing root index.json.');
  assert(shopifyEntries.has('templates/product.json'), 'Shopify ZIP missing native product template.');
  assert(shopifyEntries.has('templates/collection.json'), 'Shopify ZIP missing collection template.');
  assert(shopifyEntries.has('templates/cart.json'), 'Shopify ZIP missing cart template.');
  assert(shopifyEntries.has('sections/main-product.liquid'), 'Shopify ZIP missing native product form section.');
  assert(shopifyEntries.has('sections/natanel-studio-section.liquid'), 'Shopify ZIP missing Natanel Studio section compiler.');

  const badTarget = await service.validate(shopify, 'react');
  assert(!badTarget.valid, 'Shopify project incorrectly allowed React export.');
  assert(badTarget.issues.some((issue) => issue.code === 'target_mismatch'), 'Target mismatch was not diagnosed.');

  const notReady = businessProject();
  notReady.pages[0].sections[0].contentStatus = 'needs_input';
  const blocked = await service.validate(notReady, 'wordpress');
  assert(!blocked.valid, 'Not-ready section incorrectly passed export validation.');
  assert(blocked.issues.some((issue) => issue.code === 'section_not_ready'), 'Not-ready section was not diagnosed.');

  const binaryPrefix = react.buffer.toString('utf8', 0, Math.min(react.buffer.length, 1000));
  assert(!binaryPrefix.includes('GEMINI_API_KEY='), 'Export artifact leaked a Gemini API key declaration.');

  console.log('Export delivery validation PASSED.');
}

run().catch((error) => {
  console.error('\nExport delivery validation FAILED:');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
