import type { Project } from '../../../shared/project';
import { demoComponents, type ComponentDefinition } from '../../../shared/componentRegistry';
import { resolveSectionAssets } from '../../../shared/assetBinding';

const componentLookup = new Map<string, ComponentDefinition>(
  demoComponents.map((component) => [component.id, component])
);

export interface ProcessedAsset {
  id: string;
  filename: string;
  buffer: Buffer;
  alt: string;
  originalUrl: string;
  aspectRatio?: string;
  slot?: string;
}

export interface CollectedProjectAssets {
  assets: ProcessedAsset[];
  urlToFilenameMap: Map<string, string>;
  idToFilenameMap: Map<string, string>;
}

/**
 * Extracts and processes only the assets actively referenced by the project's pages and sections.
 */
export async function collectAndProcessExportAssets(
  project: Project
): Promise<CollectedProjectAssets> {
  const assets: ProcessedAsset[] = [];
  const urlToFilenameMap = new Map<string, string>();
  const idToFilenameMap = new Map<string, string>();
  const processedAssetIds = new Set<string>();

  for (const page of project.pages || []) {
    for (const section of page.sections || []) {
      const component = componentLookup.get(section.componentRegistryId);
      const resolution = resolveSectionAssets(section, component, project.assets, page.id);

      for (const assetId of resolution.boundAssetIds) {
        if (processedAssetIds.has(assetId)) continue;
        processedAssetIds.add(assetId);

        const asset = project.assets.find((a) => a.id === assetId);
        if (!asset || !asset.outputUrl) continue;

        const { buffer, ext } = parseAssetData(asset.outputUrl);
        const cleanPurpose = (asset.purpose || 'image')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .slice(0, 24);

        const filename = `${cleanPurpose}-${asset.id.slice(0, 8)}.${ext}`;
        const alt = asset.purpose || `${section.name} asset`;

        const processed: ProcessedAsset = {
          id: asset.id,
          filename,
          buffer,
          alt,
          originalUrl: asset.outputUrl,
          aspectRatio: asset.aspectRatio,
        };

        assets.push(processed);
        urlToFilenameMap.set(asset.outputUrl, filename);
        idToFilenameMap.set(asset.id, filename);
      }
    }
  }

  return { assets, urlToFilenameMap, idToFilenameMap };
}

function parseAssetData(outputUrl: string): { buffer: Buffer; ext: string } {
  if (outputUrl.startsWith('data:')) {
    const match = outputUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const base64Data = match[2];
      let ext = 'png';
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('svg')) ext = 'svg';

      return {
        buffer: Buffer.from(base64Data, 'base64'),
        ext,
      };
    }
  }

  // Fallback for empty or non-base64 url
  const svgPlaceholder = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="#18181b"><rect width="800" height="600" fill="#18181b"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#71717a" font-family="sans-serif" font-size="20">Verified Studio Asset</text></svg>`,
    'utf-8'
  );
  return { buffer: svgPlaceholder, ext: 'svg' };
}

/**
 * Rewrites any occurrences of asset URLs or data URLs inside HTML markup to relative export paths.
 */
export function rewriteAssetUrlsInHtml(
  html: string,
  urlToFilenameMap: Map<string, string>,
  targetPrefix: string
): string {
  let result = html;
  for (const [originalUrl, filename] of urlToFilenameMap.entries()) {
    if (!originalUrl || originalUrl.length < 5) continue;
    // Replace all occurrences of this exact URL
    const replacement = `${targetPrefix}/${filename}`;
    result = result.split(originalUrl).join(replacement);
  }
  return result;
}
