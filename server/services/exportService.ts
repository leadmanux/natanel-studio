import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';
import type { Project, ExportTarget, SitePage, SiteSection } from '../../shared/project';
import type { ComponentDefinition } from '../../shared/componentRegistry';
import { evaluateComponentEligibility } from '../../shared/componentEligibility';
import { canonicalComponentStore } from './canonicalComponentStore';

export interface ExportIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  pageId?: string;
  sectionId?: string;
}

export interface ExportValidationResult {
  valid: boolean;
  target: ExportTarget;
  issues: ExportIssue[];
}

export interface GeneratedExportArtifact {
  target: ExportTarget;
  filename: string;
  mimeType: string;
  buffer: Buffer;
  validation: ExportValidationResult;
}

const ZIP_MIME = 'application/zip';

function slugify(value: string, fallback = 'natanel-site'): string {
  const cleaned = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned || fallback;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function plainText(value: unknown): string {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  return '';
}

function firstString(content: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = content[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number') return String(value);
  }
  return '';
}

function sectionAssetUrl(project: Project, section: SiteSection): string {
  for (const id of section.assetIds || []) {
    const asset = project.assets.find((item) => item.id === id);
    if (asset?.outputUrl && (asset.status === 'approved' || asset.status === 'generated')) return asset.outputUrl;
  }
  return '';
}

function renderArray(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return '';
  const items = value.slice(0, 12).map((item) => {
    if (typeof item === 'string' || typeof item === 'number') {
      return `<li>${escapeHtml(item)}</li>`;
    }
    if (item && typeof item === 'object') {
      const object = item as Record<string, unknown>;
      const title = firstString(object, ['title', 'name', 'label', 'author', 'value']);
      const body = firstString(object, ['description', 'body', 'quote', 'context', 'subtitle', 'outcome']);
      return `<li><strong>${escapeHtml(title)}</strong>${body ? `<span>${escapeHtml(body)}</span>` : ''}</li>`;
    }
    return '';
  }).filter(Boolean).join('');
  return items ? `<ul class="ns-list">${items}</ul>` : '';
}

function renderSectionMarkup(project: Project, section: SiteSection): string {
  const content = section.content || {};
  const eyebrow = firstString(content, ['eyebrow', 'kicker', 'chapterLabel', 'tagline']);
  const heading = firstString(content, ['headline', 'title', 'statementHeadline', 'productName', 'brandName', 'formTitle']);
  const body = firstString(content, ['description', 'subheadline', 'body', 'subtitle', 'subtext', 'narrative', 'formSubtitle']);
  const cta = firstString(content, ['primaryCta', 'primaryCtaLabel', 'ctaLabel', 'ctaText', 'buttonLabel', 'ctaButtonLabel']);
  const href = firstString(content, ['primaryCtaHref', 'ctaHref', 'buttonHref']) || '#contact';
  const image = sectionAssetUrl(project, section);

  const arrays = Object.entries(content)
    .filter(([, value]) => Array.isArray(value))
    .map(([, value]) => renderArray(value))
    .filter(Boolean)
    .slice(0, 2)
    .join('');

  return `<section class="ns-section ns-${escapeHtml(section.componentRegistryId)}" data-component="${escapeHtml(section.componentRegistryId)}">
  <div class="ns-inner">
    ${image ? `<figure class="ns-media"><img src="${escapeHtml(image)}" alt="${escapeHtml(heading || section.name)}" loading="lazy"></figure>` : ''}
    <div class="ns-copy">
      ${eyebrow ? `<p class="ns-eyebrow">${escapeHtml(eyebrow)}</p>` : ''}
      ${heading ? `<h2>${escapeHtml(heading)}</h2>` : ''}
      ${body ? `<p class="ns-body">${escapeHtml(body)}</p>` : ''}
      ${arrays}
      ${cta ? `<a class="ns-button" href="${escapeHtml(href)}">${escapeHtml(cta)}</a>` : ''}
    </div>
  </div>
</section>`;
}

function renderPageMarkup(project: Project, page: SitePage): string {
  const sections = [...page.sections].sort((a, b) => a.order - b.order);
  return sections.map((section) => renderSectionMarkup(project, section)).join('\n');
}

function colorTokens(project: Project) {
  const candidates = [...project.designSystem.colors, ...project.brand.colors]
    .flatMap((value) => value.match(/#[0-9a-fA-F]{6}/g) || []);
  return {
    background: candidates[0] || '#f7f6f2',
    text: candidates[1] || '#141414',
    accent: candidates[2] || '#305b45',
    surface: candidates[3] || '#ffffff',
    border: candidates[4] || '#d9d7d0',
  };
}

function baseCss(project: Project): string {
  const colors = colorTokens(project);
  const rtl = project.business.direction === 'rtl';
  return `:root{--ns-bg:${colors.background};--ns-text:${colors.text};--ns-accent:${colors.accent};--ns-surface:${colors.surface};--ns-border:${colors.border};--ns-width:1180px;--ns-radius:${project.designSystem.borderRadius || '6px'};}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--ns-bg);color:var(--ns-text);font-family:Arial,Helvetica,sans-serif;direction:${rtl ? 'rtl' : 'ltr'}}img{max-width:100%;display:block}.ns-section{border-bottom:1px solid var(--ns-border);padding:clamp(56px,8vw,112px) 24px}.ns-inner{max-width:var(--ns-width);margin:0 auto;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr);gap:clamp(28px,5vw,72px);align-items:center}.ns-section:nth-child(even) .ns-media{order:2}.ns-copy{max-width:720px}.ns-eyebrow{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--ns-accent);font-weight:700}.ns-copy h2{font-size:clamp(34px,5vw,68px);line-height:1.02;letter-spacing:-.03em;margin:.2em 0}.ns-body{font-size:clamp(16px,1.5vw,20px);line-height:1.7;opacity:.76}.ns-media img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:var(--ns-radius)}.ns-button{display:inline-flex;margin-top:22px;padding:14px 22px;background:var(--ns-text);color:var(--ns-bg);text-decoration:none;border-radius:var(--ns-radius);font-weight:700}.ns-list{list-style:none;padding:0;margin:28px 0;display:grid;gap:12px}.ns-list li{padding:16px 0;border-top:1px solid var(--ns-border);display:flex;gap:12px;justify-content:space-between}.ns-list li span{opacity:.7}.ns-site-header,.ns-site-footer{max-width:var(--ns-width);margin:0 auto;padding:20px 24px;display:flex;align-items:center;justify-content:space-between;gap:20px}.ns-site-header a,.ns-site-footer a{color:inherit;text-decoration:none}.ns-brand{font-weight:800}.ns-nav{display:flex;gap:18px;flex-wrap:wrap;font-size:14px}@media(max-width:760px){.ns-inner{grid-template-columns:1fr}.ns-section:nth-child(even) .ns-media{order:0}.ns-copy h2{font-size:clamp(32px,10vw,48px)}.ns-nav{display:none}.ns-section{padding:56px 20px}}`;
}

async function copyDirectoryToZip(zip: JSZip, sourceDir: string, destination: string) {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist') continue;
    const source = path.join(sourceDir, entry.name);
    const target = `${destination}/${entry.name}`.replace(/\\/g, '/');
    if (entry.isDirectory()) {
      await copyDirectoryToZip(zip, source, target);
    } else if (/\.(ts|tsx|css|json)$/.test(entry.name)) {
      zip.file(target, await fs.readFile(source));
    }
  }
}

function wordpressTemplate(project: Project, page: SitePage): string {
  const body = renderPageMarkup(project, page);
  return `<!-- wp:html -->\n<div class="natanel-studio-page" dir="${project.business.direction}">\n${body}\n</div>\n<!-- /wp:html -->`;
}

function shopifySectionSettings(project: Project, section: SiteSection) {
  const content = section.content || {};
  return {
    component_id: section.componentRegistryId,
    eyebrow: firstString(content, ['eyebrow', 'kicker', 'chapterLabel', 'tagline']),
    heading: firstString(content, ['headline', 'title', 'statementHeadline', 'productName', 'brandName', 'formTitle']),
    body: firstString(content, ['description', 'subheadline', 'body', 'subtitle', 'subtext', 'narrative', 'formSubtitle']),
    button_label: firstString(content, ['primaryCta', 'primaryCtaLabel', 'ctaLabel', 'ctaText', 'buttonLabel', 'ctaButtonLabel']),
    button_link: firstString(content, ['primaryCtaHref', 'ctaHref', 'buttonHref']) || '',
    image_url: sectionAssetUrl(project, section),
  };
}

function shopifyTemplateForPage(project: Project, page: SitePage) {
  const sections: Record<string, unknown> = {};
  const order: string[] = [];
  [...page.sections].sort((a, b) => a.order - b.order).forEach((section, index) => {
    const id = `studio_${index + 1}`;
    sections[id] = { type: 'natanel-studio-section', settings: shopifySectionSettings(project, section) };
    order.push(id);
  });
  return { sections, order };
}

function shopifyStudioSection(): string {
  return `<section class="ns-section ns-{{ section.settings.component_id | handleize }}" data-component="{{ section.settings.component_id | escape }}">
  <div class="ns-inner">
    {% if section.settings.image_url != blank %}<figure class="ns-media"><img src="{{ section.settings.image_url | escape }}" alt="{{ section.settings.heading | escape }}" loading="lazy"></figure>{% endif %}
    <div class="ns-copy">
      {% if section.settings.eyebrow != blank %}<p class="ns-eyebrow">{{ section.settings.eyebrow }}</p>{% endif %}
      {% if section.settings.heading != blank %}<h2>{{ section.settings.heading }}</h2>{% endif %}
      {% if section.settings.body != blank %}<div class="ns-body">{{ section.settings.body | newline_to_br }}</div>{% endif %}
      {% if section.settings.button_label != blank %}<a class="ns-button" href="{{ section.settings.button_link | default: '#' }}">{{ section.settings.button_label }}</a>{% endif %}
    </div>
  </div>
</section>
{% schema %}
{
  "name": "Natanel Studio section",
  "settings": [
    { "type": "text", "id": "component_id", "label": "Component ID" },
    { "type": "text", "id": "eyebrow", "label": "Eyebrow" },
    { "type": "text", "id": "heading", "label": "Heading" },
    { "type": "textarea", "id": "body", "label": "Body" },
    { "type": "text", "id": "button_label", "label": "Button label" },
    { "type": "url", "id": "button_link", "label": "Button link" },
    { "type": "text", "id": "image_url", "label": "Generated image URL" }
  ],
  "presets": [{ "name": "Natanel Studio section" }]
}
{% endschema %}`;
}

function shopifyMainProduct(): string {
  return `<section class="ns-product"><div class="ns-product-grid">
  <div>{% if product.featured_image %}{{ product.featured_image | image_url: width: 1400 | image_tag: loading: 'eager', class: 'ns-product-image' }}{% endif %}</div>
  <div><p class="ns-eyebrow">{{ product.vendor }}</p><h1>{{ product.title }}</h1><div class="ns-price">{{ product.selected_or_first_available_variant.price | money }}</div><div class="ns-body">{{ product.description }}</div>
  {% form 'product', product %}<input type="hidden" name="id" value="{{ product.selected_or_first_available_variant.id }}"><label>Quantity<input name="quantity" type="number" min="1" value="1"></label><button class="ns-button" type="submit" {% unless product.selected_or_first_available_variant.available %}disabled{% endunless %}>{% if product.selected_or_first_available_variant.available %}Add to cart{% else %}Sold out{% endif %}</button>{% endform %}
  </div></div></section>
{% schema %}{"name":"Main product","settings":[],"presets":[{"name":"Main product"}]}{% endschema %}`;
}

function shopifyMainCollection(): string {
  return `<section class="ns-section"><div class="ns-collection"><h1>{{ collection.title }}</h1><div class="ns-product-cards">{% for product in collection.products %}<a href="{{ product.url }}" class="ns-product-card">{% if product.featured_image %}{{ product.featured_image | image_url: width: 700 | image_tag: loading: 'lazy' }}{% endif %}<strong>{{ product.title }}</strong><span>{{ product.price | money }}</span></a>{% endfor %}</div></div></section>
{% schema %}{"name":"Main collection","settings":[],"presets":[{"name":"Main collection"}]}{% endschema %}`;
}

function shopifyMainCart(): string {
  return `<section class="ns-section"><div class="ns-cart"><h1>Cart</h1>{% if cart.item_count == 0 %}<p>Your cart is empty.</p>{% else %}<form action="{{ routes.cart_url }}" method="post">{% for item in cart.items %}<div class="ns-cart-item"><a href="{{ item.url }}">{{ item.product.title }}</a><span>{{ item.final_line_price | money }}</span><input type="number" name="updates[]" value="{{ item.quantity }}" min="0"></div>{% endfor %}<button class="ns-button" type="submit" name="update">Update cart</button><button class="ns-button" type="submit" name="checkout">Checkout</button></form>{% endif %}</div></section>
{% schema %}{"name":"Main cart","settings":[],"presets":[{"name":"Main cart"}]}{% endschema %}`;
}

export class SiteExportService {
  async validate(project: Project, target: ExportTarget): Promise<ExportValidationResult> {
    await canonicalComponentStore.init();
    const issues: ExportIssue[] = [];

    if (target === 'managed') {
      issues.push({ code: 'managed_not_available', message: 'Managed deployment requires a configured hosting provider and is not enabled in this build.', severity: 'error' });
    }
    if (project.projectType === 'shopify' && target !== 'shopify') {
      issues.push({ code: 'target_mismatch', message: 'Shopify projects must export as a Shopify theme.', severity: 'error' });
    }
    if (project.projectType === 'business_website' && target === 'shopify') {
      issues.push({ code: 'target_mismatch', message: 'Business website projects cannot export as Shopify themes.', severity: 'error' });
    }
    if (!project.business.businessName.trim()) issues.push({ code: 'business_name_missing', message: 'Business name is required.', severity: 'error' });
    if (!project.pages.length) issues.push({ code: 'pages_missing', message: 'At least one composed page is required.', severity: 'error' });
    if (!project.designSystem.artDirection.trim()) issues.push({ code: 'art_direction_missing', message: 'Art direction is not approved; export will use fallback styling.', severity: 'warning' });

    for (const page of project.pages) {
      if (!page.sections.length) issues.push({ code: 'page_empty', message: `Page "${page.name}" has no sections.`, severity: 'warning', pageId: page.id });
      for (const section of page.sections) {
        const definition = canonicalComponentStore.getComponentById(section.componentRegistryId) as ComponentDefinition | undefined;
        if (!definition) {
          issues.push({ code: 'component_missing', message: `Component ${section.componentRegistryId} no longer exists in the canonical registry.`, severity: 'error', pageId: page.id, sectionId: section.id });
          continue;
        }
        const eligibility = evaluateComponentEligibility(definition, project);
        if (!eligibility.eligible) {
          issues.push({ code: 'component_ineligible', message: `${definition.name}: ${eligibility.reasons.join('; ')}`, severity: 'error', pageId: page.id, sectionId: section.id });
        }
        if (section.contentStatus !== 'ready') {
          issues.push({ code: 'section_not_ready', message: `${section.name} is ${section.contentStatus || 'not composed'}.`, severity: 'error', pageId: page.id, sectionId: section.id });
        }
        if (section.missingFactualFields?.length) {
          issues.push({ code: 'missing_facts', message: `${section.name} is missing verified facts: ${section.missingFactualFields.join(', ')}.`, severity: 'error', pageId: page.id, sectionId: section.id });
        }
        if (section.missingAssetRequirements?.length) {
          issues.push({ code: 'missing_assets', message: `${section.name} is missing required assets: ${section.missingAssetRequirements.join(', ')}.`, severity: 'error', pageId: page.id, sectionId: section.id });
        }
        if (!section.contentApproved) {
          issues.push({ code: 'content_not_approved', message: `${section.name} content has not been manually approved.`, severity: 'warning', pageId: page.id, sectionId: section.id });
        }
      }
    }

    return { valid: !issues.some((issue) => issue.severity === 'error'), target, issues };
  }

  async generate(project: Project, target: ExportTarget): Promise<GeneratedExportArtifact> {
    const validation = await this.validate(project, target);
    if (!validation.valid) {
      const error = new Error('Project is not export-ready.');
      (error as Error & { validation?: ExportValidationResult }).validation = validation;
      throw error;
    }

    const siteName = slugify(project.business.businessName || project.name);
    if (target === 'react') return this.buildReact(project, siteName, validation);
    if (target === 'wordpress') return this.buildWordPress(project, siteName, validation);
    if (target === 'shopify') return this.buildShopify(project, siteName, validation);
    throw new Error(`Export target ${target} is not configured.`);
  }

  private async buildReact(project: Project, siteName: string, validation: ExportValidationResult): Promise<GeneratedExportArtifact> {
    const zip = new JSZip();
    const root = zip.folder(`${siteName}-react`)!;
    root.file('package.json', JSON.stringify({
      name: `${siteName}-site`, private: true, version: '1.0.0', type: 'module',
      scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
      dependencies: { '@vitejs/plugin-react': '^5.0.0', 'lucide-react': '^0.468.0', motion: '^13.4.0', react: '^19.1.0', 'react-dom': '^19.1.0', zod: '^4.0.0', vite: '^7.0.0' },
      devDependencies: { '@types/react': '^19.1.0', '@types/react-dom': '^19.1.0', typescript: '^5.9.0' },
    }, null, 2));
    root.file('index.html', '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Natanel Studio Export</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>');
    root.file('tsconfig.json', JSON.stringify({ compilerOptions: { target: 'ES2022', lib: ['ES2022', 'DOM', 'DOM.Iterable'], module: 'ESNext', moduleResolution: 'Bundler', jsx: 'react-jsx', strict: true, skipLibCheck: true, resolveJsonModule: true, allowSyntheticDefaultImports: true, baseUrl: '.', paths: { '@shared/*': ['shared/*'] } }, include: ['src', 'shared'] }, null, 2));
    root.file('vite.config.ts', "import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nimport path from 'path';\nexport default defineConfig({ plugins:[react()], resolve:{ alias:{ '@shared': path.resolve(__dirname,'shared') } } });\n");
    root.file('src/project.json', JSON.stringify(project, null, 2));
    root.file('src/main.tsx', "import React from 'react';\nimport { createRoot } from 'react-dom/client';\nimport { App } from './App';\nimport './site.css';\ncreateRoot(document.getElementById('root')!).render(<App />);\n");
    root.file('src/App.tsx', `import React from 'react';\nimport projectData from './project.json';\nimport type { Project } from '@shared/project';\nimport { StudioSiteRenderer } from './studio-components/StudioSiteRenderer';\nconst project = projectData as Project;\nexport function App(){ const path=(window.location.pathname||'/').toLowerCase(); const page=project.pages.find(p=>(p.slug||'/').toLowerCase()===path)||project.pages[0]; if(!page) return <div>No page found.</div>; return <StudioSiteRenderer project={project} page={page} contentMode="production" />; }\n`);
    root.file('src/site.css', 'html,body,#root{margin:0;min-height:100%;width:100%}body{overflow-x:hidden}');

    const cwd = process.cwd();
    await copyDirectoryToZip(root, path.join(cwd, 'src', 'studio-components'), 'src/studio-components');
    await copyDirectoryToZip(root, path.join(cwd, 'shared'), 'shared');
    root.file('src/data/componentRegistryRepository.ts', await fs.readFile(path.join(cwd, 'src', 'data', 'componentRegistryRepository.ts')));
    root.file('README.md', `# ${project.business.businessName}\n\nGenerated by Natanel Studio.\n\nRun:\n\n\`npm install\`\n\`npm run dev\`\n\nBuild for production with \`npm run build\`.\n`);

    return { target: 'react', filename: `${siteName}-react.zip`, mimeType: ZIP_MIME, buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), validation };
  }

  private async buildWordPress(project: Project, siteName: string, validation: ExportValidationResult): Promise<GeneratedExportArtifact> {
    const zip = new JSZip();
    const root = zip.folder(`${siteName}-theme`)!;
    const colors = colorTokens(project);
    root.file('style.css', `/*\nTheme Name: ${project.business.businessName} — Natanel Studio\nAuthor: Natanel Studio\nVersion: 1.0.0\nText Domain: ${siteName}\n*/\n${baseCss(project)}\n`);
    root.file('theme.json', JSON.stringify({
      version: 3,
      settings: { appearanceTools: true, layout: { contentSize: '760px', wideSize: '1180px' }, color: { palette: [
        { slug: 'background', color: colors.background, name: 'Background' },
        { slug: 'text', color: colors.text, name: 'Text' },
        { slug: 'accent', color: colors.accent, name: 'Accent' },
      ] } },
      styles: { color: { background: 'var(--wp--preset--color--background)', text: 'var(--wp--preset--color--text)' } },
    }, null, 2));
    root.file('functions.php', "<?php\nadd_action('wp_enqueue_scripts', function () { wp_enqueue_style('natanel-studio-theme', get_stylesheet_uri(), [], wp_get_theme()->get('Version')); });\n");
    const fallbackPage = project.pages[0];
    root.file('templates/index.html', wordpressTemplate(project, fallbackPage));
    root.file('templates/front-page.html', wordpressTemplate(project, fallbackPage));
    for (const page of project.pages) {
      if (page === fallbackPage) continue;
      const slug = slugify(page.slug.replace(/^\//, '') || page.name, 'page');
      root.file(`templates/page-${slug}.html`, wordpressTemplate(project, page));
    }
    root.file('README.txt', `${project.business.businessName} — Natanel Studio block theme\n\nInstall the ZIP from WordPress > Appearance > Themes > Add New > Upload Theme.\nThe generated templates use production-safe static block HTML and inherit the project design tokens.\n`);
    return { target: 'wordpress', filename: `${siteName}-wordpress-theme.zip`, mimeType: ZIP_MIME, buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), validation };
  }

  private async buildShopify(project: Project, siteName: string, validation: ExportValidationResult): Promise<GeneratedExportArtifact> {
    const zip = new JSZip();
    const root = zip.folder(`${siteName}-shopify-theme`)!;
    root.file('layout/theme.liquid', `<!doctype html><html lang="{{ request.locale.iso_code }}" dir="${project.business.direction}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">{{ content_for_header }}{{ 'theme.css' | asset_url | stylesheet_tag }}</head><body>{% section 'site-header' %}<main id="MainContent">{{ content_for_layout }}</main>{% section 'site-footer' %}</body></html>`);
    root.file('assets/theme.css', `${baseCss(project)}\n.ns-product,.ns-collection,.ns-cart{max-width:1180px;margin:0 auto;padding:64px 24px}.ns-product-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px}.ns-product-image{width:100%;height:auto}.ns-price{font-size:24px;margin:16px 0}.ns-product-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}.ns-product-card{display:grid;gap:10px;color:inherit;text-decoration:none}.ns-cart-item{display:grid;grid-template-columns:1fr auto 90px;gap:16px;padding:14px 0;border-bottom:1px solid var(--ns-border)}@media(max-width:760px){.ns-product-grid{grid-template-columns:1fr}.ns-product-cards{grid-template-columns:1fr 1fr}}`);
    root.file('sections/natanel-studio-section.liquid', shopifyStudioSection());
    root.file('sections/main-product.liquid', shopifyMainProduct());
    root.file('sections/main-collection.liquid', shopifyMainCollection());
    root.file('sections/main-cart.liquid', shopifyMainCart());
    root.file('sections/site-header.liquid', `<header class="ns-site-header"><a class="ns-brand" href="{{ routes.root_url }}">{{ shop.name }}</a><nav class="ns-nav"><a href="{{ routes.all_products_collection_url }}">Shop</a><a href="{{ routes.cart_url }}">Cart ({{ cart.item_count }})</a></nav></header>{% schema %}{"name":"Site header","settings":[]}{% endschema %}`);
    root.file('sections/site-footer.liquid', `<footer class="ns-site-footer"><span>© {{ 'now' | date: '%Y' }} {{ shop.name }}</span><span>{{ shop.email }}</span></footer>{% schema %}{"name":"Site footer","settings":[]}{% endschema %}`);

    const home = project.pages.find((page) => page.slug === '/') || project.pages[0];
    root.file('templates/index.json', JSON.stringify(shopifyTemplateForPage(project, home), null, 2));
    root.file('templates/product.json', JSON.stringify({ sections: { main: { type: 'main-product', settings: {} } }, order: ['main'] }, null, 2));
    root.file('templates/collection.json', JSON.stringify({ sections: { main: { type: 'main-collection', settings: {} } }, order: ['main'] }, null, 2));
    root.file('templates/cart.json', JSON.stringify({ sections: { main: { type: 'main-cart', settings: {} } }, order: ['main'] }, null, 2));
    for (const page of project.pages) {
      if (page.id === home.id) continue;
      const slug = slugify(page.slug.replace(/^\//, '') || page.name, 'page');
      if (slug === 'product' || slug === 'collection' || slug === 'cart') continue;
      root.file(`templates/page.${slug}.json`, JSON.stringify(shopifyTemplateForPage(project, page), null, 2));
    }
    root.file('config/settings_schema.json', JSON.stringify([
      { name: 'theme_info', theme_name: `${project.business.businessName} — Natanel Studio`, theme_version: '1.0.0', theme_author: 'Natanel Studio', theme_documentation_url: 'https://github.com/leadmanux/natanel-studio', theme_support_url: 'https://github.com/leadmanux/natanel-studio' },
      { name: 'Layout', settings: [{ type: 'range', id: 'content_width', min: 960, max: 1440, step: 20, default: 1180, unit: 'px', label: 'Content width' }] },
    ], null, 2));
    root.file('config/settings_data.json', JSON.stringify({ current: {}, presets: {} }, null, 2));
    root.file('README.md', `# ${project.business.businessName} Shopify Theme\n\nGenerated by Natanel Studio. Upload the ZIP in Shopify Admin > Online Store > Themes. Product, collection and cart templates use Shopify-native objects and forms.\n`);
    return { target: 'shopify', filename: `${siteName}-shopify-theme.zip`, mimeType: ZIP_MIME, buffer: await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' }), validation };
  }
}
