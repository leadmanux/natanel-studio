import JSZip from 'jszip';
import type { Project, SitePage, SiteSection } from '../../../shared/project';
import { demoComponents, type ComponentDefinition } from '../../../shared/componentRegistry';
import { resolveSectionAssets } from '../../../shared/assetBinding';
import { validateProjectForExport } from '../../../shared/exportValidation';
import { compileProjectDesignTokens } from '../../../src/studio-components/designTokenCompiler';
import { collectAndProcessExportAssets } from './exportAssetHelper';
import type {
  ExportResult,
  ExportManifest,
  SiteExporter,
} from '../../../shared/exportTypes';

const componentLookup = new Map<string, ComponentDefinition>(
  demoComponents.map((c) => [c.id, c])
);

export class ReactSourceExporter implements SiteExporter {
  id = 'react' as const;
  name = 'React Source (Vite)';

  canExport(project: Project): boolean {
    return project.projectType === 'business_website';
  }

  async validate(project: Project) {
    return validateProjectForExport(project, 'react');
  }

  async export(project: Project): Promise<ExportResult> {
    const validation = await this.validate(project);
    const generatedAt = new Date().toISOString();

    const safeSlug = (project.business.businessName || project.name || 'natanel-studio-site')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'website';
    const filename = `${safeSlug}-react-source.zip`;

    const manifest: ExportManifest = {
      studioVersion: '1.0.0',
      generatedAt,
      projectId: project.id,
      projectName: project.name,
      businessName: project.business.businessName,
      target: 'react',
      direction: project.business.direction,
      language: project.business.language || 'English',
      pages: (project.pages || []).map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        sectionCount: (p.sections || []).length,
        sections: (p.sections || []).map((s) => ({
          id: s.id,
          name: s.name,
          componentRegistryId: s.componentRegistryId,
        })),
      })),
      componentIdsUsed: Array.from(
        new Set(project.pages.flatMap((p) => p.sections.map((s) => s.componentRegistryId)))
      ),
      assetIdsUsed: Array.from(
        new Set(project.pages.flatMap((p) => p.sections.flatMap((s) => s.assetIds || [])))
      ),
      designTokenSummary: {
        themeMode: 'dark',
        primaryColor: project.designSystem?.colors?.[0] || '#111113',
        fontDisplay: project.designSystem?.typography || 'Editorial Serif',
        fontBody: 'Inter',
        density: project.brand.contentDensity || 'balanced',
      },
    };

    if (!validation.valid) {
      return {
        success: false,
        target: 'react',
        filename,
        mimeType: 'application/zip',
        generatedAt,
        validation,
        manifest,
        message: `Validation failed with ${validation.errors.length} error(s).`,
      };
    }

    // Collect and localize assets
    const { assets: processedAssets, urlToFilenameMap } = await collectAndProcessExportAssets(project);

    // Compile design tokens
    const compiledTokens = compileProjectDesignTokens(project.designSystem, {
      industry: project.business.industry,
      themeMode: 'dark',
      density: project.brand.contentDensity,
      direction: project.business.direction,
    });

    const isRtl = project.business.direction === 'rtl';
    const siteTitle = project.business.businessName || project.name || 'Website';

    const zip = new JSZip();

    // 1. package.json
    const packageJson = {
      name: safeSlug,
      private: true,
      version: '1.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'tsc && vite build',
        preview: 'vite preview',
      },
      dependencies: {
        'lucide-react': '^0.468.0',
        motion: '^13.4.0',
        react: '^19.1.0',
        'react-dom': '^19.1.0',
      },
      devDependencies: {
        '@types/node': '^24.0.0',
        '@types/react': '^19.1.0',
        '@types/react-dom': '^19.1.0',
        '@vitejs/plugin-react': '^5.0.0',
        typescript: '^5.9.0',
        vite: '^7.0.0',
      },
    };
    zip.file('package.json', JSON.stringify(packageJson, null, 2));

    // 2. vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
    zip.file('vite.config.ts', viteConfig);

    // 3. tsconfig.json
    const tsConfig = {
      compilerOptions: {
        target: 'ES2022',
        useDefineForClassFields: true,
        lib: ['ES2022', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: false,
        resolveJsonModule: true,
        isolatedModules: true,
        moduleDetection: 'force',
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
    };
    zip.file('tsconfig.json', JSON.stringify(tsConfig, null, 2));

    // 4. index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="${isRtl ? 'he' : 'en'}" dir="${project.business.direction}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(siteTitle)}</title>
    <meta name="description" content="${escapeHtml(project.business.description || '')}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
    zip.file('index.html', indexHtml);

    // 5. README.md
    const readmeMd = `# ${siteTitle}

This is a production-ready, standalone React website exported from **Natanel Studio**.
Zero runtime dependencies on Natanel Studio APIs, Firebase, or external AI services.

## Project Structure
- \`src/siteData.ts\`: Canonical structured content, pages, sections, and design tokens
- \`src/App.tsx\`: Main application with client-side routing and layout
- \`src/components/SectionRenderer.tsx\`: Canonical section rendering components
- \`public/assets/images/\`: Localized, approved image assets

## Getting Started

1. **Install dependencies:**
\`\`\`bash
npm install
\`\`\`

2. **Run development server:**
\`\`\`bash
npm run dev
\`\`\`

3. **Build for production:**
\`\`\`bash
npm run build
\`\`\`

The production build will be located in the \`dist/\` directory, ready to deploy to Vercel, Netlify, Cloudflare Pages, or any static host.
`;
    zip.file('README.md', readmeMd);

    // 6. public/assets/images/
    const imagesFolder = zip.folder('public/assets/images');
    for (const asset of processedAssets) {
      imagesFolder?.file(asset.filename, asset.buffer);
    }

    // 7. src/styles.css
    const cssVarsString = Object.entries(compiledTokens.cssVariables)
      .map(([key, val]) => `  ${key}: ${val};`)
      .join('\n');

    const stylesCss = `:root {
${cssVarsString}
  --studio-content-width: 1200px;
  --studio-section-space: 80px;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  background-color: var(--studio-bg);
  color: var(--studio-text);
  font-family: var(--studio-font-body);
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

.studio-site-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.studio-section {
  width: 100%;
  position: relative;
  background-color: var(--studio-bg);
  color: var(--studio-text);
}

.studio-section a {
  color: inherit;
  text-decoration: none;
}

.studio-section img {
  max-width: 100%;
  height: auto;
  display: block;
}

.grid-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
}

@media (max-width: 768px) {
  .grid-split {
    grid-template-columns: 1fr !important;
    gap: 32px !important;
  }
}

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-duration: 0.001ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.001ms !important;
    scroll-behavior: auto !important;
  }
}
`;
    zip.file('src/styles.css', stylesCss);

    // 8. src/siteData.ts
    // Prepare localized page data
    const exportPages = project.pages.map((page) => ({
      id: page.id,
      name: page.name,
      slug: page.slug,
      sections: (page.sections || []).map((sec) => {
        const componentDef = componentLookup.get(sec.componentRegistryId);
        const resolved = resolveSectionAssets(sec, componentDef, project.assets, page.id);
        const localizedAssets: Record<string, { url: string; alt: string }> = {};
        for (const [slot, a] of Object.entries(resolved.assets)) {
          const filename = urlToFilenameMap.get(a.url) || 'image.png';
          localizedAssets[slot] = {
            url: `/assets/images/${filename}`,
            alt: a.alt || `${sec.name} image`,
          };
        }

        return {
          id: sec.id,
          name: sec.name,
          componentRegistryId: sec.componentRegistryId,
          motionPreset: sec.motionPreset || 'fade-in',
          content: sec.content || {},
          assets: localizedAssets,
        };
      }),
    }));

    const siteDataObject = {
      business: {
        name: siteTitle,
        industry: project.business.industry,
        direction: project.business.direction,
        language: project.business.language,
        description: project.business.description,
        phone: project.business.phone,
        email: project.business.email,
        whatsapp: project.business.whatsapp,
      },
      pages: exportPages,
    };

    const siteDataTs = `export const siteData = ${JSON.stringify(siteDataObject, null, 2)} as const;

export type SiteData = typeof siteData;
export type SitePageData = (typeof siteData.pages)[number];
export type SiteSectionData = SitePageData['sections'][number];
`;
    zip.file('src/siteData.ts', siteDataTs);

    // 9. src/main.tsx
    const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`;
    zip.file('src/main.tsx', mainTsx);

    // 10. src/components/SectionRenderer.tsx
    const sectionRendererTsx = `import React from 'react';
import { motion } from 'motion/react';
import type { SiteSectionData } from '../siteData';
import { siteData } from '../siteData';
import { ArrowRight, ArrowLeft, ShieldCheck, CheckCircle2, Phone, Mail, ChevronDown } from 'lucide-react';

interface SectionRendererProps {
  section: SiteSectionData;
}

export function SectionRenderer({ section }: SectionRendererProps) {
  const isRtl = siteData.business.direction === 'rtl';
  const ArrowIcon = isRtl ? ArrowLeft : ArrowRight;

  // Simple, elegant motion variants
  const motionVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
  };

  const content = section.content as Record<string, any>;
  const assets = section.assets as Record<string, { url: string; alt: string }>;

  // Navigation
  if (section.componentRegistryId.startsWith('nav-')) {
    return (
      <header className="studio-section" style={{ borderBottom: '1px solid var(--studio-border)', padding: '16px 24px' }}>
        <div style={{ maxWidth: 'var(--studio-content-width)', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontWeight: 700, fontSize: '20px', fontFamily: 'var(--studio-font-display)' }}>
            {content.logoText || siteData.business.name}
          </div>
          <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            {siteData.pages.map((p) => (
              <a key={p.id} href={'#' + (p.slug === '/' ? '' : p.slug.replace(/^\\/+/, ''))} style={{ fontSize: '14px', color: 'var(--studio-muted)' }}>
                {p.name}
              </a>
            ))}
            {content.primaryCta && (
              <a href="#contact" style={{ padding: '8px 16px', background: 'var(--studio-primary)', color: 'var(--studio-bg)', borderRadius: '4px', fontSize: '13px', fontWeight: 600 }}>
                {content.primaryCta}
              </a>
            )}
          </nav>
        </div>
      </header>
    );
  }

  // Hero section
  if (section.componentRegistryId.startsWith('hero-')) {
    const heroImage = assets.hero?.url || assets.hero_primary?.url || '';
    return (
      <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={motionVariants} className="studio-section" style={{ padding: 'var(--studio-section-space) 24px', borderBottom: '1px solid var(--studio-border)' }}>
        <div style={{ maxWidth: 'var(--studio-content-width)', margin: '0 auto' }} className="grid-split">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center' }}>
            {content.eyebrow && (
              <div style={{ fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--studio-accent)' }}>
                {content.eyebrow}
              </div>
            )}
            <h1 style={{ fontFamily: 'var(--studio-font-display)', fontSize: 'clamp(32px, 4vw, 54px)', lineHeight: 1.15, fontWeight: 600, margin: 0 }}>
              {content.headline}
            </h1>
            {content.description && (
              <p style={{ fontSize: '16px', lineHeight: 1.6, color: 'var(--studio-muted)', margin: 0, maxWidth: '520px' }}>
                {content.description}
              </p>
            )}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '8px' }}>
              {content.primaryCta && (
                <a href="#contact" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'var(--studio-primary)', color: 'var(--studio-bg)', fontWeight: 600, fontSize: '14px', borderRadius: '4px' }}>
                  <span>{content.primaryCta}</span>
                  <ArrowIcon size={16} />
                </a>
              )}
              {content.secondaryCta && (
                <a href="#services" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 20px', border: '1px solid var(--studio-border)', color: 'var(--studio-text)', fontSize: '14px', borderRadius: '4px' }}>
                  {content.secondaryCta}
                </a>
              )}
            </div>
            {content.proofBadge && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--studio-muted)', fontSize: '13px', marginTop: '12px' }}>
                <ShieldCheck size={16} style={{ color: 'var(--studio-accent)' }} />
                <span>{content.proofBadge}</span>
              </div>
            )}
          </div>
          {heroImage && (
            <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--studio-border)', aspectRatio: '4/3', position: 'relative' }}>
              <img src={heroImage} alt={assets.hero?.alt || 'Hero'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}
        </div>
      </motion.section>
    );
  }

  // Footer section
  if (section.componentRegistryId.startsWith('footer-')) {
    return (
      <footer className="studio-section" style={{ borderTop: '1px solid var(--studio-border)', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 'var(--studio-content-width)', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '20px', fontFamily: 'var(--studio-font-display)', marginBottom: '8px' }}>
                {siteData.business.name}
              </div>
              <p style={{ color: 'var(--studio-muted)', fontSize: '14px', maxWidth: '360px', margin: 0 }}>
                {siteData.business.description}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
              <div>
                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--studio-muted)', margin: '0 0 12px' }}>Pages</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px' }}>
                  {siteData.pages.map((p) => (
                    <a key={p.id} href={'#' + (p.slug === '/' ? '' : p.slug.replace(/^\\/+/, ''))} style={{ color: 'var(--studio-text)' }}>
                      {p.name}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--studio-border)', paddingTop: '24px', display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--studio-muted)', flexWrap: 'wrap', gap: '12px' }}>
            <div>&copy; {new Date().getFullYear()} {siteData.business.name}. All rights reserved.</div>
            <div>Built with Natanel Studio</div>
          </div>
        </div>
      </footer>
    );
  }

  // Generic fallback for other sections (services, testimonials, cro, contact)
  return (
    <motion.section initial="hidden" whileInView="visible" viewport={{ once: true }} variants={motionVariants} className="studio-section" style={{ padding: 'var(--studio-section-space) 24px', borderBottom: '1px solid var(--studio-border)' }}>
      <div style={{ maxWidth: 'var(--studio-content-width)', margin: '0 auto' }}>
        {content.eyebrow && (
          <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--studio-accent)', marginBottom: '12px' }}>
            {content.eyebrow}
          </div>
        )}
        <h2 style={{ fontFamily: 'var(--studio-font-display)', fontSize: 'clamp(28px, 3vw, 42px)', lineHeight: 1.2, fontWeight: 600, margin: '0 0 16px' }}>
          {content.headline || section.name}
        </h2>
        {content.description && (
          <p style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--studio-muted)', margin: '0 0 32px', maxWidth: '640px' }}>
            {content.description}
          </p>
        )}
        {content.items && Array.isArray(content.items) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginTop: '32px' }}>
            {content.items.map((item: any, idx: number) => (
              <div key={idx} style={{ padding: '24px', background: 'var(--studio-surface)', border: '1px solid var(--studio-border)', borderRadius: '6px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 600, margin: '0 0 8px' }}>{item.title || item.name || \`Item \${idx + 1}\`}</h3>
                <p style={{ fontSize: '14px', color: 'var(--studio-muted)', margin: 0 }}>{item.description || item.quote || item.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
}
`;
    zip.file('src/components/SectionRenderer.tsx', sectionRendererTsx);

    // 11. src/App.tsx
    const appTsx = `import React, { useState, useEffect } from 'react';
import { siteData } from './siteData';
import { SectionRenderer } from './components/SectionRenderer';

export function App() {
  const [currentSlug, setCurrentSlug] = useState(() => {
    const hash = window.location.hash.replace(/^#/, '');
    return hash ? '/' + hash : '/';
  });

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace(/^#/, '');
      setCurrentSlug(hash ? '/' + hash : '/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const activePage =
    siteData.pages.find((p) => p.slug === currentSlug) ||
    siteData.pages.find((p) => p.slug === '/') ||
    siteData.pages[0];

  return (
    <div className="studio-site-container" dir={siteData.business.direction}>
      {activePage?.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
`;
    zip.file('src/App.tsx', appTsx);

    // 12. manifest.json
    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    // Generate ZIP buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const downloadId = `${project.id}-react-${Date.now()}`;

    const { exportStore } = await import('./exportStore');
    exportStore.set(downloadId, {
      buffer: zipBuffer,
      filename,
      mimeType: 'application/zip',
    });

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
      message: 'React source ZIP generated successfully.',
    };
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
