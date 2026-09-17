import JSZip from 'jszip';
import { createEmptyProject, type Project, type SiteSection } from '../shared/project';
import { SiteExportService } from '../server/services/exportService';
import { normalizeReactSourceZip } from '../server/services/reactZipNormalizer';
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
  const section = readySection('footer-minimal-legal-01');
  section.assetIds = ['generated-image'];
  project.pages = [{ id: 'home', name: 'Home', slug: '/', purpose: 'Home', sections: [section] }];
  project.assets = [{
    id: 'generated-image',
    type: 'image',
    purpose: 'hero',
    pageId: 'home',
    sectionId: section.id,
    prompt: 'test',
    aspectRatio: '1:1',
    resolution: '1K',
    referenceAssets: [],
    model: 'test',
    status: 'approved',
    outputUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
  }];
  return project;
}

async function openZip(buffer: Buffer) {
  return JSZip.loadAsync(buffer);
}

async function run() {
  console.log('--- RUNNING EXPORT DELIVERY VALIDATION ---');
  const service = new SiteExportService();

  const business = businessProject();
  const reactValidation = await service.validate(business, 'react');
  assert(reactValidation.valid, `React export unexpectedly invalid: ${JSON.stringify(reactValidation.issues)}`);
  const react = await service.generate(business, 'react');
  const normalizedReact = await normalizeReactSourceZip(react.buffer);
  const reactZip = await openZip(normalizedReact);
  const reactEntries = new Set(Object.keys(reactZip.files));
  const reactRoot = 'verified-business-react/';
  assert(reactEntries.has(`${reactRoot}package.json`), 'React ZIP missing package.json.');
  assert(reactEntries.has(`${reactRoot}src/App.tsx`), 'React ZIP missing App.tsx.');
  assert(reactEntries.has(`${reactRoot}src/project.json`), 'React ZIP missing project.json.');
  assert(Array.from(reactEntries).some((name) => name.includes('StudioSiteRenderer.tsx')), 'React ZIP missing StudioSiteRenderer source.');
  const exportedCss = await reactZip.file(`${reactRoot}src/site.css`)?.async('string');
  assert(Boolean(exportedCss && exportedCss.length > 100), 'React ZIP did not preserve Studio responsive CSS.');

  const wordpress = await service.generate(business, 'wordpress');
  const wordpressZip = await openZip(wordpress.buffer);
  const wordpressEntries = new Set(Object.keys(wordpressZip.files));
  const wpRoot = 'verified-business-theme/';
  assert(wordpressEntries.has(`${wpRoot}style.css`), 'WordPress ZIP missing style.css.');
  assert(wordpressEntries.has(`${wpRoot}theme.json`), 'WordPress ZIP missing theme.json.');
  assert(wordpressEntries.has(`${wpRoot}templates/index.html`), 'WordPress ZIP missing index template.');

  const shopify = shopifyProject();
  const shopifyValidation = await service.validate(shopify, 'shopify');
  assert(shopifyValidation.valid, `Shopify export unexpectedly invalid: ${JSON.stringify(shopifyValidation.issues)}`);
  const shopifyArtifact = await service.generate(shopify, 'shopify');
  const normalizedShopify = await normalizeShopifyThemeZip(shopifyArtifact.buffer);
  const shopifyZip = await openZip(normalizedShopify);
  const shopifyEntries = new Set(Object.keys(shopifyZip.files));
  assert(shopifyEntries.has('layout/theme.liquid'), 'Shopify ZIP missing root layout/theme.liquid.');
  assert(shopifyEntries.has('templates/index.json'), 'Shopify ZIP missing root index.json.');
  assert(shopifyEntries.has('templates/product.json'), 'Shopify ZIP missing native product template.');
  assert(shopifyEntries.has('templates/collection.json'), 'Shopify ZIP missing collection template.');
  assert(shopifyEntries.has('templates/cart.json'), 'Shopify ZIP missing cart template.');
  assert(shopifyEntries.has('sections/main-product.liquid'), 'Shopify ZIP missing native product form section.');
  assert(shopifyEntries.has('sections/natanel-studio-section.liquid'), 'Shopify ZIP missing Natanel Studio section compiler.');
  assert(Array.from(shopifyEntries).some((name) => name.startsWith('assets/natanel-generated-') && name.endsWith('.png')), 'Shopify data image was not packaged as a theme asset.');
  const homeTemplate = await shopifyZip.file('templates/index.json')?.async('string');
  assert(Boolean(homeTemplate && !homeTemplate.includes('data:image/')), 'Shopify template still contains an inline data URL.');
  assert(Boolean(homeTemplate && homeTemplate.includes('image_asset')), 'Shopify template did not reference packaged image asset.');

  const badTarget = await service.validate(shopify, 'react');
  assert(!badTarget.valid, 'Shopify project incorrectly allowed React export.');
  assert(badTarget.issues.some((issue) => issue.code === 'target_mismatch'), 'Target mismatch was not diagnosed.');

  const notReady = businessProject();
  notReady.pages[0].sections[0].contentStatus = 'needs_input';
  const blocked = await service.validate(notReady, 'wordpress');
  assert(!blocked.valid, 'Not-ready section incorrectly passed export validation.');
  assert(blocked.issues.some((issue) => issue.code === 'section_not_ready'), 'Not-ready section was not diagnosed.');

  const binaryPrefix = normalizedReact.toString('utf8', 0, Math.min(normalizedReact.length, 1000));
  assert(!binaryPrefix.includes('GEMINI_API_KEY='), 'Export artifact leaked a Gemini API key declaration.');

  console.log('Export delivery validation PASSED.');
}

run().catch((error) => {
  console.error('\nExport delivery validation FAILED:');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
