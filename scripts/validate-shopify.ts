import JSZip from 'jszip';
import { createEmptyProject, type Project, type SiteSection } from '../shared/project';
import { demoComponents, type ComponentDefinition } from '../shared/componentRegistry';
import { validateProjectForExport } from '../shared/exportValidation';
import { ShopifyThemeExporter } from '../server/services/export/shopifyExporter';
import { exportStore } from '../server/services/export/exportStore';
import type { ExportManifest } from '../shared/exportTypes';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function canonicalRegistry(): ComponentDefinition[] {
  return demoComponents.map((component) => ({ ...component }));
}

function readySection(
  partial: Omit<
    SiteSection,
    'contentStatus' | 'contentApproved' | 'missingFactualFields' | 'missingAssetRequirements'
  >
): SiteSection {
  return {
    ...partial,
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
  };
}

const pixel =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

function makeShopifyProject(direction: 'ltr' | 'rtl' = 'ltr'): Project {
  const project = createEmptyProject(
    `shopify-${direction}`,
    'shopify',
    direction === 'rtl' ? 'חנות אטלייה' : 'Atelier Goods'
  );
  project.business.businessName = direction === 'rtl' ? 'אטלייה נורת׳' : 'Atelier North';
  project.business.description =
    direction === 'rtl'
      ? 'חנות עצמאית לאובייקטים לבית עם חומריות טבעית ועיצוב מוקפד.'
      : 'An independent home-object store focused on natural materials and disciplined design.';
  project.business.language = direction === 'rtl' ? 'Hebrew' : 'English';
  project.business.direction = direction;
  project.business.email = 'hello@example.com';
  project.brand.ecommerceMode = 'ecommerce';
  project.designSystem.artDirection = 'Quiet editorial commerce';
  project.designSystem.typography = 'Plus Jakarta Sans with editorial serif display';
  project.designSystem.colors = ['#111214', '#1c1d20', '#c7a76d'];
  project.designSystem.borderRadius = '4px subtle';
  project.designSystem.density = 'editorial';

  project.assets = [
    {
      id: 'asset-product-a',
      type: 'image',
      purpose: 'primary product photography',
      prompt: '',
      aspectRatio: '1:1',
      resolution: '1K',
      referenceAssets: [],
      model: 'test',
      status: 'approved',
      outputUrl: pixel,
    },
    {
      id: 'asset-product-b',
      type: 'image',
      purpose: 'secondary product photography',
      prompt: '',
      aspectRatio: '1:1',
      resolution: '1K',
      referenceAssets: [],
      model: 'test',
      status: 'approved',
      outputUrl: pixel,
    },
  ];

  project.facts.products = [
    {
      id: 'stone-lamp',
      name: 'Stone Table Lamp',
      price: '$180',
      originalPrice: '$220',
      description: 'A carved stone table lamp with a linen shade.',
    },
    {
      id: 'oak-tray',
      name: 'Smoked Oak Tray',
      price: '$95',
      description: 'Hand-finished smoked oak serving tray.',
    },
  ];

  const productHero = (id: string, order: number) =>
    readySection({
      id,
      name: 'Product Hero',
      componentRegistryId: 'hero-product-commerce-01',
      purpose: 'Featured commerce offer',
      order,
      motionPreset: 'fadeReveal',
      content: {
        tagline: direction === 'rtl' ? 'קולקציה נבחרת' : 'Featured Object',
        productName: direction === 'rtl' ? 'מנורת אבן טבעית' : 'Stone Table Lamp',
        description:
          direction === 'rtl'
            ? 'אובייקט תאורה מחומר טבעי בגימור ידני.'
            : 'A sculptural natural-stone light finished by hand.',
        price: direction === 'rtl' ? '₪690' : '$180',
        originalPrice: direction === 'rtl' ? '₪790' : '$220',
        ctaText: direction === 'rtl' ? 'הוספה לסל' : 'Add to cart',
        shippingNote: direction === 'rtl' ? 'משלוח מחושב בקופה' : 'Shipping calculated at checkout',
      },
      assetIds: ['asset-product-a'],
      assetBindings: { product: 'asset-product-a' },
    });

  const reviews = readySection({
    id: 'reviews',
    name: 'Customer Reviews',
    componentRegistryId: 'testimonials-review-carousel-01',
    purpose: 'Verified customer proof',
    order: 2,
    motionPreset: 'fadeSettle',
    content: {
      title: direction === 'rtl' ? 'מה אומרים עלינו' : 'Customer notes',
      subtitle: direction === 'rtl' ? 'משוב מלקוחות' : 'Feedback from customers',
      reviews: [
        {
          author: direction === 'rtl' ? 'נועה ל.' : 'Maya R.',
          rating: 5,
          reviewText: direction === 'rtl' ? 'איכות מעולה והאריזה מוקפדת.' : 'Beautiful quality and careful packaging.',
          projectType: direction === 'rtl' ? 'רכישה מאומתת' : 'Verified purchase',
        },
      ],
    },
    assetIds: [],
  });

  const faq = readySection({
    id: 'faq',
    name: 'FAQ',
    componentRegistryId: 'forms-faq-accordion-01',
    purpose: 'Purchase clarity',
    order: 3,
    motionPreset: 'none',
    content: {
      eyebrow: direction === 'rtl' ? 'מידע' : 'Details',
      headline: direction === 'rtl' ? 'שאלות נפוצות' : 'Frequently asked questions',
      items: [
        {
          question: direction === 'rtl' ? 'מתי ההזמנה נשלחת?' : 'When will my order ship?',
          answer:
            direction === 'rtl'
              ? 'זמן המשלוח המדויק מוצג בקופה.'
              : 'The exact shipping estimate is shown at checkout.',
        },
      ],
    },
    assetIds: [],
  });

  const footer = readySection({
    id: 'footer',
    name: 'Footer',
    componentRegistryId: 'footer-minimal-legal-01',
    purpose: 'Store footer',
    order: 99,
    motionPreset: 'none',
    content: {
      brandName: project.business.businessName,
      copyrightYear: '2026',
      legalLinks: [],
    },
    assetIds: [],
  });

  const productGrid = readySection({
    id: 'product-grid',
    name: 'Collection Grid',
    componentRegistryId: 'ecommerce-product-grid-01',
    purpose: 'Browse products',
    order: 1,
    motionPreset: 'fadeReveal',
    content: {
      eyebrow: direction === 'rtl' ? 'החנות' : 'Shop',
      headline: direction === 'rtl' ? 'כל האובייקטים' : 'All objects',
      subtitle: direction === 'rtl' ? 'בחירה מוקפדת' : 'A considered selection',
      products: [
        { id: 'stone-lamp', name: 'Stone Table Lamp', price: '$180' },
        { id: 'oak-tray', name: 'Smoked Oak Tray', price: '$95' },
      ],
    },
    assetIds: ['asset-product-a', 'asset-product-b'],
    assetBindings: {
      prod_0: 'asset-product-a',
      prod_1: 'asset-product-b',
    },
  });

  const productDetails = readySection({
    id: 'product-details',
    name: 'Product Details',
    componentRegistryId: 'ecommerce-detail-accordion-01',
    purpose: 'Product specifications',
    order: 2,
    motionPreset: 'none',
    content: {
      productName: 'Stone Table Lamp',
      price: '$180',
      description: 'Natural stone, hand finished.',
      accordionItems: [
        { title: 'Materials', content: 'Natural stone and linen.' },
        { title: 'Care', content: 'Wipe with a soft dry cloth.' },
      ],
    },
    assetIds: [],
  });

  const cart = readySection({
    id: 'cart',
    name: 'Cart',
    componentRegistryId: 'ecommerce-cart-drawer-01',
    purpose: 'Cart and checkout',
    order: 1,
    motionPreset: 'none',
    content: {
      cartTitle: direction === 'rtl' ? 'הסל שלך' : 'Your cart',
      emptyMessage: direction === 'rtl' ? 'הסל ריק.' : 'Your cart is empty.',
      checkoutButtonLabel: direction === 'rtl' ? 'לתשלום' : 'Checkout',
    },
    assetIds: [],
  });

  const aboutHero = readySection({
    id: 'about-hero',
    name: 'About Hero',
    componentRegistryId: 'hero-minimal-luxury-01',
    purpose: 'Brand story introduction',
    order: 1,
    motionPreset: 'clipReveal',
    content: {
      kicker: direction === 'rtl' ? 'הסטודיו' : 'The studio',
      headline:
        direction === 'rtl' ? 'חומר, שימוש ופרטים לפני הכול' : 'Material, utility and detail before everything',
      description:
        direction === 'rtl'
          ? 'אנחנו בוחרים אובייקטים שנועדו לחיות איתם לאורך זמן.'
          : 'We select objects intended to be lived with for years.',
      primaryCtaLabel: direction === 'rtl' ? 'לחנות' : 'Shop the collection',
      primaryCtaHref: '/shop',
    },
    assetIds: [],
  });

  project.pages = [
    {
      id: 'home',
      name: direction === 'rtl' ? 'ראשי' : 'Home',
      slug: '/',
      purpose: 'Storefront home',
      sections: [productHero('home-product-hero', 1), reviews, faq, footer],
    },
    {
      id: 'shop',
      name: direction === 'rtl' ? 'חנות' : 'Shop',
      slug: '/shop',
      purpose: 'Collection catalog',
      sections: [productGrid],
    },
    {
      id: 'product',
      name: direction === 'rtl' ? 'מוצר' : 'Product',
      slug: '/product',
      purpose: 'Product template',
      sections: [productHero('product-hero', 1), productDetails],
    },
    {
      id: 'cart-page',
      name: direction === 'rtl' ? 'סל' : 'Cart',
      slug: '/cart',
      purpose: 'Cart',
      sections: [cart],
    },
    {
      id: 'about',
      name: direction === 'rtl' ? 'אודות' : 'About',
      slug: '/about',
      purpose: 'Brand story',
      sections: [aboutHero],
    },
  ];

  return project;
}

async function loadZip(result: { downloadId?: string }): Promise<JSZip> {
  assert(result.downloadId, 'Shopify exporter did not return downloadId.');
  const artifact = exportStore.get(result.downloadId);
  assert(artifact, 'Shopify ZIP is missing from exportStore.');
  return JSZip.loadAsync(artifact.buffer);
}

async function read(zip: JSZip, filename: string): Promise<string> {
  const file = zip.file(filename);
  assert(file, `Shopify ZIP missing ${filename}`);
  return file.async('text');
}

function schemaJson(liquid: string, filename: string): unknown {
  const match = liquid.match(/{% schema %}([\s\S]*?){% endschema %}/);
  assert(match, `${filename} is missing a Shopify section schema.`);
  try {
    return JSON.parse(match[1].trim());
  } catch (error) {
    throw new Error(
      `${filename} contains invalid schema JSON: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function run() {
  console.log('--- SHOPIFY EXPORT V1 VALIDATION ---');
  const canonical = canonicalRegistry();
  const ltr = makeShopifyProject('ltr');

  assert(
    validateProjectForExport(ltr, 'shopify', canonical).valid,
    'Valid Shopify project failed canonical export validation.'
  );
  assert(
    !validateProjectForExport(ltr, 'wordpress', canonical).valid,
    'Shopify project was incorrectly accepted by WordPress export.'
  );
  const business = createEmptyProject('business', 'business_website', 'Business');
  assert(
    !validateProjectForExport(business, 'shopify', canonical).valid,
    'Business project was incorrectly accepted by Shopify export.'
  );

  const rejected = canonical.map((component) =>
    component.id === 'hero-product-commerce-01'
      ? { ...component, status: 'rejected' as const }
      : component
  );
  assert(
    !validateProjectForExport(ltr, 'shopify', rejected).valid,
    'Rejected canonical Shopify component did not block export.'
  );

  const exporter = new ShopifyThemeExporter(canonical);
  const result = await exporter.export(ltr);
  assert(result.success, `Shopify export failed: ${result.message}`);
  assert(result.target === 'shopify', 'Shopify export result target is incorrect.');

  const zip = await loadZip(result);
  const required = [
    'layout/theme.liquid',
    'assets/theme.css',
    'assets/theme.js',
    'assets/natanel-studio-manifest.json',
    'config/settings_schema.json',
    'config/settings_data.json',
    'locales/en.default.json',
    'sections/ns-header.liquid',
    'sections/ns-footer.liquid',
    'sections/ns-product-hero.liquid',
    'sections/ns-product-grid.liquid',
    'sections/ns-product-details.liquid',
    'sections/ns-cart-main.liquid',
    'sections/ns-faq.liquid',
    'sections/ns-reviews.liquid',
    'sections/ns-main-page.liquid',
    'sections/ns-main-article.liquid',
    'sections/ns-main-blog.liquid',
    'sections/ns-list-collections.liquid',
    'sections/ns-contact.liquid',
    'sections/ns-search.liquid',
    'sections/ns-password.liquid',
    'sections/ns-custom-liquid.liquid',
    'sections/ns-404.liquid',
    'sections/header-group.json',
    'sections/footer-group.json',
    'snippets/ns-product-card.liquid',
    'templates/index.json',
    'templates/product.json',
    'templates/collection.json',
    'templates/cart.json',
    'templates/page.json',
    'templates/page.about.json',
    'templates/article.json',
    'templates/blog.json',
    'templates/list-collections.json',
    'templates/page.contact.json',
    'templates/password.json',
    'templates/search.json',
    'templates/gift_card.liquid',
    'templates/404.json',
  ];
  required.forEach((filename) => assert(zip.file(filename), `Shopify ZIP missing required file ${filename}.`));

  const layout = await read(zip, 'layout/theme.liquid');
  assert(layout.includes('{{ content_for_header }}'), 'theme.liquid is missing content_for_header.');
  assert(layout.includes('{{ content_for_layout }}'), 'theme.liquid is missing content_for_layout.');
  assert(layout.includes("{% sections 'header-group' %}"), 'theme.liquid is missing the header section group.');
  assert(layout.includes("{% sections 'footer-group' %}"), 'theme.liquid is missing the footer section group.');
  assert(!layout.includes("{% section 'ns-header' %}"), 'theme.liquid still uses legacy static header rendering.');
  assert(!layout.includes("{% section 'ns-footer' %}"), 'theme.liquid still uses legacy static footer rendering.');

  const settingsSchema = JSON.parse(await read(zip, 'config/settings_schema.json')) as Array<Record<string, unknown>>;
  JSON.parse(await read(zip, 'config/settings_data.json'));
  const themeInfo = settingsSchema.find((entry) => entry.name === 'theme_info') as Record<string, unknown> | undefined;
  assert(themeInfo, 'settings_schema.json is missing theme_info.');
  assert(typeof themeInfo.theme_documentation_url === 'string', 'theme_info is missing theme_documentation_url.');
  const supportMethods = ['theme_support_url', 'theme_support_email'].filter(
    (key) => typeof themeInfo[key] === 'string' && String(themeInfo[key]).trim().length > 0
  );
  assert(supportMethods.length === 1, 'theme_info must provide exactly one support URL/email.');

  const headerGroup = JSON.parse(await read(zip, 'sections/header-group.json')) as {
    type?: string;
    sections?: Record<string, { type?: string }>;
    order?: string[];
  };
  const footerGroup = JSON.parse(await read(zip, 'sections/footer-group.json')) as {
    type?: string;
    sections?: Record<string, { type?: string }>;
    order?: string[];
  };
  assert(headerGroup.type === 'header', 'header-group.json has the wrong group type.');
  assert(footerGroup.type === 'footer', 'footer-group.json has the wrong group type.');
  assert(Object.values(headerGroup.sections || {}).some((section) => section.type === 'ns-header'), 'Header group does not reference ns-header.');
  assert(Object.values(footerGroup.sections || {}).some((section) => section.type === 'ns-footer'), 'Footer group does not reference ns-footer.');
  JSON.parse(await read(zip, 'templates/index.json'));
  JSON.parse(await read(zip, 'templates/product.json'));
  JSON.parse(await read(zip, 'templates/collection.json'));
  JSON.parse(await read(zip, 'templates/cart.json'));
  JSON.parse(await read(zip, 'templates/page.about.json'));

  const manifest = JSON.parse(await read(zip, 'assets/natanel-studio-manifest.json')) as ExportManifest;
  assert(manifest.target === 'shopify', 'Shopify manifest target is incorrect.');
  assert(
    manifest.assetIdsUsed.includes('asset-product-a') && manifest.assetIdsUsed.includes('asset-product-b'),
    'Shopify manifest does not reflect actual localized assets.'
  );

  const localizedImages = Object.keys(zip.files).filter(
    (filename) =>
      filename.startsWith('assets/') &&
      /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(filename)
  );
  assert(localizedImages.length === 2, 'Shopify export did not localize the two used project assets.');

  const productHero = await read(zip, 'sections/ns-product-hero.liquid');
  assert(productHero.includes("{% form 'product', featured_product %}"), 'Product hero is not using a native Shopify product form.');
  assert(productHero.includes('selected_or_first_available_variant'), 'Product hero is missing variant-aware Shopify logic.');
  assert(productHero.includes('| asset_url'), 'Product hero does not support localized fallback theme assets.');
  assert(productHero.includes('payment_button'), 'Product hero is missing accelerated checkout support.');

  const productGrid = await read(zip, 'sections/ns-product-grid.liquid');
  assert(productGrid.includes('collections.all'), 'Product grid does not fall back to Shopify products.');
  assert(productGrid.includes("render 'ns-product-card'"), 'Product grid is not using the native product-card snippet.');

  const cart = await read(zip, 'sections/ns-cart-main.liquid');
  assert(cart.includes('cart.items'), 'Cart section does not use Shopify cart items.');
  assert(cart.includes('routes.cart_url'), 'Cart section does not use Shopify cart routes.');
  assert(cart.includes('name="checkout"'), 'Cart section is missing native checkout submission.');
  assert(cart.includes('content_for_additional_checkout_buttons'), 'Cart is missing accelerated checkout buttons.');
  assert(cart.includes('line_level_discount_allocations'), 'Cart is missing line-level discount rendering.');
  assert(cart.includes('cart_level_discount_applications'), 'Cart is missing cart-level discount rendering.');

  const aboutTemplate = JSON.parse(await read(zip, 'templates/page.about.json')) as {
    sections: Record<string, { type: string }>;
  };
  const aboutType = Object.values(aboutTemplate.sections)[0]?.type;
  assert(aboutType && !aboutType.startsWith('ns-product'), 'About page unexpectedly mapped to a commerce section.');
  const aboutLiquid = await read(zip, `sections/${aboutType}.liquid`);
  assert(
    aboutLiquid.includes('Material, utility and detail before everything'),
    'Static Shopify section did not preserve exact approved Studio content.'
  );

  const customLiquidSchema = schemaJson(await read(zip, 'sections/ns-custom-liquid.liquid'), 'sections/ns-custom-liquid.liquid') as {
    settings?: Array<{ type?: string }>;
  };
  assert(
    customLiquidSchema.settings?.some((setting) => setting.type === 'liquid'),
    'Custom Liquid section does not expose a liquid setting.'
  );

  for (const [filename, entry] of Object.entries(zip.files)) {
    if (entry.dir || !filename.startsWith('sections/') || !filename.endsWith('.liquid')) continue;
    schemaJson(await entry.async('text'), filename);
  }

  const templateFiles = Object.keys(zip.files).filter(
    (filename) => filename.startsWith('templates/') && filename.endsWith('.json')
  );
  for (const filename of templateFiles) {
    const template = JSON.parse(await read(zip, filename)) as {
      sections?: Record<string, { type?: string }>;
    };
    for (const section of Object.values(template.sections || {})) {
      if (!section.type) continue;
      assert(
        zip.file(`sections/${section.type}.liquid`),
        `${filename} references missing section type ${section.type}.`
      );
    }
  }

  for (const [groupFilename, group] of [
    ['sections/header-group.json', headerGroup],
    ['sections/footer-group.json', footerGroup],
  ] as const) {
    for (const section of Object.values(group.sections || {})) {
      if (!section.type) continue;
      assert(zip.file(`sections/${section.type}.liquid`), `${groupFilename} references missing section type ${section.type}.`);
    }
  }

  const forbidden = [
    'images.unsplash.com',
    'Verified Studio Asset',
    'GEMINI_API_KEY',
    'FIREBASE_CONFIG',
    '/api/ai/',
    '/api/export/',
    '__NS_SHOPIFY_ASSET__',
    'studio@natanel.design',
    'atelier@natanel.design',
    '03-555-0199',
    '03-555-1234',
    '1-800-555-0199',
    '054-456-7890',
    '+972-54-456-7890',
    'SUMMER MMXXVI',
  ];
  for (const [filename, entry] of Object.entries(zip.files)) {
    if (entry.dir || !/\.(liquid|json|css|js|txt)$/i.test(filename)) continue;
    const text = await entry.async('text');
    for (const marker of forbidden) {
      assert(!text.includes(marker), `${filename} contains forbidden export marker ${marker}.`);
    }
  }

  const rtl = makeShopifyProject('rtl');
  assert(
    validateProjectForExport(rtl, 'shopify', canonical).valid,
    'Valid Hebrew RTL Shopify project failed validation.'
  );
  const rtlResult = await new ShopifyThemeExporter(canonical).export(rtl);
  assert(rtlResult.success, `RTL Shopify export failed: ${rtlResult.message}`);
  const rtlZip = await loadZip(rtlResult);
  assert(
    (await read(rtlZip, 'layout/theme.liquid')).includes('dir="rtl"'),
    'RTL Shopify layout did not preserve project direction.'
  );
  assert(rtlZip.file('locales/he.json'), 'RTL Shopify export is missing Hebrew locale file.');

  const tooManySections = makeShopifyProject('ltr');
  const sourceSection = tooManySections.pages[4].sections[0];
  tooManySections.pages[4].sections = Array.from({ length: 26 }, (_, index) => ({
    ...sourceSection,
    id: `too-many-${index + 1}`,
    order: index + 1,
  }));
  const tooManyValidation = validateProjectForExport(tooManySections, 'shopify', canonical);
  assert(!tooManyValidation.valid, 'Shopify page with 26 body sections incorrectly passed validation.');
  assert(
    tooManyValidation.issues.some((issue) => issue.code === 'shopify_template_section_limit'),
    'Shopify section-count overflow did not produce the expected validation issue.'
  );

  const unsupportedInteractive = makeShopifyProject('ltr');
  unsupportedInteractive.pages[4].sections = [
    readySection({
      id: 'interactive-slider',
      name: 'Interactive Before After',
      componentRegistryId: 'portfolio-before-after-01',
      purpose: 'Interactive comparison',
      order: 1,
      motionPreset: 'none',
      content: { title: 'Before and after', subtitle: 'Comparison' },
      assetIds: [],
    }),
  ];
  const interactiveValidation = validateProjectForExport(unsupportedInteractive, 'shopify', canonical);
  assert(!interactiveValidation.valid, 'Unsupported React-only Shopify interaction incorrectly passed validation.');
  assert(
    interactiveValidation.issues.some((issue) => issue.code === 'shopify_interactive_component_unsupported'),
    'Unsupported Shopify interaction did not produce the expected validation issue.'
  );

  const remoteFailure = makeShopifyProject('ltr');
  remoteFailure.assets[0].outputUrl = 'https://assets.example.com/missing.png';
  const remoteFailureResult = await new ShopifyThemeExporter(canonical, {
    resolveHostname: async () => ['93.184.216.34'],
    fetchImpl: (async () => new Response('missing', { status: 404 })) as typeof fetch,
  }).export(remoteFailure);
  assert(!remoteFailureResult.success, 'Failed required remote Shopify asset did not block export.');
  assert(
    remoteFailureResult.validation.issues.some((issue) => issue.code === 'asset_localization_failed'),
    'Failed Shopify asset localization did not produce a structured export issue.'
  );

  console.log('Shopify Export V1 validation PASSED.');
}

run().catch((error) => {
  console.error('Shopify Export V1 validation FAILED.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
