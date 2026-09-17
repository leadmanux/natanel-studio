import JSZip from 'jszip';
import { createEmptyProject, type Project, type SiteSection } from '../shared/project';
import { demoComponents } from '../shared/componentRegistry';
import { validateProjectForExport } from '../shared/exportValidation';
import { WordPressThemeExporter } from '../server/services/export/wordpressExporter';
import { ReactSourceExporter } from '../server/services/export/reactExporter';
import type { ExportManifest } from '../shared/exportTypes';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeValidHebrewRtlProject(): Project {
  const project = createEmptyProject('proj-hebrew-valid', 'business_website', 'סטודיו רם');
  project.business.businessName = 'סטודיו רם ארכיטקטורה';
  project.business.description = 'תכנון אדריכלי ועיצוב פנים ברמה הגבוהה ביותר בישראל.';
  project.business.direction = 'rtl';
  project.business.language = 'Hebrew';
  project.business.phone = '050-1234567';
  project.business.email = 'ram@studio-ram.co.il';
  project.brand.contentDensity = 'balanced';

  // Approved local asset
  project.assets = [
    {
      id: 'asset-hero-1',
      purpose: 'hero',
      aspectRatio: '4:3',
      status: 'approved',
      outputUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ];

  // Approved Nav Section
  const navSection: SiteSection = {
    id: 'sec-nav',
    name: 'ניווט עליון',
    componentRegistryId: 'nav-minimal-dock-01',
    purpose: 'ניווט ראשי',
    order: 1,
    motionPreset: 'fadeSettle',
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
    content: {
      brandName: 'סטודיו רם',
      brandTagline: 'אדריכלות וביצוע',
      links: [{ label: 'פרויקטים', href: '#projects' }, { label: 'אודות', href: '#about' }],
      ctaLabel: 'יצירת קשר',
    },
    assetIds: [],
  };

  // Approved Hero Section with verified content
  const heroSection: SiteSection = {
    id: 'sec-hero',
    name: 'מקטע פתיחה',
    componentRegistryId: 'hero-editorial-split-01',
    purpose: 'פתיח מרכזי',
    order: 2,
    motionPreset: 'fadeReveal',
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
    content: {
      tagline: 'סטודיו לאדריכלות',
      headline: 'תכנון מוקפד המגדיר חלל מחדש',
      subheadline: 'אנו יוצרים סביבות מגורים יוצאות דופן המשלבות דיוק הנדסי וחומריות טבעית.',
      ctaLabel: 'צפייה בעבודות',
      secondaryCtaLabel: 'תיאום פגישה',
      badge: 'מעל 120 פרויקטים בביצוע קפדני',
    },
    assetBindings: { hero: 'asset-hero-1' },
    assetIds: ['asset-hero-1'],
  };

  // Approved Footer Section
  const footerSection: SiteSection = {
    id: 'sec-footer',
    name: 'כותרת תחתונה',
    componentRegistryId: 'footer-editorial-architectural-01',
    purpose: 'סגיר',
    order: 3,
    motionPreset: 'fadeSettle',
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
    content: {
      brandName: 'סטודיו רם',
      architecturalStatement: 'כל הזכויות שמורות לסטודיו רם 2026',
    },
    assetIds: [],
  };

  project.pages = [
    {
      id: 'page-home',
      name: 'דף בית',
      slug: '/',
      purpose: 'Home page',
      sections: [navSection, heroSection, footerSection],
    },
  ];

  return project;
}

function makeValidLtrProject(): Project {
  const project = createEmptyProject('proj-ltr-valid', 'business_website', 'Atelier North');
  project.business.businessName = 'Atelier North Design';
  project.business.description = 'Architectural practice specializing in minimalist residential sanctuaries.';
  project.business.direction = 'ltr';
  project.business.language = 'English';
  project.business.phone = '+1-555-0199';
  project.business.email = 'inquiries@ateliernorth.com';

  project.assets = [
    {
      id: 'asset-hero-ltr',
      purpose: 'hero',
      aspectRatio: '4:3',
      status: 'approved',
      outputUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    },
  ];

  const heroSection: SiteSection = {
    id: 'sec-hero-ltr',
    name: 'Main Hero',
    componentRegistryId: 'hero-editorial-split-01',
    purpose: 'Lead section',
    order: 1,
    motionPreset: 'fadeReveal',
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
    content: {
      tagline: 'Architectural Practice',
      headline: 'Precision Architecture for Enduring Living',
      subheadline: 'We orchestrate residential masterworks rooted in material honesty and clean natural light.',
      ctaLabel: 'Explore Portfolio',
      secondaryCtaLabel: 'Schedule Consultation',
      badge: 'Over 85 documented residential commissions',
    },
    assetBindings: { hero: 'asset-hero-ltr' },
    assetIds: ['asset-hero-ltr'],
  };

  project.pages = [
    {
      id: 'page-home',
      name: 'Home',
      slug: '/',
      purpose: 'Main',
      sections: [heroSection],
    },
  ];

  return project;
}

async function runExportValidationSuite() {
  console.log('=== STARTING EXPORT ENGINE V1 VALIDATION TEST SUITE ===');

  // Test 1: Incomplete section blocks export
  console.log('Test 1: Incomplete section blocks export...');
  {
    const project = makeValidHebrewRtlProject();
    project.pages[0].sections[1].contentStatus = 'needs_input';
    const validation = validateProjectForExport(project, 'wordpress');
    assert(!validation.valid, 'Validation should fail when contentStatus is not "ready"');
    assert(
      validation.errors.some((e) => e.includes('needs_input') || e.includes('contentStatus')),
      'Error message should cite contentStatus'
    );
  }

  // Test 2: Unapproved content blocks export
  console.log('Test 2: Unapproved content blocks export...');
  {
    const project = makeValidHebrewRtlProject();
    project.pages[0].sections[1].contentApproved = false;
    const validation = validateProjectForExport(project, 'wordpress');
    assert(!validation.valid, 'Validation should fail when contentApproved !== true');
    assert(
      validation.errors.some((e) => e.includes('has not been approved')),
      'Error message should cite unapproved content'
    );
  }

  // Test 3: Rejected component blocks export
  console.log('Test 3: Rejected component blocks export...');
  {
    const project = makeValidHebrewRtlProject();
    // Temporarily mutate component definition
    const comp = demoComponents.find((c) => c.id === 'hero-editorial-split-01')!;
    const originalStatus = comp.status;
    try {
      (comp as any).status = 'rejected';
      const validation = validateProjectForExport(project, 'wordpress');
      assert(!validation.valid, 'Validation should fail for rejected component');
      assert(
        validation.errors.some((e) => e.includes('rejected')),
        'Error message should cite rejected status'
      );
    } finally {
      (comp as any).status = originalStatus;
    }
  }

  // Test 4: Missing mandatory asset blocks export
  console.log('Test 4: Missing mandatory asset blocks export...');
  {
    const project = makeValidHebrewRtlProject();
    project.pages[0].sections[1].missingAssetRequirements = ['hero'];
    const validation = validateProjectForExport(project, 'wordpress');
    assert(!validation.valid, 'Validation should fail when missingAssetRequirements is non-empty');
  }

  // Test 5: Invalid motion preset blocks export
  console.log('Test 5: Invalid motion blocks export...');
  {
    const project = makeValidHebrewRtlProject();
    (project.pages[0].sections[1] as any).motionPreset = 'hyper-bounce-3000';
    const validation = validateProjectForExport(project, 'wordpress');
    assert(!validation.valid, 'Validation should fail for invalid motion preset');
    assert(
      validation.errors.some((e) => e.includes('unsupported motion preset')),
      'Error message should cite unsupported motion'
    );
  }

  // Test 6: Valid Hebrew RTL project passes validation
  console.log('Test 6: Valid Hebrew RTL project passes validation...');
  {
    const project = makeValidHebrewRtlProject();
    const validation = validateProjectForExport(project, 'wordpress');
    assert(validation.valid, `Valid Hebrew RTL project should pass: ${validation.errors.join('; ')}`);
    assert(validation.errors.length === 0, 'Should have 0 errors');
  }

  // Test 7: Valid LTR project passes validation
  console.log('Test 7: Valid LTR project passes validation...');
  {
    const project = makeValidLtrProject();
    const validation = validateProjectForExport(project, 'react');
    assert(validation.valid, `Valid LTR project should pass: ${validation.errors.join('; ')}`);
    assert(validation.errors.length === 0, 'Should have 0 errors');
  }

  // Test 8: Duplicate slug blocks export
  console.log('Test 8: Duplicate slug blocks export...');
  {
    const project = makeValidHebrewRtlProject();
    project.pages.push({
      id: 'page-duplicate',
      name: 'Duplicate Page',
      slug: '/',
      purpose: 'Another home',
      sections: [project.pages[0].sections[0]],
    });
    const validation = validateProjectForExport(project, 'wordpress');
    assert(!validation.valid, 'Validation should fail on duplicate slug');
    assert(
      validation.errors.some((e) => e.includes('Duplicate page slug')),
      'Error message should cite duplicate page slug'
    );
  }

  // Test 9: WordPress ZIP contains required theme files
  console.log('Test 9: WordPress ZIP contains required theme files...');
  {
    const project = makeValidHebrewRtlProject();
    const exporter = new WordPressThemeExporter();
    const result = await exporter.export(project);
    assert(result.success, `WordPress export should succeed: ${result.message}`);

    // Retrieve generated buffer from store
    const { exportStore } = await import('../server/services/export/exportStore');
    const stored = exportStore.get(result.downloadId!);
    assert(stored, 'Stored export buffer must exist in exportStore');

    const zip = await JSZip.loadAsync(stored.buffer);
    assert(zip.file('style.css'), 'style.css must exist');
    assert(zip.file('theme.json'), 'theme.json must exist');
    assert(zip.file('functions.php'), 'functions.php must exist');
    assert(zip.file('templates/front-page.html'), 'templates/front-page.html must exist');
    assert(zip.file('templates/index.html'), 'templates/index.html must exist');
    assert(zip.file('parts/header.html'), 'parts/header.html must exist');
    assert(zip.file('parts/footer.html'), 'parts/footer.html must exist');
    assert(zip.file('manifest.json'), 'manifest.json must exist');
  }

  // Test 10: WordPress output contains no demo/Unsplash content
  console.log('Test 10: WordPress output contains no demo/Unsplash content...');
  {
    const project = makeValidHebrewRtlProject();
    const exporter = new WordPressThemeExporter();
    const result = await exporter.export(project);
    const { exportStore } = await import('../server/services/export/exportStore');
    const stored = exportStore.get(result.downloadId!);
    const zip = await JSZip.loadAsync(stored!.buffer);

    for (const [filename, file] of Object.entries(zip.files)) {
      if (!file.dir && (filename.endsWith('.html') || filename.endsWith('.json') || filename.endsWith('.css') || filename.endsWith('.php'))) {
        const text = await file.async('text');
        assert(!text.includes('images.unsplash.com'), `File ${filename} must not contain Unsplash URLs`);
        assert(!text.includes('demoComponents'), `File ${filename} must not contain demoComponents references`);
      }
    }
  }

  // Test 11: WordPress RTL export contains rtl.css
  console.log('Test 11: WordPress RTL export contains rtl.css...');
  {
    const project = makeValidHebrewRtlProject();
    const exporter = new WordPressThemeExporter();
    const result = await exporter.export(project);
    const { exportStore } = await import('../server/services/export/exportStore');
    const stored = exportStore.get(result.downloadId!);
    const zip = await JSZip.loadAsync(stored!.buffer);
    assert(zip.file('rtl.css'), 'RTL project export must contain rtl.css');
  }

  // Test 12: React ZIP contains package.json/src and no Gemini/Firebase secrets
  console.log('Test 12: React ZIP contains package.json/src and no Gemini/Firebase secrets...');
  {
    const project = makeValidLtrProject();
    const exporter = new ReactSourceExporter();
    const result = await exporter.export(project);
    assert(result.success, `React export should succeed: ${result.message}`);

    const { exportStore } = await import('../server/services/export/exportStore');
    const stored = exportStore.get(result.downloadId!);
    assert(stored, 'Stored React export must exist');

    const zip = await JSZip.loadAsync(stored!.buffer);
    assert(zip.file('package.json'), 'package.json must exist');
    assert(zip.file('vite.config.ts'), 'vite.config.ts must exist');
    assert(zip.file('tsconfig.json'), 'tsconfig.json must exist');
    assert(zip.file('index.html'), 'index.html must exist');
    assert(zip.file('README.md'), 'README.md must exist');
    assert(zip.file('src/main.tsx'), 'src/main.tsx must exist');
    assert(zip.file('src/App.tsx'), 'src/App.tsx must exist');
    assert(zip.file('src/siteData.ts'), 'src/siteData.ts must exist');
    assert(zip.file('src/styles.css'), 'src/styles.css must exist');
    assert(zip.file('src/components/SectionRenderer.tsx'), 'src/components/SectionRenderer.tsx must exist');
    assert(zip.file('manifest.json'), 'manifest.json must exist');

    // Security check: No secret keys or firebase configs
    for (const [filename, file] of Object.entries(zip.files)) {
      if (!file.dir && (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.json') || filename.endsWith('.html'))) {
        const text = await file.async('text');
        assert(!text.includes('GEMINI_API_KEY'), `${filename} must not contain GEMINI_API_KEY`);
        assert(!text.includes('FIREBASE_CONFIG'), `${filename} must not contain FIREBASE_CONFIG`);
      }
    }
  }

  // Test 13: Exported content contains supplied business content
  console.log('Test 13: Exported content contains supplied business content...');
  {
    const project = makeValidHebrewRtlProject();
    const exporter = new WordPressThemeExporter();
    const result = await exporter.export(project);
    const { exportStore } = await import('../server/services/export/exportStore');
    const stored = exportStore.get(result.downloadId!);
    const zip = await JSZip.loadAsync(stored!.buffer);

    const frontPage = await zip.file('templates/front-page.html')?.async('text');
    assert(frontPage, 'front-page.html must have text');
    assert(frontPage.includes('תכנון מוקפד המגדיר חלל מחדש'), 'Hero headline must exist in generated template');
    assert(frontPage.includes('מעל 120 פרויקטים בביצוע קפדני'), 'Proof badge must exist in generated template');
  }

  // Test 14: Manifest exists with required fields
  console.log('Test 14: Manifest exists with required fields...');
  {
    const project = makeValidHebrewRtlProject();
    const exporter = new WordPressThemeExporter();
    const result = await exporter.export(project);
    const { exportStore } = await import('../server/services/export/exportStore');
    const stored = exportStore.get(result.downloadId!);
    const zip = await JSZip.loadAsync(stored!.buffer);

    const manifestText = await zip.file('manifest.json')?.async('text');
    assert(manifestText, 'manifest.json must be present');
    const manifest = JSON.parse(manifestText) as ExportManifest;
    assert(manifest.studioVersion === '1.0.0', 'Manifest must have studioVersion');
    assert(manifest.target === 'wordpress', 'Manifest must have target wordpress');
    assert(manifest.businessName === 'סטודיו רם ארכיטקטורה', 'Manifest must have businessName');
    assert(manifest.pages.length === 1, 'Manifest must have 1 page');
    assert(manifest.componentIdsUsed.length > 0, 'Manifest must list used components');
    assert(manifest.designTokenSummary.themeMode === 'dark', 'Manifest must have design token summary');
  }

  console.log('=== ALL 14 EXPORT VALIDATION TESTS PASSED SUCCESSFULLY ===');
}

runExportValidationSuite().catch((err) => {
  console.error('Validation test suite failed:', err);
  process.exit(1);
});
