import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import JSZip from 'jszip';
import { createEmptyProject, type Project, type SiteSection } from '../shared/project';
import { demoComponents, type ComponentDefinition } from '../shared/componentRegistry';
import { STUDIO_MOTION_PRESETS } from '../shared/studioMotion';
import { validateProjectForExport } from '../shared/exportValidation';
import { WordPressThemeExporter } from '../server/services/export/wordpressExporter';
import { ReactSourceExporter } from '../server/services/export/reactExporter';
import { exportStore } from '../server/services/export/exportStore';
import { fetchRemoteAsset } from '../server/services/export/exportAssetHelper';
import type { ExportManifest } from '../shared/exportTypes';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function testRegistry(): ComponentDefinition[] {
  return demoComponents.map((component) => ({ ...component }));
}

function readySection(partial: Omit<SiteSection, 'contentStatus' | 'contentApproved' | 'missingFactualFields' | 'missingAssetRequirements'>): SiteSection {
  return {
    ...partial,
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
  };
}

function makeProject(direction: 'ltr' | 'rtl' = 'ltr'): Project {
  const project = createEmptyProject(`project-${direction}`, 'business_website', direction === 'rtl' ? 'סטודיו רם' : 'Atelier North');
  project.business.businessName = direction === 'rtl' ? 'סטודיו רם אדריכלות' : 'Atelier North Design';
  project.business.description = direction === 'rtl'
    ? 'סטודיו לאדריכלות ועיצוב פנים המתמחה בחללי מגורים מוקפדים.'
    : 'An architectural practice creating precise residential spaces with restrained material design.';
  project.business.direction = direction;
  project.business.language = direction === 'rtl' ? 'Hebrew' : 'English';
  project.business.phone = direction === 'rtl' ? '050-1234567' : '+1-555-0199';
  project.business.email = direction === 'rtl' ? 'studio@example.co.il' : 'hello@example.com';
  project.designSystem.artDirection = 'Editorial architectural restraint';
  project.designSystem.typography = 'Plus Jakarta Sans with editorial serif display';
  project.designSystem.colors = ['#101214', '#1a1d20', '#b89a68'];
  project.designSystem.borderRadius = '4px subtle';
  project.designSystem.density = 'editorial';

  project.assets = [{
    id: 'asset-hero',
    purpose: 'hero editorial image',
    aspectRatio: '4:5',
    status: 'approved',
    outputUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  }];

  const nav = readySection({
    id: 'sec-nav',
    name: 'Navigation',
    componentRegistryId: 'nav-minimal-dock-01',
    purpose: 'Primary navigation',
    order: 1,
    motionPreset: 'none',
    content: {
      brandName: project.business.businessName,
      links: [
        { label: direction === 'rtl' ? 'ראשי' : 'Home', href: '/' },
        { label: direction === 'rtl' ? 'אודות' : 'About', href: '/about' },
      ],
      ctaLabel: direction === 'rtl' ? 'יצירת קשר' : 'Contact',
      ctaHref: '/about',
    },
    assetIds: [],
  });

  const hero = readySection({
    id: 'sec-hero',
    name: 'Hero',
    componentRegistryId: 'hero-editorial-split-01',
    purpose: 'Primary introduction',
    order: 2,
    motionPreset: 'clipReveal',
    content: {
      tagline: direction === 'rtl' ? 'אדריכלות מדויקת' : 'Architectural Practice',
      headline: direction === 'rtl' ? 'תכנון מוקפד שמגדיר חלל מחדש' : 'Precision Architecture for Enduring Living',
      subheadline: direction === 'rtl' ? 'חללים שקטים עם חומריות טבעית.' : 'Quiet spaces shaped by material clarity.',
      ctaLabel: direction === 'rtl' ? 'לצפייה בפרויקטים' : 'Explore work',
    },
    assetBindings: { hero: 'asset-hero' },
    assetIds: ['asset-hero'],
  });

  const cta = readySection({
    id: 'sec-cta',
    name: 'Closing CTA',
    componentRegistryId: 'cta-monumental-statement-01',
    purpose: 'Closing action',
    order: 3,
    motionPreset: 'fadeSettle',
    content: {
      kicker: direction === 'rtl' ? 'מתחילים' : 'Begin',
      statementHeadline: direction === 'rtl' ? 'בואו נתכנן את החלל הבא' : 'Let us shape the next space',
      primaryCtaLabel: direction === 'rtl' ? 'תיאום פגישה' : 'Schedule a consultation',
      primaryCtaHref: '/about',
    },
    assetIds: [],
  });

  const footer = readySection({
    id: 'sec-footer',
    name: 'Footer',
    componentRegistryId: 'footer-editorial-architectural-01',
    purpose: 'Global footer',
    order: 4,
    motionPreset: 'none',
    content: {
      brandName: project.business.businessName,
      copyright: direction === 'rtl' ? 'כל הזכויות שמורות' : 'All rights reserved',
    },
    assetIds: [],
  });

  project.pages = [{ id: 'home', name: direction === 'rtl' ? 'ראשי' : 'Home', slug: '/', purpose: 'Home', sections: [nav, hero, cta, footer] }];
  return project;
}

async function loadExportZip(result: { downloadId?: string }): Promise<JSZip> {
  assert(result.downloadId, 'Exporter did not return downloadId.');
  const stored = exportStore.get(result.downloadId);
  assert(stored, 'Generated ZIP was not placed in exportStore.');
  return JSZip.loadAsync(stored.buffer);
}

async function zipText(zip: JSZip, filename: string): Promise<string> {
  const file = zip.file(filename);
  assert(file, `ZIP missing ${filename}`);
  return file.async('text');
}

async function extractZip(zip: JSZip, directory: string) {
  for (const [filename, entry] of Object.entries(zip.files)) {
    const destination = path.join(directory, filename);
    if (entry.dir) {
      fs.mkdirSync(destination, { recursive: true });
      continue;
    }
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, await entry.async('nodebuffer'));
  }
}

async function run() {
  console.log('--- EXPORT ENGINE INTEGRITY VALIDATION ---');
  const canonical = testRegistry();

  // Canonical registry is supplied explicitly and controls approval status.
  const rejectedRegistry = canonical.map((component) =>
    component.id === 'hero-editorial-split-01' ? { ...component, status: 'rejected' as const } : component
  );
  assert(!validateProjectForExport(makeProject(), 'wordpress', rejectedRegistry).valid, 'Rejected canonical component did not block export.');
  assert(demoComponents.find((component) => component.id === 'hero-editorial-split-01')?.status === 'approved', 'Test mutated static registry metadata.');

  const incomplete = makeProject();
  incomplete.pages[0].sections[1].contentStatus = 'needs_input';
  assert(!validateProjectForExport(incomplete, 'wordpress', canonical).valid, 'Incomplete section did not block export.');

  const unapproved = makeProject();
  unapproved.pages[0].sections[1].contentApproved = false;
  assert(!validateProjectForExport(unapproved, 'wordpress', canonical).valid, 'Unapproved section did not block export.');

  const missingAsset = makeProject();
  missingAsset.pages[0].sections[1].assetBindings = {};
  missingAsset.pages[0].sections[1].assetIds = [];
  missingAsset.assets = [];
  assert(!validateProjectForExport(missingAsset, 'wordpress', canonical).valid, 'Missing mandatory asset did not block export.');

  const invalidMotion = makeProject();
  invalidMotion.pages[0].sections[1].motionPreset = 'cinematicReveal';
  assert(!validateProjectForExport(invalidMotion, 'react', canonical).valid, 'Invalid motion did not block export.');

  const duplicateSlug = makeProject();
  duplicateSlug.pages.push({ id: 'duplicate', name: 'Duplicate', slug: '/', purpose: 'Duplicate', sections: [duplicateSlug.pages[0].sections[2]] });
  assert(!validateProjectForExport(duplicateSlug, 'wordpress', canonical).valid, 'Duplicate slug did not block export.');

  assert(validateProjectForExport(makeProject('ltr'), 'react', canonical).valid, 'Valid LTR project failed validation.');
  assert(validateProjectForExport(makeProject('rtl'), 'wordpress', canonical).valid, 'Valid RTL project failed validation.');

  // Remote asset fetch is real, MIME checked, and injectable for deterministic tests.
  const remote = await fetchRemoteAsset('https://assets.example.com/photo.png', {
    resolveHostname: async () => ['93.184.216.34'],
    fetchImpl: (async () => new Response(Uint8Array.from([137, 80, 78, 71]), {
      status: 200,
      headers: { 'content-type': 'image/png', 'content-length': '4' },
    })) as typeof fetch,
  });
  assert(remote.ext === 'png' && remote.buffer.length === 4, 'HTTPS asset localization did not preserve real bytes.');

  const remoteFailureProject = makeProject();
  remoteFailureProject.assets[0].outputUrl = 'https://assets.example.com/missing.png';
  const remoteFailureExporter = new WordPressThemeExporter(canonical, {
    resolveHostname: async () => ['93.184.216.34'],
    fetchImpl: (async () => new Response('not found', { status: 404 })) as typeof fetch,
  });
  const remoteFailureResult = await remoteFailureExporter.export(remoteFailureProject);
  assert(!remoteFailureResult.success, 'Failed required remote asset did not fail export.');
  assert(remoteFailureResult.validation.issues.some((issue) => issue.code === 'asset_localization_failed'), 'Remote asset failure was not reported structurally.');

  // WordPress package integrity.
  const wpProject = makeProject('rtl');
  const wpResult = await new WordPressThemeExporter(canonical).export(wpProject);
  assert(wpResult.success, `WordPress export failed: ${wpResult.message}`);
  const wpZip = await loadExportZip(wpResult);
  const requiredWpFiles = [
    'style.css', 'theme.json', 'functions.php', 'templates/index.html', 'templates/front-page.html',
    'templates/page.html', 'parts/header.html', 'parts/footer.html', 'assets/css/theme.css',
    'assets/js/theme.js', 'manifest.json', 'rtl.css',
  ];
  requiredWpFiles.forEach((filename) => assert(wpZip.file(filename), `WordPress ZIP missing ${filename}.`));
  JSON.parse(await zipText(wpZip, 'theme.json'));
  const wpManifest = JSON.parse(await zipText(wpZip, 'manifest.json')) as ExportManifest;
  assert(wpManifest.assetIdsUsed.length === 1 && wpManifest.assetIdsUsed[0] === 'asset-hero', 'Manifest asset IDs do not equal actually exported assets.');

  const frontPage = await zipText(wpZip, 'templates/front-page.html');
  assert((frontPage.match(/template-part \{\"slug\":\"header\"/g) || []).length === 1, 'WordPress front page contains duplicate header template parts.');
  assert((frontPage.match(/template-part \{\"slug\":\"footer\"/g) || []).length === 1, 'WordPress front page contains duplicate footer template parts.');
  assert(!frontPage.includes('assets/images/'), 'WordPress template contains page-relative asset URL.');

  const patternFiles = Object.keys(wpZip.files).filter((name) => name.startsWith('patterns/') && name.endsWith('.php'));
  assert(patternFiles.length >= 3, 'Expected generated WordPress patterns.');
  let sawThemeUri = false;
  for (const filename of patternFiles) {
    const text = await zipText(wpZip, filename);
    assert(!text.includes('Verified Studio Asset'), `${filename} contains forbidden placeholder artwork.`);
    assert(!text.includes('images.unsplash.com'), `${filename} contains Unsplash fallback.`);
    if (text.includes('assets/images/')) {
      assert(text.includes('get_template_directory_uri()'), `${filename} does not resolve assets through the installed theme directory.`);
      sawThemeUri = true;
      for (const match of text.matchAll(/assets\/images\/([a-z0-9.-]+)/g)) {
        assert(wpZip.file(`assets/images/${match[1]}`), `${filename} references missing localized asset ${match[1]}.`);
      }
    }
  }
  assert(sawThemeUri, 'No WordPress pattern exercised installed-theme asset resolution.');

  // React package must contain exact canonical component markup and strict routing.
  const reactProject = makeProject('ltr');
  const reactResult = await new ReactSourceExporter(canonical).export(reactProject);
  assert(reactResult.success, `React export failed: ${reactResult.message}`);
  const reactZip = await loadExportZip(reactResult);
  ['package.json', 'vite.config.ts', 'tsconfig.json', 'index.html', 'src/main.tsx', 'src/App.tsx', 'src/siteData.ts', 'src/components/SectionFrame.tsx', 'src/styles.css', 'manifest.json'].forEach((filename) => {
    assert(reactZip.file(filename), `React ZIP missing ${filename}.`);
  });

  const siteDataSource = await zipText(reactZip, 'src/siteData.ts');
  assert(siteDataSource.includes('Precision Architecture for Enduring Living'), 'React export lost supplied hero content.');
  assert(siteDataSource.includes('Let us shape the next space'), 'React export lost supplied CTA content.');
  assert(!siteDataSource.includes('Generic fallback'), 'React export contains generic substitute renderer output.');
  assert(!siteDataSource.includes('Verified Studio Asset'), 'React export contains placeholder artwork.');
  assert(!siteDataSource.includes('images.unsplash.com'), 'React export contains Unsplash fallback.');
  for (const preset of [...siteDataSource.matchAll(/"motionPreset":\s*"([^"]+)"/g)].map((match) => match[1])) {
    assert(STUDIO_MOTION_PRESETS.includes(preset as any), `React export emitted non-canonical motion preset ${preset}.`);
  }

  const appSource = await zipText(reactZip, 'src/App.tsx');
  assert(appSource.includes('if (!page)'), 'React export does not render a strict Not Found state.');
  assert(!appSource.includes("||\n    siteData.pages.find"), 'React route silently falls back to another page.');
  const sharedExportersSource = fs.readFileSync(path.resolve('shared/exporters.ts'), 'utf8');
  assert(!sharedExportersSource.includes('class WordPressExporter'), 'Duplicate placeholder WordPress exporter still exists.');
  assert(!sharedExportersSource.includes('class ReactExporter'), 'Duplicate placeholder React exporter still exists.');

  // No secrets, Studio API calls, demo URLs, or placeholder assets inside text files.
  for (const [filename, entry] of Object.entries(reactZip.files)) {
    if (entry.dir || !/\.(ts|tsx|json|html|css|md)$/.test(filename)) continue;
    const text = await entry.async('text');
    for (const forbidden of ['GEMINI_API_KEY', 'FIREBASE_CONFIG', '/api/ai/', '/api/export/', 'images.unsplash.com', 'Verified Studio Asset']) {
      assert(!text.includes(forbidden), `${filename} contains forbidden runtime/export string ${forbidden}.`);
    }
  }

  // Build the generated React project itself with the already-installed root toolchain.
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'natanel-react-export-'));
  try {
    await extractZip(reactZip, tempRoot);
    fs.symlinkSync(path.resolve('node_modules'), path.join(tempRoot, 'node_modules'), 'dir');
    execFileSync('npm', ['run', 'build'], { cwd: tempRoot, stdio: 'pipe', env: process.env });
    assert(fs.existsSync(path.join(tempRoot, 'dist', 'index.html')), 'Generated React project build did not produce dist/index.html.');
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }

  console.log('Export Engine integrity validation PASSED.');
}

run().catch((error) => {
  console.error('Export Engine integrity validation FAILED.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
});
