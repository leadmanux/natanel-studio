import JSZip from 'jszip';
import { createShopifyReferenceProject } from '../shared/referenceShopifyProject';
import { validateProjectForExport } from '../shared/exportValidation';
import { canonicalComponentStore } from '../server/services/canonicalComponentStore';
import { ShopifyThemeExporter } from '../server/services/export/shopifyExporter';
import { exportStore } from '../server/services/export/exportStore';
import { renderExactExportSection } from '../server/services/export/renderExportSection';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const DEMO_MARKERS = [
  'images.unsplash.com',
  'studio@natanel.design',
  'atelier@natanel.design',
  '03-555-0199',
  '03-555-1234',
  '1-800-555-0199',
  '054-456-7890',
  '+972-54-456-7890',
  'SUMMER MMXXVI',
  'Villa 04 Sovereign',
  'Basalt Pavilion',
];

async function read(zip: JSZip, filename: string): Promise<string> {
  const file = zip.file(filename);
  assert(file, `Reference-store Shopify ZIP is missing ${filename}.`);
  return file.async('text');
}

async function validateDirection(direction: 'ltr' | 'rtl') {
  await canonicalComponentStore.init();
  const canonical = canonicalComponentStore.getAllComponents();
  const project = createShopifyReferenceProject(direction);

  const validation = validateProjectForExport(project, 'shopify', canonical);
  assert(validation.valid, `Reference store ${direction} validation failed: ${validation.errors.join(' | ')}`);
  assert(
    validation.issues.some((issue) => issue.code === 'shopify_page_resources_required'),
    'Reference store should explain that Shopify Page resources/templates must be assigned after upload.'
  );
  assert(
    validation.issues.some((issue) => issue.code === 'shopify_featured_product_binding_required'),
    'Homepage product hero should surface the post-upload Shopify product-binding warning.'
  );

  // Exercise the exact production renderer used by export, not a substitute fixture renderer.
  for (const page of project.pages) {
    for (const section of page.sections) {
      const rendered = renderExactExportSection(
        section,
        page,
        project,
        canonical,
        (sourceUrl) => `/reference-assets/${encodeURIComponent(project.assets.find((asset) => asset.outputUrl === sourceUrl)?.id || 'asset')}`
      );
      assert(rendered.html.trim().length > 0, `Rendered section ${section.id} is empty.`);
      for (const marker of DEMO_MARKERS) {
        assert(!rendered.html.includes(marker), `Section ${section.id} leaked Studio demo marker "${marker}".`);
      }
    }
  }

  const exporter = new ShopifyThemeExporter(canonical);
  const result = await exporter.export(project);
  assert(result.success, `Reference store Shopify export failed: ${result.message}`);
  assert(result.downloadId, 'Reference store export did not return a download ID.');

  const artifact = exportStore.get(result.downloadId);
  assert(artifact, 'Reference store export artifact is missing from exportStore.');
  const zip = await JSZip.loadAsync(artifact.buffer);

  const requiredFiles = [
    'layout/theme.liquid',
    'sections/header-group.json',
    'sections/footer-group.json',
    'sections/ns-product-hero.liquid',
    'sections/ns-product-grid.liquid',
    'sections/ns-product-details.liquid',
    'sections/ns-faq.liquid',
    'snippets/ns-product-card.liquid',
    'templates/index.json',
    'templates/product.json',
    'templates/collection.json',
    'config/settings_schema.json',
    'assets/theme.css',
    'assets/theme.js',
    'assets/natanel-studio-manifest.json',
  ];
  for (const filename of requiredFiles) {
    assert(zip.file(filename), `Reference store export is missing ${filename}.`);
  }

  const layout = await read(zip, 'layout/theme.liquid');
  assert(layout.includes(`dir="${direction}"`), `Reference store lost ${direction.toUpperCase()} direction in theme.liquid.`);
  assert(layout.includes("{% sections 'header-group' %}"), 'Reference store is not using an Online Store 2.0 header section group.');
  assert(layout.includes("{% sections 'footer-group' %}"), 'Reference store is not using an Online Store 2.0 footer section group.');

  const product = await read(zip, 'sections/ns-product-hero.liquid');
  assert(product.includes("{% form 'product', featured_product %}"), 'Reference product hero lost native Shopify product form behavior.');
  assert(product.includes('selected_or_first_available_variant'), 'Reference product hero lost variant selection.');
  assert(product.includes('payment_button'), 'Reference product hero lost accelerated checkout support.');

  const grid = await read(zip, 'sections/ns-product-grid.liquid');
  assert(grid.includes('collections.all'), 'Reference collection grid is not bound to native Shopify collections.');
  assert(grid.includes("render 'ns-product-card'"), 'Reference collection grid is not using the product-card snippet.');

  const details = await read(zip, 'sections/ns-product-details.liquid');
  assert(details.includes('"type":"@app"'), 'Reference product details do not permit Shopify app blocks.');

  const manifest = JSON.parse(await read(zip, 'assets/natanel-studio-manifest.json')) as {
    target?: string;
    direction?: string;
    assetIdsUsed?: string[];
  };
  assert(manifest.target === 'shopify', 'Reference-store manifest target is not Shopify.');
  assert(manifest.direction === direction, 'Reference-store manifest direction does not match the project.');
  assert(
    manifest.assetIdsUsed?.includes('qa-product-primary') && manifest.assetIdsUsed?.includes('qa-product-secondary'),
    'Reference-store manifest is missing localized product assets.'
  );

  const textFiles = Object.entries(zip.files).filter(
    ([filename, entry]) => !entry.dir && /\.(liquid|json|css|js|txt)$/i.test(filename)
  );
  for (const [filename, entry] of textFiles) {
    const text = await entry.async('text');
    for (const marker of DEMO_MARKERS) {
      assert(!text.includes(marker), `Exported file ${filename} leaked Studio demo marker "${marker}".`);
    }
    assert(!text.includes('data:image/'), `Exported file ${filename} still embeds data-image assets instead of localized theme files.`);
  }

  const localizedAssets = Object.keys(zip.files).filter(
    (filename) => filename.startsWith('assets/') && /\.(svg|png|jpe?g|webp|gif|avif)$/i.test(filename)
  );
  assert(localizedAssets.length >= 2, 'Reference store did not localize the product imagery into theme assets.');

  return {
    direction,
    pages: project.pages.length,
    sections: project.pages.reduce((sum, page) => sum + page.sections.length, 0),
    localizedAssets: localizedAssets.length,
    warnings: validation.warnings.length,
    filename: result.filename,
  };
}

async function run() {
  console.log('--- END-TO-END SHOPIFY REFERENCE STORE QA ---');
  const rtl = await validateDirection('rtl');
  const ltr = await validateDirection('ltr');

  console.log('RTL reference:', rtl);
  console.log('LTR reference:', ltr);
  console.log('End-to-end Shopify reference store QA PASSED.');
}

run().catch((error) => {
  console.error('End-to-end Shopify reference store QA FAILED.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
