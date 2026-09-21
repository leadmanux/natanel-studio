import type { GeneratedAsset, Project, ProjectReferenceAsset } from './project';

function purposeForReference(asset: ProjectReferenceAsset): string {
  const note = asset.notes?.trim();
  const base =
    asset.category === 'product'
      ? asset.isPrimary
        ? 'Uploaded primary product reference'
        : 'Uploaded product reference'
      : asset.category === 'lifestyle'
        ? 'Uploaded lifestyle reference'
        : asset.category === 'packaging'
          ? 'Uploaded packaging reference'
          : asset.category === 'logo'
            ? 'Uploaded brand logo'
            : 'Uploaded visual inspiration';

  return note ? `${base}: ${note}` : `${base}: ${asset.name}`;
}

function toGeneratedAsset(asset: ProjectReferenceAsset): GeneratedAsset {
  return {
    id: asset.id,
    type: asset.category === 'logo' ? 'logo' : 'image',
    purpose: purposeForReference(asset),
    prompt: '',
    aspectRatio: asset.aspectRatio || '1:1',
    resolution: '1K',
    referenceAssets: [],
    model: 'uploaded-reference',
    source: 'uploaded',
    referenceCategory: asset.category,
    status: 'approved',
    outputUrl: asset.dataUrl,
    createdAt: asset.createdAt,
    visualConsistencyInstructions:
      asset.category === 'product'
        ? 'User-supplied real product reference. Preserve visible product identity.'
        : undefined,
  };
}

/**
 * Reference uploads are both AI grounding inputs and real production assets.
 * This keeps them usable when image generation is unavailable or unnecessary.
 */
export function syncReferenceAssetsIntoProject(project: Project): Project {
  const references = project.brand.referenceAssets || [];
  if (!references.length) return project;

  const referenceIds = new Set(references.map((asset) => asset.id));
  const nonReferenceAssets = (project.assets || []).filter(
    (asset) => asset.source !== 'uploaded' && !referenceIds.has(asset.id)
  );
  const importedAssets = references.map(toGeneratedAsset);
  const logoUrls = references
    .filter((asset) => asset.category === 'logo')
    .map((asset) => asset.dataUrl);

  return {
    ...project,
    brand: {
      ...project.brand,
      referenceAssets: references,
      logoAssets: logoUrls.length ? logoUrls : project.brand.logoAssets || [],
    },
    assets: [...importedAssets, ...nonReferenceAssets],
  };
}
