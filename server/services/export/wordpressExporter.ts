import JSZip from 'jszip';
import type { Project, SitePage, SiteSection } from '../../../shared/project';
import type { ComponentDefinition } from '../../../shared/componentRegistry';
import type {
  ExportResult,
  ExportValidation,
  SiteExporter,
} from '../../../shared/exportTypes';
import { validateProjectForExport } from '../../../shared/exportValidation';
import { compileProjectDesignTokens } from '../../../src/studio-components/designTokenCompiler';
import {
  collectAndProcessExportAssets,
  ExportAssetError,
  type ExportAssetFetchOptions,
} from './exportAssetHelper';
import { createExportManifest } from './exportManifest';
import {
  ExportSectionRenderError,
  renderExactExportSection,
} from './renderExportSection';
import { exportStore } from './exportStore';

const THEME_URI_TOKEN = '__NATANEL_THEME_URI__';

export class WordPressThemeExporter implements SiteExporter {
  id = 'wordpress' as const;
  name = 'WordPress Block Theme';

  constructor(
    private canonicalComponents: ComponentDefinition[],
    private assetFetchOptions: ExportAssetFetchOptions = {}
  ) {}

  canExport(project: Project): boolean {
    return project.projectType === 'business_website';
  }

  async validate(project: Project) {
    return validateProjectForExport(project, 'wordpress', this.canonicalComponents);
  }

  async export(project: Project): Promise<ExportResult> {
    let validation = await this.validate(project);
    const generatedAt = new Date().toISOString();
    const safeSlug = sanitizeSlug(project.business.businessName || project.name || 'website');
    const filename = `${safeSlug}-wordpress-theme.zip`;
    const compiledTokens = compileProjectDesignTokens(project.designSystem, {
      industry: project.business.industry,
      themeMode: 'dark',
      density: project.brand.contentDensity || project.designSystem.density,
      direction: project.business.direction,
    });
    let manifest = createExportManifest(project, 'wordpress', generatedAt, [], compiledTokens.tokens, 'dark');

    if (!validation.valid) {
      return failedResult(filename, generatedAt, validation, manifest, 'WordPress export validation failed.');
    }

    try {
      const processed = await collectAndProcessExportAssets(
        project,
        this.canonicalComponents,
        this.assetFetchOptions
      );
      manifest = createExportManifest(
        project,
        'wordpress',
        generatedAt,
        processed.assets.map((asset) => asset.id),
        compiledTokens.tokens,
        'dark'
      );

      const zip = new JSZip();
      const themeName = sanitizeThemeHeader(project.business.businessName || project.name || 'Natanel Studio Site');
      const phpPrefix = `ns_${safeSlug.replace(/[^a-z0-9_]/g, '_')}`;
      const isRtl = project.business.direction === 'rtl';

      zip.file('style.css', buildStyleHeader(themeName, safeSlug));
      zip.file('theme.json', JSON.stringify(buildThemeJson(compiledTokens.tokens), null, 2));
      zip.file('functions.php', buildFunctionsPhp(themeName, safeSlug, phpPrefix));
      zip.file('assets/css/theme.css', buildThemeCss(compiledTokens.cssVariables));
      zip.file('assets/js/theme.js', buildThemeJs());
      if (isRtl) zip.file('rtl.css', buildRtlCss());

      const imagesFolder = zip.folder('assets/images');
      for (const asset of processed.assets) imagesFolder?.file(asset.filename, asset.buffer);

      const componentLookup = new Map(this.canonicalComponents.map((component) => [component.id, component]));
      const homePage = project.pages.find((page) => page.slug === '/') || project.pages[0];
      const allOrderedSections = project.pages.flatMap((page) =>
        [...page.sections].sort((a, b) => a.order - b.order).map((section) => ({ page, section }))
      );
      const headerEntry = allOrderedSections.find(({ section }) => componentLookup.get(section.componentRegistryId)?.category === 'navigation');
      const footerEntry = allOrderedSections.find(({ section }) => componentLookup.get(section.componentRegistryId)?.category === 'footer');

      const patternsFolder = zip.folder('patterns');
      const partsFolder = zip.folder('parts');
      const templatesFolder = zip.folder('templates');

      if (headerEntry) {
        const rendered = this.renderLocalizedSection(
          headerEntry.section,
          headerEntry.page,
          project,
          processed.urlToFilenameMap
        );
        patternsFolder?.file(
          'global-header.php',
          patternPhp(themeName + ' Header', `${safeSlug}/global-header`, wrapMotion(rendered.html, rendered.motionPreset))
        );
        partsFolder?.file('header.html', `<!-- wp:pattern {"slug":"${safeSlug}/global-header"} /-->`);
      } else {
        partsFolder?.file('header.html', '<!-- wp:group {"tagName":"header"} --><header class="wp-block-group"></header><!-- /wp:group -->');
      }

      if (footerEntry) {
        const rendered = this.renderLocalizedSection(
          footerEntry.section,
          footerEntry.page,
          project,
          processed.urlToFilenameMap
        );
        patternsFolder?.file(
          'global-footer.php',
          patternPhp(themeName + ' Footer', `${safeSlug}/global-footer`, wrapMotion(rendered.html, rendered.motionPreset))
        );
        partsFolder?.file('footer.html', `<!-- wp:pattern {"slug":"${safeSlug}/global-footer"} /-->`);
      } else {
        partsFolder?.file('footer.html', '<!-- wp:group {"tagName":"footer"} --><footer class="wp-block-group"></footer><!-- /wp:group -->');
      }

      const pageTemplateRefs = new Map<string, string[]>();
      for (const page of project.pages) {
        const refs: string[] = [];
        const ordered = [...page.sections].sort((a, b) => a.order - b.order);
        for (const section of ordered) {
          const category = componentLookup.get(section.componentRegistryId)?.category;
          if (category === 'navigation' || category === 'footer') continue;

          const rendered = this.renderLocalizedSection(section, page, project, processed.urlToFilenameMap);
          const patternName = `${sanitizeSlug(page.slug === '/' ? 'home' : page.slug)}-${sanitizeSlug(section.id)}`;
          const patternSlug = `${safeSlug}/${patternName}`;
          patternsFolder?.file(
            `${patternName}.php`,
            patternPhp(`${section.name} (${page.name})`, patternSlug, wrapMotion(rendered.html, rendered.motionPreset))
          );
          refs.push(`<!-- wp:pattern {"slug":"${patternSlug}"} /-->`);
        }
        pageTemplateRefs.set(page.id, refs);
      }

      const frontRefs = pageTemplateRefs.get(homePage.id) || [];
      templatesFolder?.file('front-page.html', pageTemplate(frontRefs));
      templatesFolder?.file('index.html', genericPostTemplate());
      templatesFolder?.file('page.html', genericPostTemplate());

      for (const page of project.pages) {
        if (page.id === homePage.id) continue;
        const pageSlug = sanitizeSlug(page.slug.replace(/^\//, '') || page.name);
        templatesFolder?.file(`page-${pageSlug}.html`, pageTemplate(pageTemplateRefs.get(page.id) || []));
      }

      zip.file('manifest.json', JSON.stringify(manifest, null, 2));
      zip.file(
        'README.txt',
        `${themeName}\n\nGenerated by Natanel Studio Export Engine V1.\nThis is a WordPress block theme with no Elementor or paid-plugin dependency.\nGenerated page templates are available in the Site Editor.\n`
      );

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const downloadId = `${project.id}-wordpress-${Date.now()}`;
      exportStore.set(downloadId, { buffer: zipBuffer, filename, mimeType: 'application/zip' });

      return {
        success: true,
        target: 'wordpress',
        filename,
        mimeType: 'application/zip',
        downloadUrl: `/api/export/download/${downloadId}`,
        downloadId,
        generatedAt,
        validation,
        manifest,
        message: 'WordPress block theme generated successfully.',
      };
    } catch (error) {
      validation = appendRuntimeError(validation, error);
      return failedResult(
        filename,
        generatedAt,
        validation,
        manifest,
        error instanceof Error ? error.message : 'WordPress export failed.'
      );
    }
  }

  private renderLocalizedSection(
    section: SiteSection,
    page: SitePage,
    project: Project,
    urlToFilenameMap: Map<string, string>
  ) {
    return renderExactExportSection(
      section,
      page,
      project,
      this.canonicalComponents,
      (sourceUrl) => {
        const filename = urlToFilenameMap.get(sourceUrl);
        if (!filename) throw new Error(`Localized asset mapping missing for section ${section.id}.`);
        return `${THEME_URI_TOKEN}/assets/images/${filename}`;
      }
    );
  }
}

function buildStyleHeader(themeName: string, safeSlug: string): string {
  return `/*\nTheme Name: ${themeName}\nAuthor: Natanel Studio\nDescription: Production block theme generated by Natanel Studio.\nVersion: 1.0.0\nRequires at least: 6.2\nRequires PHP: 7.4\nText Domain: ${safeSlug}\n*/\n`;
}

function buildThemeJson(tokens: ReturnType<typeof compileProjectDesignTokens>['tokens']) {
  return {
    $schema: 'https://schemas.wp.org/trunk/theme.json',
    version: 3,
    settings: {
      appearanceTools: true,
      useRootPaddingAwareAlignments: true,
      layout: { contentSize: tokens.contentWidth, wideSize: '1440px' },
      color: {
        palette: [
          { slug: 'base', color: tokens.bg, name: 'Base' },
          { slug: 'surface', color: tokens.surface, name: 'Surface' },
          { slug: 'accent', color: tokens.accent, name: 'Accent' },
          { slug: 'text', color: tokens.text, name: 'Text' },
          { slug: 'muted', color: tokens.muted, name: 'Muted' },
          { slug: 'border', color: tokens.border, name: 'Border' },
        ],
      },
      typography: {
        fontFamilies: [
          { fontFamily: tokens.fontDisplay, name: 'Display', slug: 'display' },
          { fontFamily: tokens.fontBody, name: 'Body', slug: 'body' },
        ],
      },
    },
    styles: {
      color: { background: 'var(--wp--preset--color--base)', text: 'var(--wp--preset--color--text)' },
      typography: { fontFamily: 'var(--wp--preset--font-family--body)' },
    },
  };
}

function buildFunctionsPhp(themeName: string, safeSlug: string, prefix: string): string {
  const escapedName = themeName.replace(/'/g, "\\'");
  return `<?php\n/** ${escapedName} — generated by Natanel Studio. */\nfunction ${prefix}_setup() {\n    add_theme_support( 'wp-block-styles' );\n    add_theme_support( 'editor-styles' );\n    add_editor_style( 'assets/css/theme.css' );\n}\nadd_action( 'after_setup_theme', '${prefix}_setup' );\n\nfunction ${prefix}_assets() {\n    wp_enqueue_style( '${safeSlug}-theme', get_template_directory_uri() . '/assets/css/theme.css', array(), '1.0.0' );\n    if ( is_rtl() && file_exists( get_template_directory() . '/rtl.css' ) ) {\n        wp_enqueue_style( '${safeSlug}-rtl', get_template_directory_uri() . '/rtl.css', array('${safeSlug}-theme'), '1.0.0' );\n    }\n    wp_enqueue_script( '${safeSlug}-theme', get_template_directory_uri() . '/assets/js/theme.js', array(), '1.0.0', true );\n}\nadd_action( 'wp_enqueue_scripts', '${prefix}_assets' );\n\nfunction ${prefix}_patterns() {\n    if ( function_exists( 'register_block_pattern_category' ) ) {\n        register_block_pattern_category( 'natanel-studio', array( 'label' => __( 'Natanel Studio', '${safeSlug}' ) ) );\n    }\n}\nadd_action( 'init', '${prefix}_patterns' );\n`;
}

function buildThemeCss(cssVariables: React.CSSProperties): string {
  const vars = Object.entries(cssVariables)
    .map(([key, value]) => `  ${key}: ${String(value)};`)
    .join('\n');
  return `:root {\n${vars}\n}\n*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--studio-bg);color:var(--studio-text);font-family:var(--studio-font-body);-webkit-font-smoothing:antialiased}.studio-export-motion{opacity:1;transform:none;clip-path:inset(0);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1),clip-path .65s cubic-bezier(.16,1,.3,1)}.studio-motion-ready .studio-export-motion[data-studio-motion="fadeReveal"]:not(.is-visible),.studio-motion-ready .studio-export-motion[data-studio-motion="textStagger"]:not(.is-visible){opacity:0;transform:translateY(16px)}.studio-motion-ready .studio-export-motion[data-studio-motion="clipReveal"]:not(.is-visible){opacity:0;clip-path:inset(8% 0 0 0)}.studio-motion-ready .studio-export-motion[data-studio-motion="imageScaleOnScroll"]:not(.is-visible){opacity:.95;transform:scale(1.05)}.studio-motion-ready .studio-export-motion[data-studio-motion="stackedCards"]:not(.is-visible){opacity:0;transform:translateY(24px) scale(.98)}.studio-motion-ready .studio-export-motion[data-studio-motion="fadeSettle"]:not(.is-visible){opacity:0}.studio-export-motion[data-studio-motion="none"]{opacity:1!important;transform:none!important;clip-path:none!important}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.studio-export-motion{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}}img{max-width:100%;height:auto}\n`;
}

function buildThemeJs(): string {
  return `document.documentElement.classList.add('studio-motion-ready');\ndocument.addEventListener('DOMContentLoaded',function(){var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;var nodes=document.querySelectorAll('.studio-export-motion');if(reduced||!('IntersectionObserver'in window)){nodes.forEach(function(n){n.classList.add('is-visible')});return}var io=new IntersectionObserver(function(entries){entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('is-visible');io.unobserve(e.target)}})},{threshold:.08});nodes.forEach(function(n){if(n.getAttribute('data-studio-motion')==='none'){n.classList.add('is-visible')}else{io.observe(n)}});document.querySelectorAll('.studio-accordion-trigger').forEach(function(button){button.addEventListener('click',function(){var expanded=this.getAttribute('aria-expanded')==='true';this.setAttribute('aria-expanded',String(!expanded));var content=this.nextElementSibling;if(content)content.hidden=expanded})})});\n`;
}

function buildRtlCss(): string {
  return `html,body{direction:rtl;text-align:right}.studio-export-motion{direction:rtl}\n`;
}

function patternPhp(title: string, slug: string, html: string): string {
  const executableHtml = html.split(THEME_URI_TOKEN).join("<?php echo esc_url( get_template_directory_uri() ); ?>");
  return `<?php\n/**\n * Title: ${sanitizeThemeHeader(title)}\n * Slug: ${slug}\n * Categories: natanel-studio\n */\n?>\n<!-- wp:html -->\n${executableHtml}\n<!-- /wp:html -->\n`;
}

function wrapMotion(html: string, motionPreset: string): string {
  return `<div class="studio-export-motion" data-studio-motion="${escapeHtml(motionPreset)}">${html}</div>`;
}

function pageTemplate(patternRefs: string[]): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->\n<!-- wp:group {"tagName":"main","layout":{"type":"default"}} -->\n${patternRefs.join('\n')}\n<!-- /wp:group -->\n<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->\n`;
}

function genericPostTemplate(): string {
  return `<!-- wp:template-part {"slug":"header","tagName":"header"} /-->\n<!-- wp:group {"tagName":"main","layout":{"type":"constrained"}} -->\n<!-- wp:post-content /-->\n<!-- /wp:group -->\n<!-- wp:template-part {"slug":"footer","tagName":"footer"} /-->\n`;
}

function appendRuntimeError(validation: ExportValidation, error: unknown): ExportValidation {
  const message = error instanceof Error ? error.message : String(error);
  const issue = {
    code: error instanceof ExportAssetError ? 'asset_localization_failed' : error instanceof ExportSectionRenderError ? 'section_render_failed' : 'export_runtime_failed',
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
  return { success: false, target: 'wordpress', filename, mimeType: 'application/zip', generatedAt, validation, manifest, message };
}

function sanitizeSlug(value: string): string {
  const cleaned = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'website';
}

function sanitizeThemeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').replace(/[<>]/g, '').trim() || 'Website';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
