import type { Project, ProjectReferenceAsset, ReferenceAssetCategory } from '../../shared/project';

export interface GeminiInlineImagePart {
  inlineData: {
    mimeType: string;
    data: string;
  };
}

const PRIORITY: Record<ReferenceAssetCategory, number> = {
  product: 0,
  lifestyle: 1,
  packaging: 2,
  logo: 3,
  inspiration: 4,
};

export function orderedReferenceAssets(project: Project): ProjectReferenceAsset[] {
  return [...(project.brand.referenceAssets || [])].sort((a, b) => {
    if (Boolean(a.isPrimary) !== Boolean(b.isPrimary)) return a.isPrimary ? -1 : 1;
    const categoryDelta = PRIORITY[a.category] - PRIORITY[b.category];
    if (categoryDelta !== 0) return categoryDelta;
    return a.createdAt.localeCompare(b.createdAt);
  });
}

export function referenceImageParts(
  project: Project,
  limit = 8
): GeminiInlineImagePart[] {
  const parts: GeminiInlineImagePart[] = [];

  for (const asset of orderedReferenceAssets(project).slice(0, limit)) {
    const match = asset.dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) continue;
    parts.push({
      inlineData: {
        mimeType: match[1],
        data: match[2],
      },
    });
  }

  return parts;
}

export function referenceAssetPromptContext(project: Project, limit = 8): string {
  const assets = orderedReferenceAssets(project).slice(0, limit);
  if (!assets.length) return 'No uploaded product or brand image references were supplied.';

  return assets
    .map((asset, index) => {
      const primary = asset.isPrimary ? ' PRIMARY PRODUCT REFERENCE' : '';
      const note = asset.notes?.trim() ? ` — user note: ${asset.notes.trim()}` : '';
      return `${index + 1}. [${asset.category.toUpperCase()}${primary}] ${asset.name}${note}`;
    })
    .join('\n');
}

export function referenceAssetIds(project: Project, limit = 6): string[] {
  return orderedReferenceAssets(project).slice(0, limit).map((asset) => asset.id);
}
