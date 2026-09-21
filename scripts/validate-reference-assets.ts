import { createEmptyProject } from '../shared/project';
import { getFallbackAssets } from '../shared/industryTaxonomy';
import {
  orderedReferenceAssets,
  referenceAssetIds,
  referenceAssetPromptContext,
  referenceImageParts,
} from '../server/services/referenceAssetContext';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const PNG_1PX =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6Vf8AAAAASUVORK5CYII=';

function run() {
  console.log('--- SHOPIFY REFERENCE ASSET VALIDATION ---');

  const project = createEmptyProject('refs', 'shopify', 'Reference Store');
  assert(Array.isArray(project.brand.referenceAssets), 'New projects must initialize referenceAssets.');

  project.brand.referenceAssets = [
    {
      id: 'lifestyle-1',
      category: 'lifestyle',
      name: 'bathroom-ugc.jpg',
      mimeType: 'image/png',
      dataUrl: PNG_1PX,
      notes: 'Warm bathroom context',
      createdAt: '2026-01-02T00:00:00.000Z',
    },
    {
      id: 'product-side',
      category: 'product',
      name: 'device-side.jpg',
      mimeType: 'image/png',
      dataUrl: PNG_1PX,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'product-primary',
      category: 'product',
      name: 'device-front.jpg',
      mimeType: 'image/png',
      dataUrl: PNG_1PX,
      notes: 'Exact front view',
      isPrimary: true,
      createdAt: '2026-01-03T00:00:00.000Z',
    },
  ];

  const ordered = orderedReferenceAssets(project);
  assert(ordered[0].id === 'product-primary', 'Primary product reference must be first.');
  assert(ordered[1].id === 'product-side', 'Other product references must precede lifestyle references.');

  const parts = referenceImageParts(project, 8);
  assert(parts.length === 3, 'All valid data-image references should become Gemini inline image parts.');
  assert(parts[0].inlineData.mimeType === 'image/png', 'Reference image MIME type was not preserved.');

  const context = referenceAssetPromptContext(project);
  assert(context.includes('PRIMARY PRODUCT REFERENCE'), 'Prompt context must identify the primary product reference.');
  assert(context.includes('Exact front view'), 'User reference notes must reach the AI prompt context.');

  const ids = referenceAssetIds(project, 2);
  assert(ids[0] === 'product-primary' && ids[1] === 'product-side', 'Reference IDs must preserve visual priority.');

  const fallbackAssets = getFallbackAssets(project);
  assert(fallbackAssets.length > 0, 'Fallback asset planning returned no assets.');
  assert(
    fallbackAssets.every((asset) => asset.referenceAssets.includes('product-primary')),
    'Fallback image plans must retain uploaded product reference IDs.'
  );

  console.log('Shopify reference asset validation PASSED.');
}

try {
  run();
} catch (error) {
  console.error('Shopify reference asset validation FAILED.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
}
