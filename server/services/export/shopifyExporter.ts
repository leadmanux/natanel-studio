import JSZip from 'jszip';
import type { Project, SitePage, SiteSection } from '../../../shared/project';
import type { ComponentDefinition } from '../../../shared/componentRegistry';
import type { ExportResult, ExportValidation, SiteExporter } from '../../../shared/exportTypes';
import { validateProjectForExport } from '../../../shared/exportValidation';
import { resolveSectionAssets } from '../../../shared/assetBinding';
import { compileProjectDesignTokens } from '../../../src/studio-components/designTokenCompiler';
import {
  collectAndProcessExportAssets,
  ExportAssetError,
  type ExportAssetFetchOptions,
  type CollectedProjectAssets,
} from './exportAssetHelper';
import { createExportManifest } from './exportManifest';
import {
  ExportSectionRenderError,
  renderExactExportSection,
} from './renderExportSection';
import { exportStore } from './exportStore';

const ASSET_TOKEN_PREFIX = '__NS_SHOPIFY_ASSET__';
const ASSET_TOKEN_SUFFIX = '__';

type ShopifySettingValue = string | number | boolean;

interface ShopifyTemplateSection {
  type: string;
  settings?: Record<string, ShopifySettingValue>;
  blocks?: Record<string, { type: string; settings: Record<string, ShopifySettingValue> }>;
  block_order?: string[];
}

interface ShopifyTemplate {
  sections: Record<string, ShopifyTemplateSection>;
  order: string[];
}

interface SectionBuildContext {
  zip: JSZip;
  project: Project;
  page: SitePage;
  canonicalComponents: ComponentDefinition[];
  componentLookup: Map<string, ComponentDefinition>;
  processedAssets: CollectedProjectAssets;
  emittedStaticTypes: Set<string>;
}

/**
 * Shopify Online Store 2.0 exporter.
 *
 * Platform-neutral Studio sections remain canonical. Most approved sections are
 * server-rendered through the exact Studio production implementation and emitted
 * as safe Liquid sections. Commerce-critical sections are mapped to native Shopify
 * Liquid so product, collection, cart, and checkout behavior uses Shopify objects.
 */
export class ShopifyThemeExporter implements SiteExporter {
  id = 'shopify' as const;
  name = 'Shopify Online Store 2.0 Theme';

  constructor(
    private canonicalComponents: ComponentDefinition[],
    private assetFetchOptions: ExportAssetFetchOptions = {}
  ) {}

  canExport(project: Project): boolean {
    return project.projectType === 'shopify';
  }

  async validate(project: Project) {
    return validateProjectForExport(project, 'shopify', this.canonicalComponents);
  }

  async export(project: Project): Promise<ExportResult> {
    let validation = await this.validate(project);
    const generatedAt = new Date().toISOString();
    const safeSlug = sanitizeHandle(project.business.businessName || project.name || 'store');
    const filename = `${safeSlug}-shopify-theme.zip`;
    const compiledTokens = compileProjectDesignTokens(project.designSystem, {
      industry: project.business.industry,
      themeMode: 'dark',
      density: project.brand.contentDensity || project.designSystem.density,
      direction: project.business.direction,
    });
    let manifest = createExportManifest(project, 'shopify', generatedAt, [], compiledTokens.tokens, 'dark');

    if (!validation.valid) {
      return failedResult(filename, generatedAt, validation, manifest, 'Shopify export validation failed.');
    }

    try {
      const processedAssets = await collectAndProcessExportAssets(
        project,
        this.canonicalComponents,
        this.assetFetchOptions
      );
      manifest = createExportManifest(
        project,
        'shopify',
        generatedAt,
        processedAssets.assets.map((asset) => asset.id),
        compiledTokens.tokens,
        'dark'
      );

      const zip = new JSZip();
      const componentLookup = new Map(this.canonicalComponents.map((component) => [component.id, component]));

      writeThemeFoundation(zip, project, safeSlug, compiledTokens.tokens, manifest);

      const assetsFolder = zip.folder('assets');
      for (const asset of processedAssets.assets) {
        assetsFolder?.file(asset.filename, asset.buffer);
      }

      writeNativeCommerceSections(zip, project);
      writeNativeUtilitySections(zip);

      const orderedEntries = project.pages.flatMap((page) =>
        [...page.sections]
          .sort((a, b) => a.order - b.order)
          .map((section) => ({ page, section, component: componentLookup.get(section.componentRegistryId) }))
      );

      const headerEntry = orderedEntries.find((entry) => entry.component?.category === 'navigation');
      const footerEntry = orderedEntries.find((entry) => entry.component?.category === 'footer');

      zip.file('sections/ns-header.liquid', buildNativeHeader(project, headerEntry?.section));
      zip.file('sections/ns-footer.liquid', buildNativeFooter(project, footerEntry?.section));

      const emittedStaticTypes = new Set<string>();
      const reservedTemplateKinds = new Set<'product' | 'collection' | 'cart'>();
      let wroteIndex = false;

      for (const page of project.pages) {
        const template = buildTemplateForPage({
          zip,
          project,
          page,
          canonicalComponents: this.canonicalComponents,
          componentLookup,
          processedAssets,
          emittedStaticTypes,
        });

        const preferredKind = classifyShopifyPage(page, componentLookup);
        if (page.slug === '/' || !wroteIndex) {
          if (!wroteIndex) {
            zip.file('templates/index.json', JSON.stringify(template, null, 2));
            wroteIndex = true;
            if (page.slug === '/') continue;
          }
        }

        if (
          (preferredKind === 'product' || preferredKind === 'collection' || preferredKind === 'cart') &&
          !reservedTemplateKinds.has(preferredKind)
        ) {
          zip.file(`templates/${preferredKind}.json`, JSON.stringify(template, null, 2));
          reservedTemplateKinds.add(preferredKind);
          continue;
        }

        const pageHandle = page.slug === '/' ? 'home-copy' : sanitizeHandle(page.slug.replace(/^\//, '') || page.name);
        zip.file(`templates/page.${pageHandle}.json`, JSON.stringify(template, null, 2));
      }

      if (!wroteIndex) {
        zip.file('templates/index.json', JSON.stringify(emptyTemplate('ns-main-page'), null, 2));
      }
      if (!reservedTemplateKinds.has('product')) {
        zip.file(
          'templates/product.json',
          JSON.stringify(
            templateFromEntries([
              ['product', { type: 'ns-product-hero', settings: {} }],
              ['details', { type: 'ns-product-details', settings: {} }],
            ]),
            null,
            2
          )
        );
      }
      if (!reservedTemplateKinds.has('collection')) {
        zip.file(
          'templates/collection.json',
          JSON.stringify(templateFromEntries([['collection', { type: 'ns-product-grid', settings: { products_to_show: 8 } }]]), null, 2)
        );
      }
      if (!reservedTemplateKinds.has('cart')) {
        zip.file(
          'templates/cart.json',
          JSON.stringify(templateFromEntries([['cart', { type: 'ns-cart-main', settings: {} }]]), null, 2)
        );
      }

      zip.file('templates/page.json', JSON.stringify(emptyTemplate('ns-main-page'), null, 2));
      zip.file('templates/404.json', JSON.stringify(emptyTemplate('ns-404'), null, 2));

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const downloadId = `${project.id}-shopify-${Date.now()}`;
      exportStore.set(downloadId, { buffer: zipBuffer, filename, mimeType: 'application/zip' });

      return {
        success: true,
        target: 'shopify',
        filename,
        mimeType: 'application/zip',
        downloadUrl: `/api/export/download/${downloadId}`,
        downloadId,
        generatedAt,
        validation,
        manifest,
        message: 'Shopify Online Store 2.0 theme generated successfully.',
      };
    } catch (error) {
      validation = appendRuntimeError(validation, error);
      return failedResult(
        filename,
        generatedAt,
        validation,
        manifest,
        error instanceof Error ? error.message : 'Shopify theme export failed.'
      );
    }
  }
}

function buildTemplateForPage(context: SectionBuildContext): ShopifyTemplate {
  const sections: Record<string, ShopifyTemplateSection> = {};
  const order: string[] = [];
  let index = 0;

  for (const section of [...context.page.sections].sort((a, b) => a.order - b.order)) {
    const component = context.componentLookup.get(section.componentRegistryId);
    if (!component) {
      throw new ExportSectionRenderError(
        context.page.id,
        section.id,
        section.componentRegistryId,
        `Canonical component "${section.componentRegistryId}" disappeared while generating Shopify template.`
      );
    }

    if (component.category === 'navigation' || component.category === 'footer') continue;

    const key = `s${++index}`;
    const entry = buildTemplateSection(section, context);
    sections[key] = entry;
    order.push(key);
  }

  if (!order.length) {
    sections.main = { type: 'ns-main-page', settings: {} };
    order.push('main');
  }

  return { sections, order };
}

function buildTemplateSection(section: SiteSection, context: SectionBuildContext): ShopifyTemplateSection {
  const content = section.content || {};

  switch (section.componentRegistryId) {
    case 'hero-product-commerce-01':
      return {
        type: 'ns-product-hero',
        settings: {
          eyebrow: asString(content.tagline),
          fallback_title: asString(content.productName),
          fallback_description: asString(content.description),
          fallback_price: asString(content.price),
          fallback_compare_at: asString(content.originalPrice),
          cta_label: asString(content.ctaText) || defaultLabel(context.project, 'Add to cart', 'הוספה לסל'),
          shipping_note: asString(content.shippingNote),
          fallback_asset: firstSectionAssetFilename(section, context),
        },
      };

    case 'ecommerce-product-grid-01':
      return {
        type: 'ns-product-grid',
        settings: {
          eyebrow: asString(content.eyebrow),
          heading: asString(content.title ?? content.headline),
          subtitle: asString(content.subtitle),
          products_to_show: clampInt(Array.isArray(content.products) ? content.products.length : 8, 2, 16),
        },
      };

    case 'ecommerce-detail-accordion-01': {
      const items = asRecordArray(content.accordionItems);
      return {
        type: 'ns-product-details',
        settings: {
          heading: asString(content.productName) || defaultLabel(context.project, 'Product details', 'פרטי מוצר'),
        },
        ...blocksFromItems(items, 'detail', (item) => ({
          heading: asString(item.title),
          text: asString(item.content),
        })),
      };
    }

    case 'ecommerce-cart-drawer-01':
      return {
        type: 'ns-cart-main',
        settings: {
          heading: asString(content.drawerTitle ?? content.cartTitle) || defaultLabel(context.project, 'Your cart', 'הסל שלך'),
          empty_message: asString(content.emptyMessage) || defaultLabel(context.project, 'Your cart is empty.', 'הסל עדיין ריק.'),
          checkout_label: asString(content.checkoutButtonText ?? content.checkoutButtonLabel) || defaultLabel(context.project, 'Checkout', 'לתשלום'),
          shipping_note: asString(content.shippingNote),
        },
      };

    case 'forms-faq-accordion-01': {
      const items = asRecordArray(content.faqs ?? content.items);
      return {
        type: 'ns-faq',
        settings: {
          eyebrow: asString(content.eyebrow),
          heading: asString(content.title ?? content.headline),
        },
        ...blocksFromItems(items, 'faq', (item) => ({
          question: asString(item.question),
          answer: asString(item.answer),
        })),
      };
    }

    case 'testimonials-review-carousel-01': {
      const reviews = asRecordArray(content.reviews);
      return {
        type: 'ns-reviews',
        settings: {
          heading: asString(content.title),
          subtitle: asString(content.subtitle),
        },
        ...blocksFromItems(reviews, 'review', (item) => ({
          author: asString(item.author),
          review: asString(item.reviewText ?? item.quote),
          rating: clampInt(Number(item.rating) || 5, 1, 5),
          meta: asString(item.projectType ?? item.verifiedDate),
        })),
      };
    }

    default: {
      const type = uniqueStaticType(context.page, section);
      if (!context.emittedStaticTypes.has(type)) {
        const liquid = buildStaticSectionLiquid(section, context);
        context.zip.file(`sections/${type}.liquid`, liquid);
        context.emittedStaticTypes.add(type);
      }
      return { type, settings: {} };
    }
  }
}

function buildStaticSectionLiquid(section: SiteSection, context: SectionBuildContext): string {
  const rendered = renderExactExportSection(
    section,
    context.page,
    context.project,
    context.canonicalComponents,
    (sourceUrl) => {
      const filename = context.processedAssets.urlToFilenameMap.get(sourceUrl);
      if (!filename) {
        throw new Error(`Localized Shopify asset mapping missing for section "${section.id}".`);
      }
      return `${ASSET_TOKEN_PREFIX}${filename}${ASSET_TOKEN_SUFFIX}`;
    }
  );

  let html = rendered.html;
  for (const asset of context.processedAssets.assets) {
    const token = `${ASSET_TOKEN_PREFIX}${asset.filename}${ASSET_TOKEN_SUFFIX}`;
    html = html.split(token).join(`{{ '${escapeLiquidString(asset.filename)}' | asset_url }}`);
  }
  html = rewriteInternalLinksForShopify(html, context.project);

  const schema = {
    name: truncate(section.name || 'Studio section', 25),
    settings: [],
    presets: [{ name: truncate(section.name || 'Studio section', 25) }],
  };

  return `<div class="studio-export-motion" data-studio-motion="${escapeHtml(rendered.motionPreset)}" data-component-id="${escapeHtml(section.componentRegistryId)}">
${html}
</div>
{% schema %}
${JSON.stringify(schema, null, 2)}
{% endschema %}
`;
}

function writeThemeFoundation(
  zip: JSZip,
  project: Project,
  safeSlug: string,
  tokens: ReturnType<typeof compileProjectDesignTokens>['tokens'],
  manifest: ReturnType<typeof createExportManifest>
) {
  zip.file('layout/theme.liquid', buildThemeLayout(project));
  zip.file(
    'sections/header-group.json',
    JSON.stringify(
      { type: 'header', name: 'Header group', sections: { header: { type: 'ns-header', settings: {} } }, order: ['header'] },
      null,
      2
    )
  );
  zip.file(
    'sections/footer-group.json',
    JSON.stringify(
      { type: 'footer', name: 'Footer group', sections: { footer: { type: 'ns-footer', settings: {} } }, order: ['footer'] },
      null,
      2
    )
  );
  zip.file('assets/theme.css', buildThemeCss(project, tokens));
  zip.file('assets/theme.js', buildThemeJs());
  zip.file('assets/natanel-studio-manifest.json', JSON.stringify(manifest, null, 2));
  zip.file('config/settings_schema.json', JSON.stringify(buildSettingsSchema(project, tokens), null, 2));
  zip.file('config/settings_data.json', JSON.stringify(buildSettingsData(tokens), null, 2));
  zip.file('locales/en.default.json', JSON.stringify(buildEnglishLocale(), null, 2));

  const language = (project.business.language || '').toLowerCase();
  if (project.business.direction === 'rtl' || language.includes('hebrew') || language.includes('עבר')) {
    zip.file('locales/he.json', JSON.stringify(buildHebrewLocale(), null, 2));
  }
  if (language.includes('french') || language.includes('fran')) {
    zip.file('locales/fr.json', JSON.stringify(buildFrenchLocale(), null, 2));
  }

  zip.file('snippets/ns-product-card.liquid', buildProductCardSnippet());
  zip.file('templates/article.json', JSON.stringify(emptyTemplate('ns-main-article'), null, 2));
  zip.file('templates/blog.json', JSON.stringify(emptyTemplate('ns-main-blog'), null, 2));
  zip.file('templates/list-collections.json', JSON.stringify(emptyTemplate('ns-list-collections'), null, 2));
  zip.file('templates/page.contact.json', JSON.stringify(emptyTemplate('ns-contact'), null, 2));
  zip.file('templates/password.json', JSON.stringify(emptyTemplate('ns-password'), null, 2));
  zip.file('templates/search.json', JSON.stringify(emptyTemplate('ns-search'), null, 2));
  zip.file('templates/gift_card.liquid', buildGiftCardTemplate(project));
  zip.file(
    'assets/natanel-studio-export.txt',
    `Natanel Studio Shopify export\nProject: ${project.name}\nTheme slug: ${safeSlug}\nGenerated theme uses Online Store 2.0 JSON templates and native Shopify product/cart objects.\n`
  );
}

function writeNativeCommerceSections(zip: JSZip, project: Project) {
  zip.file('sections/ns-product-hero.liquid', buildProductHeroLiquid(project));
  zip.file('sections/ns-product-grid.liquid', buildProductGridLiquid(project));
  zip.file('sections/ns-product-details.liquid', buildProductDetailsLiquid(project));
  zip.file('sections/ns-cart-main.liquid', buildCartLiquid(project));
  zip.file('sections/ns-reviews.liquid', buildReviewsLiquid(project));
}

function writeNativeUtilitySections(zip: JSZip) {
  zip.file('sections/ns-faq.liquid', buildFaqLiquid());
  zip.file('sections/ns-main-page.liquid', buildMainPageLiquid());
  zip.file('sections/ns-main-article.liquid', buildArticleLiquid());
  zip.file('sections/ns-main-blog.liquid', buildBlogLiquid());
  zip.file('sections/ns-list-collections.liquid', buildListCollectionsLiquid());
  zip.file('sections/ns-contact.liquid', buildContactLiquid());
  zip.file('sections/ns-search.liquid', buildSearchLiquid());
  zip.file('sections/ns-password.liquid', buildPasswordLiquid());
  zip.file('sections/ns-custom-liquid.liquid', buildCustomLiquid());
  zip.file('sections/ns-404.liquid', build404Liquid());
}

function buildThemeLayout(project: Project): string {
  const fallbackTitle = escapeHtml(project.business.businessName || project.name);
  const fallbackDescription = escapeHtml(project.business.description || '');
  const direction = project.business.direction;
  return `<!doctype html>
<html class="no-js" lang="{{ request.locale.iso_code | default: 'en' }}" dir="${direction}">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <link rel="canonical" href="{{ canonical_url }}">
  <title>{{ page_title | default: '${escapeLiquidString(fallbackTitle)}' }}{% unless page_title contains shop.name %} – {{ shop.name }}{% endunless %}</title>
  <meta name="description" content="{{ page_description | default: '${escapeLiquidString(fallbackDescription)}' | escape }}">
  {{ content_for_header }}
  {{ 'theme.css' | asset_url | stylesheet_tag }}
  <style>
    :root{
      --studio-bg:{{ settings.ns_color_background }};
      --studio-surface:{{ settings.ns_color_surface }};
      --studio-text:{{ settings.ns_color_text }};
      --studio-muted:{{ settings.ns_color_muted }};
      --studio-accent:{{ settings.ns_color_accent }};
      --studio-border:{{ settings.ns_color_border }};
    }
  </style>
</head>
<body class="template-{{ template.name | handle }}">
  <a class="ns-skip-link" href="#MainContent">{{ 'accessibility.skip_to_content' | t }}</a>
  {% sections 'header-group' %}
  <main id="MainContent" role="main" tabindex="-1">
    {{ content_for_layout }}
  </main>
  {% sections 'footer-group' %}
  <script src="{{ 'theme.js' | asset_url }}" defer></script>
</body>
</html>
`;
}

function buildSettingsSchema(
  project: Project,
  tokens: ReturnType<typeof compileProjectDesignTokens>['tokens']
): unknown[] {
  return [
    {
      name: 'theme_info',
      theme_name: truncate(project.business.businessName || 'Natanel Studio Export', 50),
      theme_author: 'Natanel Studio',
      theme_version: '1.0.0',
      theme_documentation_url: 'https://github.com/leadmanux/natanel-studio',
      theme_support_url: 'https://github.com/leadmanux/natanel-studio/issues',
    },
    {
      name: 'Design',
      settings: [
        { type: 'color', id: 'ns_color_background', label: 'Background', default: safeColor(tokens.bg, '#121214') },
        { type: 'color', id: 'ns_color_surface', label: 'Surface', default: safeColor(tokens.surface, '#19191c') },
        { type: 'color', id: 'ns_color_text', label: 'Text', default: safeColor(tokens.text, '#f4f4f2') },
        { type: 'color', id: 'ns_color_muted', label: 'Muted text', default: safeColor(tokens.muted, '#8e8e93') },
        { type: 'color', id: 'ns_color_accent', label: 'Accent', default: safeColor(tokens.accent, '#b89a68') },
        { type: 'color', id: 'ns_color_border', label: 'Border', default: safeColor(tokens.border, '#27272a') },
      ],
    },
  ];
}

function buildSettingsData(tokens: ReturnType<typeof compileProjectDesignTokens>['tokens']) {
  return {
    current: {
      ns_color_background: safeColor(tokens.bg, '#121214'),
      ns_color_surface: safeColor(tokens.surface, '#19191c'),
      ns_color_text: safeColor(tokens.text, '#f4f4f2'),
      ns_color_muted: safeColor(tokens.muted, '#8e8e93'),
      ns_color_accent: safeColor(tokens.accent, '#b89a68'),
      ns_color_border: safeColor(tokens.border, '#27272a'),
    },
    presets: {},
  };
}

function buildThemeCss(
  project: Project,
  tokens: ReturnType<typeof compileProjectDesignTokens>['tokens']
): string {
  return `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--studio-bg);color:var(--studio-text);font-family:${tokens.fontBody};-webkit-font-smoothing:antialiased}a{color:inherit}img{max-width:100%;height:auto}.ns-skip-link{position:absolute;left:-9999px}.ns-skip-link:focus{left:16px;top:16px;z-index:9999;background:var(--studio-bg);color:var(--studio-text);padding:10px 14px}.studio-export-motion{opacity:1;transform:none;clip-path:inset(0);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1),clip-path .65s cubic-bezier(.16,1,.3,1)}.studio-export-motion[data-studio-motion="fadeReveal"]:not(.is-visible),.studio-export-motion[data-studio-motion="textStagger"]:not(.is-visible){opacity:0;transform:translateY(16px)}.studio-export-motion[data-studio-motion="clipReveal"]:not(.is-visible){opacity:0;clip-path:inset(8% 0 0 0)}.studio-export-motion[data-studio-motion="imageScaleOnScroll"]:not(.is-visible){opacity:.95;transform:scale(1.05)}.studio-export-motion[data-studio-motion="stackedCards"]:not(.is-visible){opacity:0;transform:translateY(24px) scale(.98)}.studio-export-motion[data-studio-motion="fadeSettle"]:not(.is-visible){opacity:0}.studio-export-motion[data-studio-motion="none"]{opacity:1!important;transform:none!important;clip-path:none!important}.ns-shopify-header{padding:18px 24px;border-bottom:1px solid var(--studio-border);background:var(--studio-bg)}.ns-header-row{display:flex;align-items:center;justify-content:space-between;gap:24px}.ns-header-grid{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:24px}.ns-header-brand{display:inline-flex;flex-direction:column;align-items:center;gap:4px;text-decoration:none;font-family:${tokens.fontDisplay};font-weight:700}.ns-header-monogram{display:grid;place-items:center;width:32px;height:32px;border:1px solid var(--studio-accent);border-radius:50%;font-size:12px}.ns-header-links,.ns-header-actions,.ns-footer-links{display:flex;gap:18px;align-items:center;flex-wrap:wrap}.ns-header-links a,.ns-header-actions a,.ns-footer-links a,.ns-footer-contact a,.ns-footer-legal a{text-decoration:none}.ns-header-actions{justify-content:flex-end}.ns-header-mobile{display:none;position:relative}.ns-header-mobile summary{cursor:pointer;list-style:none;border:1px solid var(--studio-border);padding:8px 10px}.ns-header-mobile nav{position:absolute;${project.business.direction === 'rtl' ? 'left' : 'right'}:0;top:calc(100% + 8px);z-index:30;min-width:220px;padding:14px;background:var(--studio-bg);border:1px solid var(--studio-border);display:grid;gap:12px}.ns-shopify-footer{padding:38px 24px;border-top:1px solid var(--studio-border);background:var(--studio-bg)}.ns-footer-top,.ns-footer-legal{display:flex;justify-content:space-between;gap:18px;align-items:center;flex-wrap:wrap}.ns-footer-contact{margin-top:14px;color:var(--studio-muted)}.ns-footer-legal{margin-top:20px;padding-top:16px;border-top:1px solid var(--studio-border);font-size:12px;color:var(--studio-muted)}.ns-native-section{padding:var(--studio-section-space,96px) 24px;border-bottom:1px solid var(--studio-border)}.ns-container{width:min(1240px,100%);margin:0 auto}.ns-eyebrow{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--studio-accent);font-weight:700}.ns-heading{font-family:${tokens.fontDisplay};font-size:clamp(28px,4vw,48px);line-height:1.12;margin:8px 0 0}.ns-copy{color:var(--studio-muted);line-height:1.65}.ns-button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:13px 22px;border:0;border-radius:${tokens.radius};background:var(--studio-accent);color:#111;text-decoration:none;font-weight:700;cursor:pointer}.ns-button-secondary{background:transparent;color:var(--studio-text);border:1px solid var(--studio-border)}.ns-product-hero-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}.ns-product-media{aspect-ratio:4/5;background:var(--studio-surface);border:1px solid var(--studio-border);overflow:hidden;border-radius:${tokens.radius}}.ns-product-media img{width:100%;height:100%;object-fit:cover}.ns-product-details{display:grid;gap:18px}.ns-price{font-size:26px;font-weight:700}.ns-compare-price{margin-inline-start:10px;text-decoration:line-through;color:var(--studio-muted)}.ns-variant-select,.ns-qty{width:100%;max-width:380px;min-height:44px;background:var(--studio-surface);color:var(--studio-text);border:1px solid var(--studio-border);padding:10px 12px}.ns-product-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:22px}.ns-card{display:grid;gap:10px}.ns-card-media{aspect-ratio:3/4;background:var(--studio-surface);overflow:hidden;border:1px solid var(--studio-border)}.ns-card-media img{width:100%;height:100%;object-fit:cover}.ns-card-title{font-size:14px;margin:0}.ns-card-meta{font-size:12px;color:var(--studio-muted)}.ns-stack{display:grid;gap:14px}.ns-details{border:1px solid var(--studio-border);background:var(--studio-surface);padding:0 18px}.ns-details summary{cursor:pointer;padding:18px 0;font-weight:600}.ns-details-content{padding:0 0 18px;color:var(--studio-muted);line-height:1.65}.ns-cart-item{display:grid;grid-template-columns:88px 1fr auto;gap:16px;align-items:center;padding:16px 0;border-bottom:1px solid var(--studio-border)}.ns-cart-item img{width:88px;height:88px;object-fit:cover}.ns-cart-summary{display:flex;justify-content:space-between;gap:20px;align-items:center;margin-top:24px}.ns-reviews{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}.ns-review{padding:22px;border:1px solid var(--studio-border);background:var(--studio-surface)}.ns-dynamic-checkout{margin-top:10px;max-width:380px}.ns-contact-grid{display:grid;gap:14px;margin:24px 0}.ns-contact-grid label{display:grid;gap:7px;font-size:12px}.ns-contact-grid input,.ns-contact-grid textarea,.ns-search-input{width:100%;background:var(--studio-surface);color:var(--studio-text);border:1px solid var(--studio-border);padding:12px;font:inherit}.ns-search-input{max-width:520px;margin:18px 10px 18px 0}.ns-dynamic-checkout{margin-top:10px;max-width:380px}.ns-contact-grid{display:grid;gap:14px;margin:24px 0}.ns-contact-grid label{display:grid;gap:7px;font-size:12px}.ns-contact-grid input,.ns-contact-grid textarea,.ns-search-input{width:100%;background:var(--studio-surface);color:var(--studio-text);border:1px solid var(--studio-border);padding:12px;font:inherit}.ns-search-input{max-width:520px;margin:18px 10px 18px 0}.grid-split{grid-template-columns:1fr 1fr!important}.md-flex{display:flex!important}.md-hide{display:none!important}@media(max-width:900px){.ns-product-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.ns-reviews{grid-template-columns:1fr 1fr}}@media(max-width:760px){.grid-split,.ns-product-hero-grid{grid-template-columns:1fr!important}.md-flex{display:none!important}.md-hide{display:inline-flex!important}.ns-header-links{display:none}.ns-header-mobile{display:block}.ns-header-grid{grid-template-columns:1fr auto}.ns-header-grid>.ns-header-links-left{display:none}.ns-product-grid,.ns-reviews{grid-template-columns:1fr}.ns-cart-item{grid-template-columns:72px 1fr}.ns-cart-item> :last-child{grid-column:2}.ns-cart-summary{align-items:stretch;flex-direction:column}}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.studio-export-motion{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}}
`;
}

function buildThemeJs(): string {
  return `document.addEventListener('DOMContentLoaded',function(){var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var nodes=document.querySelectorAll('.studio-export-motion');if(reduced||!('IntersectionObserver'in window)){nodes.forEach(function(n){n.classList.add('is-visible')})}else{var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}})},{threshold:.08});nodes.forEach(function(n){if(n.getAttribute('data-studio-motion')==='none'){n.classList.add('is-visible')}else{io.observe(n)}})}var toggle=document.querySelector('[data-ns-menu-toggle]');var menu=document.querySelector('[data-ns-mobile-menu]');if(toggle&&menu){toggle.addEventListener('click',function(){var opening=menu.hasAttribute('hidden');if(opening){menu.removeAttribute('hidden')}else{menu.setAttribute('hidden','')}toggle.setAttribute('aria-expanded',String(opening))})}});
`;
}

function buildProductHeroLiquid(project: Project): string {
  const addLabel = defaultLabel(project, 'Add to cart', 'הוספה לסל');
  return `{% assign featured_product = product %}
{% if featured_product == blank and section.settings.product != blank %}
  {% assign featured_product = section.settings.product %}
{% endif %}
<section class="ns-native-section" data-component-id="hero-product-commerce-01">
  <div class="ns-container ns-product-hero-grid">
    <div class="ns-product-media">
      {% if featured_product != blank and featured_product.featured_image %}
        <img src="{{ featured_product.featured_image | image_url: width: 1200 }}" alt="{{ featured_product.featured_image.alt | default: featured_product.title | escape }}" width="{{ featured_product.featured_image.width }}" height="{{ featured_product.featured_image.height }}" loading="eager">
      {% elsif section.settings.fallback_asset != blank %}
        <img src="{{ section.settings.fallback_asset | asset_url }}" alt="{{ section.settings.fallback_title | escape }}" loading="eager">
      {% endif %}
    </div>
    <div class="ns-product-details">
      {% if section.settings.eyebrow != blank %}<div class="ns-eyebrow">{{ section.settings.eyebrow }}</div>{% endif %}
      <h1 class="ns-heading">{% if featured_product != blank %}{{ featured_product.title }}{% else %}{{ section.settings.fallback_title }}{% endif %}</h1>
      <div class="ns-copy">{% if featured_product != blank %}{{ featured_product.description | strip_html | truncatewords: 45 }}{% else %}{{ section.settings.fallback_description }}{% endif %}</div>
      <div>
        {% if featured_product != blank %}
          {% assign current_variant = featured_product.selected_or_first_available_variant %}
          <span class="ns-price">{{ current_variant.price | money }}</span>
          {% if current_variant.compare_at_price > current_variant.price %}<span class="ns-compare-price">{{ current_variant.compare_at_price | money }}</span>{% endif %}
        {% else %}
          <span class="ns-price">{{ section.settings.fallback_price }}</span>
          {% if section.settings.fallback_compare_at != blank %}<span class="ns-compare-price">{{ section.settings.fallback_compare_at }}</span>{% endif %}
        {% endif %}
      </div>
      {% if featured_product != blank %}
        {% form 'product', featured_product %}
          {% unless featured_product.has_only_default_variant %}
            <select class="ns-variant-select" name="id" aria-label="Variant">
              {% for variant in featured_product.variants %}
                <option value="{{ variant.id }}" {% if variant == current_variant %}selected{% endif %} {% unless variant.available %}disabled{% endunless %}>{{ variant.title }} – {{ variant.price | money }}</option>
              {% endfor %}
            </select>
          {% else %}
            <input type="hidden" name="id" value="{{ current_variant.id }}">
          {% endunless %}
          <input class="ns-qty" type="number" name="quantity" value="1" min="1" aria-label="Quantity">
          <button class="ns-button" type="submit" name="add" {% unless current_variant.available %}disabled{% endunless %}>{{ section.settings.cta_label | default: '${escapeLiquidString(addLabel)}' }}</button>
          <div class="ns-dynamic-checkout">{{ form | payment_button }}</div>
        {% endform %}
      {% endif %}
      {% if section.settings.shipping_note != blank %}<div class="ns-copy">{{ section.settings.shipping_note }}</div>{% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Product hero",
  "settings": [
    {"type":"product","id":"product","label":"Featured product"},
    {"type":"text","id":"eyebrow","label":"Eyebrow"},
    {"type":"text","id":"fallback_title","label":"Fallback title"},
    {"type":"textarea","id":"fallback_description","label":"Fallback description"},
    {"type":"text","id":"fallback_price","label":"Fallback price"},
    {"type":"text","id":"fallback_compare_at","label":"Fallback compare-at price"},
    {"type":"text","id":"cta_label","label":"Add to cart label","default":"${escapeJsonString(addLabel)}"},
    {"type":"text","id":"shipping_note","label":"Shipping note"},
    {"type":"text","id":"fallback_asset","label":"Fallback theme asset filename"}
  ],
  "presets":[{"name":"Product hero"}]
}
{% endschema %}
`;
}

function buildProductGridLiquid(project: Project): string {
  const quickAdd = defaultLabel(project, 'Quick add', 'הוספה מהירה');
  return `{% assign selected_collection = section.settings.collection %}
{% if selected_collection == blank %}{% assign selected_collection = collections.all %}{% endif %}
<section class="ns-native-section" data-component-id="ecommerce-product-grid-01">
  <div class="ns-container">
    {% if section.settings.eyebrow != blank %}<div class="ns-eyebrow">{{ section.settings.eyebrow }}</div>{% endif %}
    {% if section.settings.heading != blank %}<h2 class="ns-heading">{{ section.settings.heading }}</h2>{% endif %}
    {% if section.settings.subtitle != blank %}<p class="ns-copy">{{ section.settings.subtitle }}</p>{% endif %}
    <div class="ns-product-grid">
      {% for product in selected_collection.products limit: section.settings.products_to_show %}
        {% render 'ns-product-card', product: product, quick_add_label: '${escapeLiquidString(quickAdd)}' %}
      {% else %}
        <p class="ns-copy">{{ 'collections.general.no_matches' | t }}</p>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name":"Product grid",
  "settings":[
    {"type":"collection","id":"collection","label":"Collection"},
    {"type":"text","id":"eyebrow","label":"Eyebrow"},
    {"type":"text","id":"heading","label":"Heading"},
    {"type":"textarea","id":"subtitle","label":"Subtitle"},
    {"type":"range","id":"products_to_show","label":"Products to show","min":2,"max":16,"step":1,"default":8}
  ],
  "presets":[{"name":"Product grid"}]
}
{% endschema %}
`;
}

function buildProductDetailsLiquid(project: Project): string {
  const fallback = defaultLabel(project, 'Product details', 'פרטי מוצר');
  return `{% assign detail_product = product %}
{% if detail_product == blank and section.settings.product != blank %}{% assign detail_product = section.settings.product %}{% endif %}
<section class="ns-native-section" data-component-id="ecommerce-detail-accordion-01">
  <div class="ns-container" style="max-width:900px">
    <h2 class="ns-heading">{{ section.settings.heading | default: '${escapeLiquidString(fallback)}' }}</h2>
    {% if detail_product != blank and detail_product.description != blank %}
      <div class="ns-copy">{{ detail_product.description }}</div>
    {% endif %}
    <div class="ns-stack">
      {% for block in section.blocks %}
        {% case block.type %}
          {% when '@app' %}
            {% render block %}
          {% else %}
            <details class="ns-details" {{ block.shopify_attributes }}>
              <summary>{{ block.settings.heading }}</summary>
              <div class="ns-details-content">{{ block.settings.text | newline_to_br }}</div>
            </details>
        {% endcase %}
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name":"Product details",
  "settings":[
    {"type":"product","id":"product","label":"Product"},
    {"type":"text","id":"heading","label":"Heading","default":"${escapeJsonString(fallback)}"}
  ],
  "blocks":[
    {"type":"detail","name":"Detail","settings":[
      {"type":"text","id":"heading","label":"Heading"},
      {"type":"textarea","id":"text","label":"Text"}
    ]},
    {"type":"@app"}
  ],
  "presets":[{"name":"Product details"}]
}
{% endschema %}
`;
}

function buildCartLiquid(project: Project): string {
  const empty = defaultLabel(project, 'Your cart is empty.', 'הסל עדיין ריק.');
  const update = defaultLabel(project, 'Update cart', 'עדכון סל');
  const checkout = defaultLabel(project, 'Checkout', 'לתשלום');
  return `<section class="ns-native-section" data-component-id="ecommerce-cart-drawer-01">
  <div class="ns-container" style="max-width:900px">
    <h1 class="ns-heading">{{ section.settings.heading }}</h1>
    {% if cart.item_count == 0 %}
      <p class="ns-copy">{{ section.settings.empty_message | default: '${escapeLiquidString(empty)}' }}</p>
      <a class="ns-button" href="{{ routes.all_products_collection_url }}">{{ 'cart.general.continue_shopping' | t }}</a>
    {% else %}
      <form action="{{ routes.cart_url }}" method="post">
        {% for item in cart.items %}
          <div class="ns-cart-item">
            <a href="{{ item.url }}">{% if item.image %}<img src="{{ item.image | image_url: width: 220 }}" alt="{{ item.image.alt | default: item.product.title | escape }}" loading="lazy">{% endif %}</a>
            <div>
              <a href="{{ item.url }}"><strong>{{ item.product.title }}</strong></a>
              {% unless item.variant.title == 'Default Title' %}<div class="ns-card-meta">{{ item.variant.title }}</div>{% endunless %}
              <div>{{ item.final_line_price | money }}</div>
              {% for allocation in item.line_level_discount_allocations %}
                <div class="ns-card-meta">{{ allocation.discount_application.title }} (−{{ allocation.amount | money }})</div>
              {% endfor %}
            </div>
            <div>
              <input class="ns-qty" type="number" name="updates[]" value="{{ item.quantity }}" min="0" aria-label="Quantity for {{ item.product.title | escape }}">
            </div>
          </div>
        {% endfor %}
        {% if section.settings.shipping_note != blank %}<p class="ns-copy">{{ section.settings.shipping_note }}</p>{% endif %}
        {% for discount in cart.cart_level_discount_applications %}
          <p class="ns-copy">{{ discount.title }}: −{{ discount.total_allocated_amount | money }}</p>
        {% endfor %}
        <div class="ns-cart-summary">
          <div><span class="ns-card-meta">{{ 'cart.general.subtotal' | t }}</span><div class="ns-price">{{ cart.total_price | money }}</div></div>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <button class="ns-button ns-button-secondary" type="submit" name="update">${escapeHtml(update)}</button>
            <button class="ns-button" type="submit" name="checkout">{{ section.settings.checkout_label | default: '${escapeLiquidString(checkout)}' }}</button>
          </div>
        </div>
        {% if additional_checkout_buttons %}
          <div class="ns-dynamic-checkout">{{ content_for_additional_checkout_buttons }}</div>
        {% endif %}
      </form>
    {% endif %}
  </div>
</section>
{% schema %}
{
  "name":"Cart",
  "settings":[
    {"type":"text","id":"heading","label":"Heading","default":"Cart"},
    {"type":"text","id":"empty_message","label":"Empty cart message","default":"${escapeJsonString(empty)}"},
    {"type":"text","id":"checkout_label","label":"Checkout label","default":"${escapeJsonString(checkout)}"},
    {"type":"text","id":"shipping_note","label":"Shipping note"}
  ],
  "presets":[{"name":"Cart"}]
}
{% endschema %}
`;
}

function buildFaqLiquid(): string {
  return `<section class="ns-native-section" data-component-id="forms-faq-accordion-01">
  <div class="ns-container" style="max-width:900px">
    {% if section.settings.eyebrow != blank %}<div class="ns-eyebrow">{{ section.settings.eyebrow }}</div>{% endif %}
    {% if section.settings.heading != blank %}<h2 class="ns-heading">{{ section.settings.heading }}</h2>{% endif %}
    <div class="ns-stack">
      {% for block in section.blocks %}
        <details class="ns-details" {{ block.shopify_attributes }}>
          <summary>{{ block.settings.question }}</summary>
          <div class="ns-details-content">{{ block.settings.answer | newline_to_br }}</div>
        </details>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name":"FAQ",
  "settings":[
    {"type":"text","id":"eyebrow","label":"Eyebrow"},
    {"type":"text","id":"heading","label":"Heading"}
  ],
  "blocks":[
    {"type":"faq","name":"FAQ item","settings":[
      {"type":"text","id":"question","label":"Question"},
      {"type":"textarea","id":"answer","label":"Answer"}
    ]}
  ],
  "presets":[{"name":"FAQ"}]
}
{% endschema %}
`;
}

function buildReviewsLiquid(project: Project): string {
  const verified = defaultLabel(project, 'Verified review', 'ביקורת מאומתת');
  return `<section class="ns-native-section" data-component-id="testimonials-review-carousel-01">
  <div class="ns-container">
    {% if section.settings.heading != blank %}<h2 class="ns-heading">{{ section.settings.heading }}</h2>{% endif %}
    {% if section.settings.subtitle != blank %}<p class="ns-copy">{{ section.settings.subtitle }}</p>{% endif %}
    <div class="ns-reviews">
      {% for block in section.blocks %}
        <article class="ns-review" {{ block.shopify_attributes }}>
          <div aria-label="{{ block.settings.rating }} out of 5">★★★★★</div>
          <p>{{ block.settings.review }}</p>
          <strong>{{ block.settings.author }}</strong>
          <div class="ns-card-meta">{{ block.settings.meta | default: '${escapeLiquidString(verified)}' }}</div>
        </article>
      {% endfor %}
    </div>
  </div>
</section>
{% schema %}
{
  "name":"Reviews",
  "settings":[
    {"type":"text","id":"heading","label":"Heading"},
    {"type":"textarea","id":"subtitle","label":"Subtitle"}
  ],
  "blocks":[
    {"type":"review","name":"Review","settings":[
      {"type":"text","id":"author","label":"Author"},
      {"type":"textarea","id":"review","label":"Review"},
      {"type":"range","id":"rating","label":"Rating","min":1,"max":5,"step":1,"default":5},
      {"type":"text","id":"meta","label":"Meta"}
    ]}
  ],
  "presets":[{"name":"Reviews"}]
}
{% endschema %}
`;
}

function buildMainPageLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container" style="max-width:900px"><h1 class="ns-heading">{{ page.title }}</h1><div class="rte ns-copy">{{ page.content }}</div></div></section>
{% schema %}{"name":"Main page","settings":[],"presets":[{"name":"Main page"}]}{% endschema %}
`;
}

function buildArticleLiquid(): string {
  return `<article class="ns-native-section"><div class="ns-container" style="max-width:900px"><div class="ns-card-meta">{{ article.published_at | date: format: 'date' }}</div><h1 class="ns-heading">{{ article.title }}</h1><div class="rte ns-copy">{{ article.content }}</div></div></article>
{% schema %}{"name":"Article","settings":[],"presets":[{"name":"Article"}]}{% endschema %}
`;
}

function buildBlogLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container"><h1 class="ns-heading">{{ blog.title }}</h1><div class="ns-stack">{% for article in blog.articles %}<article class="ns-review"><div class="ns-card-meta">{{ article.published_at | date: format: 'date' }}</div><h2><a href="{{ article.url }}">{{ article.title }}</a></h2><p class="ns-copy">{{ article.excerpt_or_content | strip_html | truncatewords: 30 }}</p></article>{% endfor %}</div></div></section>
{% schema %}{"name":"Blog","settings":[],"presets":[{"name":"Blog"}]}{% endschema %}
`;
}

function buildListCollectionsLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container"><h1 class="ns-heading">Collections</h1><div class="ns-product-grid">{% for collection in collections %}<article class="ns-card"><a class="ns-card-media" href="{{ collection.url }}">{% if collection.featured_image %}<img src="{{ collection.featured_image | image_url: width: 900 }}" alt="{{ collection.featured_image.alt | default: collection.title | escape }}" loading="lazy">{% endif %}</a><h2 class="ns-card-title"><a href="{{ collection.url }}">{{ collection.title }}</a></h2></article>{% endfor %}</div></div></section>
{% schema %}{"name":"Collection list","settings":[],"presets":[{"name":"Collection list"}]}{% endschema %}
`;
}

function buildContactLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container" style="max-width:760px"><h1 class="ns-heading">{{ page.title }}</h1><div class="ns-copy">{{ page.content }}</div>{% form 'contact' %}{% if form.posted_successfully? %}<p role="status">Message sent.</p>{% endif %}{{ form.errors | default_errors }}<div class="ns-contact-grid"><label>Name<input type="text" name="contact[name]" value="{{ form.name }}"></label><label>Email<input type="email" name="contact[email]" value="{{ form.email }}" required></label><label>Phone<input type="tel" name="contact[phone]" value="{{ form.phone }}"></label><label>Message<textarea name="contact[body]" rows="6" required>{{ form.body }}</textarea></label></div><button class="ns-button" type="submit">Send</button>{% endform %}</div></section>
{% schema %}{"name":"Contact","settings":[],"presets":[{"name":"Contact"}]}{% endschema %}
`;
}

function buildSearchLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container"><h1 class="ns-heading">Search</h1><form action="{{ routes.search_url }}" method="get" role="search"><input class="ns-search-input" type="search" name="q" value="{{ search.terms | escape }}" placeholder="Search"><button class="ns-button" type="submit">Search</button></form>{% if search.performed %}<div class="ns-product-grid">{% for item in search.results %}<article class="ns-card"><h2 class="ns-card-title"><a href="{{ item.url }}">{{ item.title }}</a></h2><p class="ns-copy">{{ item.content | strip_html | truncatewords: 24 }}</p></article>{% endfor %}</div>{% endif %}</div></section>
{% schema %}{"name":"Search","settings":[],"presets":[{"name":"Search"}]}{% endschema %}
`;
}

function buildPasswordLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container" style="max-width:640px;text-align:center"><h1 class="ns-heading">{{ shop.name }}</h1>{% unless shop.password_message == blank %}<p class="ns-copy">{{ shop.password_message }}</p>{% endunless %}{% form 'storefront_password' %}{{ form.errors | default_errors }}<input class="ns-search-input" type="password" name="password" placeholder="Password" required><button class="ns-button" type="submit">Enter</button>{% endform %}</div></section>
{% schema %}{"name":"Password","settings":[]}{% endschema %}
`;
}

function buildCustomLiquid(): string {
  return `<section class="ns-native-section"><div class="ns-container">{{ section.settings.custom_liquid }}</div></section>
{% schema %}
{"name":"Custom Liquid","settings":[{"type":"liquid","id":"custom_liquid","label":"Custom Liquid"}],"presets":[{"name":"Custom Liquid"}]}
{% endschema %}
`;
}

function buildGiftCardTemplate(project: Project): string {
  return `<!doctype html><html lang="{{ request.locale.iso_code | default: 'en' }}" dir="${project.business.direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{{ content_for_header }}{{ 'theme.css' | asset_url | stylesheet_tag }}<title>{{ shop.name }}</title></head><body><main class="ns-native-section"><div class="ns-container" style="max-width:680px;text-align:center"><h1 class="ns-heading">{{ shop.name }}</h1><p class="ns-copy">{{ gift_card.balance | money }}</p><div>{{ gift_card.code | format_code }}</div>{% if gift_card.pass_url %}<a class="ns-button" href="{{ gift_card.pass_url }}">Add to Apple Wallet</a>{% endif %}</div></main></body></html>`;
}

function build404Liquid(): string {
  return `<section class="ns-native-section"><div class="ns-container" style="max-width:720px;text-align:center"><div class="ns-eyebrow">404</div><h1 class="ns-heading">{{ 'general.404.title' | t }}</h1><p class="ns-copy">{{ 'general.404.subtext' | t }}</p><a class="ns-button" href="{{ routes.root_url }}">{{ 'general.404.link' | t }}</a></div></section>
{% schema %}{"name":"404","settings":[]}{% endschema %}
`;
}

function buildProductCardSnippet(): string {
  return `{% assign card_variant = product.selected_or_first_available_variant %}
<article class="ns-card">
  <a class="ns-card-media" href="{{ product.url }}">
    {% if product.featured_image %}
      <img src="{{ product.featured_image | image_url: width: 800 }}" alt="{{ product.featured_image.alt | default: product.title | escape }}" loading="lazy">
    {% endif %}
  </a>
  <div class="ns-card-meta">{{ product.vendor }}</div>
  <h3 class="ns-card-title"><a href="{{ product.url }}">{{ product.title }}</a></h3>
  <div><strong>{{ card_variant.price | money }}</strong>{% if card_variant.compare_at_price > card_variant.price %}<span class="ns-compare-price">{{ card_variant.compare_at_price | money }}</span>{% endif %}</div>
  {% if card_variant.available %}
    {% form 'product', product %}
      <input type="hidden" name="id" value="{{ card_variant.id }}">
      <input type="hidden" name="quantity" value="1">
      <button class="ns-button" type="submit" name="add">{{ quick_add_label }}</button>
    {% endform %}
  {% endif %}
</article>
`;
}

function buildNativeHeader(project: Project, sourceSection?: SiteSection): string {
  const links = project.pages.map((page) => `<a href="${shopifyPageUrl(page)}">${escapeHtml(page.name)}</a>`).join('');
  const brand = escapeHtml(project.business.businessName || project.name);
  const monogram = escapeHtml(
    (project.business.businessName || project.name)
      .split(/\\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
  );
  const centered = sourceSection?.componentRegistryId === 'nav-centered-luxury-01';
  const componentId = escapeHtml(sourceSection?.componentRegistryId || 'shopify-native-header');
  return centered
    ? `<header class="ns-shopify-header ns-shopify-header-centered" data-component-id="${componentId}">
  <div class="ns-container ns-header-grid">
    <nav class="ns-header-links ns-header-links-left">${links}</nav>
    <a class="ns-header-brand" href="{{ routes.root_url }}"><span class="ns-header-monogram">${monogram}</span><span>${brand}</span></a>
    <div class="ns-header-actions"><a href="{{ routes.cart_url }}">${project.business.direction === 'rtl' ? 'סל' : 'Cart'} ({{ cart.item_count }})</a><details class="ns-header-mobile"><summary aria-label="Menu">☰</summary><nav>${links}<a href="{{ routes.cart_url }}">${project.business.direction === 'rtl' ? 'סל קניות' : 'Cart'}</a></nav></details></div>
  </div>
</header>
{% schema %}{"name":"Natanel Header","settings":[]}{% endschema %}
`
    : `<header class="ns-shopify-header" data-component-id="${componentId}">
  <div class="ns-container ns-header-row">
    <a class="ns-header-brand" href="{{ routes.root_url }}">${brand}</a>
    <nav class="ns-header-links">${links}</nav>
    <div class="ns-header-actions"><a href="{{ routes.cart_url }}">${project.business.direction === 'rtl' ? 'סל' : 'Cart'} ({{ cart.item_count }})</a><details class="ns-header-mobile"><summary aria-label="Menu">☰</summary><nav>${links}<a href="{{ routes.cart_url }}">${project.business.direction === 'rtl' ? 'סל קניות' : 'Cart'}</a></nav></details></div>
  </div>
</header>
{% schema %}{"name":"Natanel Header","settings":[]}{% endschema %}
`;
}

function buildNativeFooter(project: Project, sourceSection?: SiteSection): string {
  const brand = escapeHtml(project.business.businessName || project.name);
  const componentId = escapeHtml(sourceSection?.componentRegistryId || 'shopify-native-footer');
  const contact = [
    project.business.email ? `<a href="mailto:${escapeHtml(project.business.email)}">${escapeHtml(project.business.email)}</a>` : '',
    project.business.phone ? `<a href="tel:${escapeHtml(project.business.phone)}">${escapeHtml(project.business.phone)}</a>` : '',
  ].filter(Boolean).join('<span aria-hidden="true"> · </span>');
  const pageLinks = project.pages.map((page) => `<a href="${shopifyPageUrl(page)}">${escapeHtml(page.name)}</a>`).join('');
  return `<footer class="ns-shopify-footer" data-component-id="${componentId}">
  <div class="ns-container">
    <div class="ns-footer-top"><strong>${brand}</strong><nav class="ns-footer-links">${pageLinks}</nav></div>
    ${contact ? `<div class="ns-footer-contact">${contact}</div>` : ''}
    <div class="ns-footer-legal"><span>© {{ 'now' | date: '%Y' }} {{ shop.name }}</span><a href="{{ shop.privacy_policy.url }}">${project.business.direction === 'rtl' ? 'מדיניות פרטיות' : 'Privacy'}</a><a href="{{ shop.terms_of_service.url }}">${project.business.direction === 'rtl' ? 'תנאי שימוש' : 'Terms'}</a></div>
  </div>
</footer>
{% schema %}{"name":"Natanel Footer","settings":[]}{% endschema %}
`;
}

function classifyShopifyPage(
  page: SitePage,
  componentLookup: Map<string, ComponentDefinition>
): 'page' | 'product' | 'collection' | 'cart' {
  const text = `${page.name} ${page.slug} ${page.purpose}`.toLowerCase();
  const ids = new Set(page.sections.map((section) => section.componentRegistryId));

  if (ids.has('ecommerce-cart-drawer-01') || /(^|\s|\/)cart(\s|$)/.test(text)) return 'cart';
  if (
    ids.has('hero-product-commerce-01') ||
    ids.has('ecommerce-detail-accordion-01') ||
    /(^|\s|\/)product(\s|$)/.test(text)
  ) {
    return 'product';
  }
  if (
    (ids.has('ecommerce-product-grid-01') && /(collection|catalog|shop)/.test(text)) ||
    /(collection|catalog)/.test(text)
  ) {
    return 'collection';
  }

  for (const section of page.sections) {
    if (componentLookup.get(section.componentRegistryId)?.category === 'ecommerce' && /shop/.test(text)) {
      return 'collection';
    }
  }
  return 'page';
}

function shopifyPageUrl(page: SitePage): string {
  if (page.slug === '/') return '{{ routes.root_url }}';
  const handle = sanitizeHandle(page.slug.replace(/^\//, '') || page.name);
  const text = `${page.name} ${page.slug} ${page.purpose}`.toLowerCase();
  if (/(^|\s|\/)cart(\s|$)/.test(text)) return '{{ routes.cart_url }}';
  if (/(collection|catalog|shop)/.test(text)) return '{{ routes.all_products_collection_url }}';
  if (/(^|\s|\/)product(\s|$)/.test(text)) return '{{ routes.all_products_collection_url }}';
  return `/pages/${handle}`;
}

function rewriteInternalLinksForShopify(html: string, project: Project): string {
  let result = html;
  const pagesByLength = [...project.pages].sort((a, b) => b.slug.length - a.slug.length);
  for (const page of pagesByLength) {
    if (!page.slug) continue;
    const target = shopifyPageUrl(page);
    result = result.split(`href="${page.slug}"`).join(`href="${target}"`);
  }
  result = result.split('href="/cart"').join('href="{{ routes.cart_url }}"');
  result = result.split('href="/collections/all"').join('href="{{ routes.all_products_collection_url }}"');
  return result;
}

function firstSectionAssetFilename(section: SiteSection, context: SectionBuildContext): string {
  const component = context.componentLookup.get(section.componentRegistryId);
  if (!component) return '';
  const resolution = resolveSectionAssets(section, component, context.project.assets, context.page.id);
  const assetId = resolution.boundAssetIds[0];
  return assetId ? context.processedAssets.idToFilenameMap.get(assetId) || '' : '';
}

function blocksFromItems(
  items: Record<string, unknown>[],
  type: string,
  mapper: (item: Record<string, unknown>) => Record<string, ShopifySettingValue>
): Pick<ShopifyTemplateSection, 'blocks' | 'block_order'> {
  const blocks: NonNullable<ShopifyTemplateSection['blocks']> = {};
  const blockOrder: string[] = [];
  items.slice(0, 20).forEach((item, index) => {
    const key = `b${index + 1}`;
    blocks[key] = { type, settings: mapper(item) };
    blockOrder.push(key);
  });
  return { blocks, block_order: blockOrder };
}

function uniqueStaticType(page: SitePage, section: SiteSection): string {
  const raw = `ns-${sanitizeHandle(page.id)}-${sanitizeHandle(section.id)}`;
  return truncate(raw, 48).replace(/-+$/g, '') || 'ns-static-section';
}

function templateFromEntries(entries: Array<[string, ShopifyTemplateSection]>): ShopifyTemplate {
  return {
    sections: Object.fromEntries(entries),
    order: entries.map(([key]) => key),
  };
}

function emptyTemplate(type: string): ShopifyTemplate {
  return { sections: { main: { type, settings: {} } }, order: ['main'] };
}

function buildEnglishLocale() {
  return {
    accessibility: { skip_to_content: 'Skip to content' },
    collections: { general: { no_matches: 'No products found.' } },
    cart: {
      general: {
        subtotal: 'Subtotal',
        continue_shopping: 'Continue shopping',
      },
    },
    general: {
      '404': {
        title: 'Page not found',
        subtext: 'The page you requested does not exist.',
        link: 'Return home',
      },
    },
  };
}

function buildHebrewLocale() {
  return {
    accessibility: { skip_to_content: 'דלגו לתוכן' },
    collections: { general: { no_matches: 'לא נמצאו מוצרים.' } },
    cart: {
      general: {
        subtotal: 'סכום ביניים',
        continue_shopping: 'המשך בקניות',
      },
    },
    general: {
      '404': {
        title: 'העמוד לא נמצא',
        subtext: 'העמוד שביקשתם אינו קיים.',
        link: 'חזרה לעמוד הבית',
      },
    },
  };
}

function buildFrenchLocale() {
  return {
    accessibility: { skip_to_content: 'Aller au contenu' },
    collections: { general: { no_matches: 'Aucun produit trouvé.' } },
    cart: {
      general: {
        subtotal: 'Sous-total',
        continue_shopping: 'Continuer mes achats',
      },
    },
    general: {
      '404': {
        title: 'Page introuvable',
        subtext: "La page demandée n'existe pas.",
        link: "Retour à l'accueil",
      },
    },
  };
}

function appendRuntimeError(validation: ExportValidation, error: unknown): ExportValidation {
  const message = error instanceof Error ? error.message : String(error);
  const issue = {
    code:
      error instanceof ExportAssetError
        ? 'asset_localization_failed'
        : error instanceof ExportSectionRenderError
          ? 'section_render_failed'
          : 'shopify_export_runtime_failed',
    message,
    severity: 'error' as const,
    ...(error instanceof ExportSectionRenderError ? { pageId: error.pageId, sectionId: error.sectionId } : {}),
  };
  return {
    valid: false,
    errors: [...validation.errors, message],
    warnings: validation.warnings,
    issues: [...validation.issues, issue],
  };
}

function failedResult(
  filename: string,
  generatedAt: string,
  validation: ExportValidation,
  manifest: ReturnType<typeof createExportManifest>,
  message: string
): ExportResult {
  return {
    success: false,
    target: 'shopify',
    filename,
    mimeType: 'application/zip',
    generatedAt,
    validation,
    manifest,
    message,
  };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value == null ? '' : String(value);
}

function asRecordArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object' && !Array.isArray(item))
    : [];
}

function defaultLabel(project: Project, english: string, hebrew: string): string {
  return project.business.direction === 'rtl' ? hebrew : english;
}

function clampInt(value: number, min: number, max: number): number {
  const safe = Number.isFinite(value) ? Math.round(value) : min;
  return Math.max(min, Math.min(max, safe));
}

function safeColor(value: string, fallback: string): string {
  return /^#[0-9a-f]{6}$/i.test(value || '') ? value : fallback;
}

function sanitizeHandle(value: string): string {
  const normalized = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'page';
}

function truncate(value: string, max: number): string {
  return value.length <= max ? value : value.slice(0, max);
}

function escapeLiquidString(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

function escapeJsonString(value: string): string {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
}

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
