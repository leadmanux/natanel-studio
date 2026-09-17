import type { GeneratedAsset, SiteSection } from './project';
import type { ComponentDefinition } from './componentRegistry';
import type { StudioAssetSlot } from '../src/studio-components/types';
import { getContentContract } from './contentContracts';

export interface AssetSlotRequirement {
  slot: string;
  purpose: string;
  aspectRatio: string;
  required: boolean;
}

export interface AssetBindingResult {
  assets: Record<string, StudioAssetSlot>;
  boundAssetIds: string[];
  missingMandatorySlots: AssetSlotRequirement[];
  missingOptionalSlots: AssetSlotRequirement[];
  diagnostics: string[];
}

/**
 * Deterministically resolves assets for a section and its component definition.
 * Production rules:
 * - Approved assets always outrank merely generated assets.
 * - Rejected and failed assets are never eligible.
 * - No placeholder/demo imagery is injected here.
 * - Missing mandatory slots are surfaced to the Builder/renderer.
 */
export function resolveSectionAssets(
  section: SiteSection,
  componentDefinition: ComponentDefinition | undefined,
  projectAssets: GeneratedAsset[] = [],
  pageId?: string
): AssetBindingResult {
  const assets: Record<string, StudioAssetSlot> = {};
  const boundAssetIds: string[] = [];
  const missingMandatorySlots: AssetSlotRequirement[] = [];
  const missingOptionalSlots: AssetSlotRequirement[] = [];
  const diagnostics: string[] = [];

  const contract = getContentContract(section.componentRegistryId);
  const requirements: AssetSlotRequirement[] = [];

  if (contract && contract.assetSlots.length > 0) {
    requirements.push(...contract.assetSlots);
  } else if (componentDefinition?.imageRequirements?.length) {
    for (const req of componentDefinition.imageRequirements) {
      requirements.push({
        slot: req.slot,
        purpose: req.purpose,
        aspectRatio: req.aspectRatio,
        required: req.required !== false,
      });
    }
  }

  const eligibleAssets = projectAssets
    .filter((asset) => (asset.status === 'approved' || asset.status === 'generated') && asset.outputUrl)
    .sort((a, b) => {
      const rank = (asset: GeneratedAsset) => (asset.status === 'approved' ? 0 : 1);
      return rank(a) - rank(b);
    });

  for (const req of requirements) {
    let matchedAsset: GeneratedAsset | undefined;

    if (section.assetIds?.length) {
      matchedAsset = eligibleAssets.find(
        (asset) =>
          section.assetIds.includes(asset.id) &&
          !boundAssetIds.includes(asset.id) &&
          (asset.aspectRatio === req.aspectRatio || requirements.length === 1)
      );
    }

    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (asset) =>
          asset.sectionId === section.id &&
          !boundAssetIds.includes(asset.id) &&
          (asset.purpose.toLowerCase().includes(req.slot.toLowerCase()) ||
            asset.purpose.toLowerCase().includes(req.purpose.toLowerCase()))
      );
    }

    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (asset) =>
          asset.sectionId === section.id &&
          asset.aspectRatio === req.aspectRatio &&
          !boundAssetIds.includes(asset.id)
      );
    }

    if (!matchedAsset && pageId) {
      matchedAsset = eligibleAssets.find(
        (asset) =>
          asset.pageId === pageId &&
          asset.aspectRatio === req.aspectRatio &&
          !boundAssetIds.includes(asset.id)
      );
    }

    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (asset) =>
          asset.aspectRatio === req.aspectRatio &&
          !boundAssetIds.includes(asset.id) &&
          (asset.purpose.toLowerCase().includes(req.purpose.toLowerCase()) ||
            req.purpose.toLowerCase().includes(asset.purpose.toLowerCase()))
      );
    }

    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (asset) => asset.aspectRatio === req.aspectRatio && !boundAssetIds.includes(asset.id)
      );
    }

    if (matchedAsset?.outputUrl) {
      assets[req.slot] = {
        url: matchedAsset.outputUrl,
        alt: matchedAsset.purpose || `${section.name} image`,
        aspectRatio: matchedAsset.aspectRatio,
      };
      boundAssetIds.push(matchedAsset.id);
    } else if (req.required) {
      missingMandatorySlots.push(req);
      diagnostics.push(
        `Mandatory asset slot "${req.slot}" (${req.aspectRatio}) is missing for section "${section.name}". Generate or assign an approved asset.`
      );
    } else {
      missingOptionalSlots.push(req);
    }
  }

  return {
    assets,
    boundAssetIds,
    missingMandatorySlots,
    missingOptionalSlots,
    diagnostics,
  };
}
