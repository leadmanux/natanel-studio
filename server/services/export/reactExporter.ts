import JSZip from 'jszip';
import type { Project } from '../../../shared/project';
import type { ComponentDefinition } from '../../../shared/componentRegistry';
import type { ExportResult, ExportValidation, SiteExporter } from '../../../shared/exportTypes';
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
import { getPublicProjectDescription } from '../../../shared/publicProjectContent';

export class ReactSourceExporter implements SiteExporter {
  id = 'react' as const;
  name = 'React Source (Vite)';

  constructor(
    private canonicalComponents: ComponentDefinition[],
    private assetFetchOptions: ExportAssetFetchOptions = {}
  ) {}

  canExport(project: Project): boolean {
    return project.projectType === 'business_website';
  }

  async validate(project: Project) {
    return validateProjectForExport(project, 'react', this.canonicalComponents);
  }

  async export(project: Project): Promise<ExportResult> {
    let validation = await this.validate(project);
    const generatedAt = new Date().toISOString();
    const safeSlug = sanitizeSlug(project.business.businessName || project.name || 'website');
    const filename = `${safeSlug}-react-source.zip`;
    const compiledTokens = compileProjectDesignTokens(project.designSystem, {
      industry: project.business.industry,
      themeMode: 'dark',
      density: project.brand.contentDensity || project.designSystem.density,
      direction: project.business.direction,
    });
    let manifest = createExportManifest(project, 'react', generatedAt, [], compiledTokens.tokens, 'dark');

    if (!validation.valid) {
      return failedResult(filename, generatedAt, validation, manifest, 'React export validation failed.');
    }

    try {
      const processed = await collectAndProcessExportAssets(
        project,
        this.canonicalComponents,
        this.assetFetchOptions
      );
      manifest = createExportManifest(
        project,
        'react',
        generatedAt,
        processed.assets.map((asset) => asset.id),
        compiledTokens.tokens,
        'dark'
      );

      const renderedPages = project.pages.map((page) => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        sections: [...page.sections]
          .sort((a, b) => a.order - b.order)
          .map((section) => {
            const rendered = renderExactExportSection(
              section,
              page,
              project,
              this.canonicalComponents,
              (sourceUrl) => {
                const localizedFilename = processed.urlToFilenameMap.get(sourceUrl);
                if (!localizedFilename) throw new Error(`Localized asset mapping missing for section ${section.id}.`);
                return `/assets/images/${localizedFilename}`;
              }
            );
            return {
              id: section.id,
              name: section.name,
              componentRegistryId: section.componentRegistryId,
              motionPreset: rendered.motionPreset,
              html: rendered.html,
            };
          }),
      }));

      const zip = new JSZip();
      writeProjectFiles(zip, project, safeSlug, renderedPages, compiledTokens.cssVariables, manifest);
      const imagesFolder = zip.folder('public/assets/images');
      for (const asset of processed.assets) imagesFolder?.file(asset.filename, asset.buffer);

      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
      const downloadId = `${project.id}-react-${Date.now()}`;
      exportStore.set(downloadId, { buffer: zipBuffer, filename, mimeType: 'application/zip' });

      return {
        success: true,
        target: 'react',
        filename,
        mimeType: 'application/zip',
        downloadUrl: `/api/export/download/${downloadId}`,
        downloadId,
        generatedAt,
        validation,
        manifest,
        message: 'Standalone React source generated successfully.',
      };
    } catch (error) {
      validation = appendRuntimeError(validation, error);
      return failedResult(
        filename,
        generatedAt,
        validation,
        manifest,
        error instanceof Error ? error.message : 'React export failed.'
      );
    }
  }
}

interface RenderedPage {
  id: string;
  name: string;
  slug: string;
  sections: Array<{
    id: string;
    name: string;
    componentRegistryId: string;
    motionPreset: string;
    html: string;
  }>;
}

function writeProjectFiles(
  zip: JSZip,
  project: Project,
  safeSlug: string,
  renderedPages: RenderedPage[],
  cssVariables: React.CSSProperties,
  manifest: ReturnType<typeof createExportManifest>
) {
  zip.file(
    'package.json',
    JSON.stringify(
      {
        name: safeSlug,
        private: true,
        version: '1.0.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'tsc --noEmit && vite build', preview: 'vite preview' },
        dependencies: { react: '^19.1.0', 'react-dom': '^19.1.0' },
        devDependencies: {
          '@types/react': '^19.1.0',
          '@types/react-dom': '^19.1.0',
          '@vitejs/plugin-react': '^5.0.0',
          typescript: '^5.9.0',
          vite: '^7.0.0',
        },
      },
      null,
      2
    )
  );

  zip.file(
    'vite.config.ts',
    `import { defineConfig } from 'vite';\nimport react from '@vitejs/plugin-react';\nexport default defineConfig({ plugins: [react()] });\n`
  );
  zip.file(
    'tsconfig.json',
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          useDefineForClassFields: true,
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'Bundler',
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
        },
        include: ['src'],
      },
      null,
      2
    )
  );

  const lang = languageCode(project.business.language);
  zip.file(
    'index.html',
    `<!doctype html><html lang="${escapeHtml(lang)}" dir="${project.business.direction}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${escapeHtml(project.business.businessName || project.name)}</title><meta name="description" content="${escapeHtml(getPublicProjectDescription(project))}"/></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>`
  );
  zip.file('public/_redirects', '/* /index.html 200\n');

  zip.file(
    'README.md',
    `# ${project.business.businessName || project.name}\n\nStandalone React/Vite export generated by Natanel Studio. The exported site contains pre-rendered production markup from the exact approved Studio component implementations; it does not call Natanel Studio, Gemini, Firebase, or any Studio API at runtime.\n\n## Run\n\n\`\`\`bash\nnpm install\nnpm run dev\nnpm run build\n\`\`\`\n\nFor deep links such as /about, configure your static host to serve index.html as the SPA fallback. A Netlify-compatible public/_redirects file is included.\n`
  );

  zip.file('src/siteData.ts', `export const siteData = ${JSON.stringify({
    business: {
      name: project.business.businessName || project.name,
      description: getPublicProjectDescription(project),
      direction: project.business.direction,
      language: project.business.language,
    },
    pages: renderedPages,
  }, null, 2)} as const;\nexport type SitePageData = (typeof siteData.pages)[number];\nexport type SiteSectionData = SitePageData['sections'][number];\n`);

  zip.file(
    'src/main.tsx',
    `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport { App } from './App';\nimport './styles.css';\nReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);\n`
  );

  zip.file('src/components/SectionFrame.tsx', sectionFrameSource());
  zip.file('src/App.tsx', appSource());
  zip.file('src/styles.css', stylesSource(cssVariables));
  zip.file('manifest.json', JSON.stringify(manifest, null, 2));
}

function sectionFrameSource(): string {
  return `import React, { useEffect, useRef } from 'react';\nimport type { SiteSectionData } from '../siteData';\n\nexport function SectionFrame({ section }: { section: SiteSectionData }) {\n  const ref = useRef<HTMLDivElement>(null);\n  useEffect(() => {\n    const node = ref.current;\n    if (!node) return;\n    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;\n    if (reduced || section.motionPreset === 'none' || !('IntersectionObserver' in window)) { node.classList.add('is-visible'); return; }\n    const observer = new IntersectionObserver((entries) => { if (entries.some((entry) => entry.isIntersecting)) { node.classList.add('is-visible'); observer.disconnect(); } }, { threshold: 0.08 });\n    observer.observe(node);\n    return () => observer.disconnect();\n  }, [section.id, section.motionPreset]);\n\n  return <div ref={ref} className="studio-export-motion" data-studio-motion={section.motionPreset} data-component-id={section.componentRegistryId} dangerouslySetInnerHTML={{ __html: section.html }} />;\n}\n`;
}

function appSource(): string {
  return `import React, { useEffect, useState } from 'react';\nimport { siteData } from './siteData';\nimport { SectionFrame } from './components/SectionFrame';\n\nfunction normalizedPath() { const path = window.location.pathname || '/'; return path !== '/' ? path.replace(/\\/+$/, '') : '/'; }\n\nexport function App() {\n  const [pathname, setPathname] = useState(normalizedPath);\n  useEffect(() => {\n    const onPopState = () => setPathname(normalizedPath());\n    const onClick = (event: MouseEvent) => {\n      const target = event.target instanceof Element ? event.target.closest('a') : null;\n      if (!target) return;\n      const href = target.getAttribute('href');\n      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('https://') || href.startsWith('http://')) return;\n      const url = new URL(href, window.location.origin);\n      const nextPath = url.pathname !== '/' ? url.pathname.replace(/\\/+$/, '') : '/';\n      if (!siteData.pages.some((page) => page.slug === nextPath)) return;\n      event.preventDefault();\n      window.history.pushState({}, '', nextPath);\n      setPathname(nextPath);\n      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });\n    };\n    const onAccordionClick = (event: MouseEvent) => {\n      const target = event.target instanceof Element ? event.target.closest('.studio-accordion-trigger') : null;\n      if (!target) return;\n      const expanded = target.getAttribute('aria-expanded') === 'true';\n      target.setAttribute('aria-expanded', String(!expanded));\n      const content = target.nextElementSibling as HTMLElement | null;\n      if (content) content.hidden = expanded;\n    };\n    window.addEventListener('popstate', onPopState);\n    document.addEventListener('click', onClick);\n    document.addEventListener('click', onAccordionClick);\n    return () => { window.removeEventListener('popstate', onPopState); document.removeEventListener('click', onClick); document.removeEventListener('click', onAccordionClick); };\n  }, []);\n\n  const page = siteData.pages.find((candidate) => candidate.slug === pathname);\n  if (!page) return <main className="not-found" dir={siteData.business.direction}><div><p>404</p><h1>Page Not Found</h1><a href="/">Return home</a></div></main>;\n  return <div className="studio-site" dir={siteData.business.direction}>{page.sections.map((section) => <SectionFrame key={section.id} section={section} />)}</div>;\n}\n`;
}

function stylesSource(cssVariables: React.CSSProperties): string {
  const vars = Object.entries(cssVariables).map(([key, value]) => `  ${key}: ${String(value)};`).join('\n');
  return `:root{\n${vars}\n}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--studio-bg);color:var(--studio-text);font-family:var(--studio-font-body);-webkit-font-smoothing:antialiased}.studio-site{min-height:100vh}.studio-export-motion{opacity:1;transform:none;clip-path:inset(0);transition:opacity .5s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1),clip-path .65s cubic-bezier(.16,1,.3,1)}.studio-export-motion[data-studio-motion="fadeReveal"]:not(.is-visible),.studio-export-motion[data-studio-motion="textStagger"]:not(.is-visible){opacity:0;transform:translateY(16px)}.studio-export-motion[data-studio-motion="clipReveal"]:not(.is-visible){opacity:0;clip-path:inset(8% 0 0 0)}.studio-export-motion[data-studio-motion="imageScaleOnScroll"]:not(.is-visible){opacity:.95;transform:scale(1.05)}.studio-export-motion[data-studio-motion="stackedCards"]:not(.is-visible){opacity:0;transform:translateY(24px) scale(.98)}.studio-export-motion[data-studio-motion="fadeSettle"]:not(.is-visible){opacity:0}.studio-export-motion[data-studio-motion="none"]{opacity:1!important;transform:none!important;clip-path:none!important}.not-found{min-height:100vh;display:grid;place-items:center;padding:32px;text-align:center}.not-found p{color:var(--studio-muted);letter-spacing:.15em}.not-found a{color:var(--studio-accent)}img{max-width:100%;height:auto}@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.studio-export-motion{opacity:1!important;transform:none!important;clip-path:none!important;transition:none!important}}\n`;
}

function appendRuntimeError(validation: ExportValidation, error: unknown): ExportValidation {
  const message = error instanceof Error ? error.message : String(error);
  const issue = {
    code: error instanceof ExportAssetError ? 'asset_localization_failed' : error instanceof ExportSectionRenderError ? 'section_render_failed' : 'export_runtime_failed',
    message,
    severity: 'error' as const,
    ...(error instanceof ExportSectionRenderError ? { pageId: error.pageId, sectionId: error.sectionId } : {}),
  };
  return { valid: false, errors: [...validation.errors, message], warnings: validation.warnings, issues: [...validation.issues, issue] };
}

function failedResult(
  filename: string,
  generatedAt: string,
  validation: ExportValidation,
  manifest: ReturnType<typeof createExportManifest>,
  message: string
): ExportResult {
  return { success: false, target: 'react', filename, mimeType: 'application/zip', generatedAt, validation, manifest, message };
}

function sanitizeSlug(value: string): string {
  const cleaned = value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return cleaned || 'website';
}

function languageCode(language: string): string {
  const normalized = (language || '').toLowerCase();
  if (normalized.includes('hebrew') || normalized.includes('עבר')) return 'he';
  if (normalized.includes('french') || normalized.includes('fran')) return 'fr';
  return 'en';
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
