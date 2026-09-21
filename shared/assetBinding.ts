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

function rank(asset: GeneratedAsset): number {
  return asset.status === 'approved' ? 0 : 1;
}

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

  if (contract?.assetSlots.length) {
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
    .sort((a, b) => rank(a) - rank(b));

  for (const req of requirements) {
    let matchedAsset: GeneratedAsset | undefined;

    // Explicit Builder slot assignment always wins if the asset is still eligible.
    const explicitId = section.assetBindings?.[req.slot];
    if (explicitId) {
      matchedAsset = eligibleAssets.find((asset) => asset.id === explicitId);
      if (!matchedAsset) {
        diagnostics.push(`Explicit asset binding for slot "${req.slot}" is no longer eligible or has no output URL.`);
      }
    }

    // Uploaded references are real production assets. Prefer them semantically even when
    // their source crop does not exactly match the slot ratio; the renderer can crop them.
    if (!matchedAsset) {
      const semantic = `${req.slot} ${req.purpose}`.toLowerCase();
      if (/logo|emblem|brand mark/.test(semantic)) {
        matchedAsset = eligibleAssets.find(
          (asset) => asset.type === 'logo' || asset.referenceCategory === 'logo'
        );
      } else if (/product|specimen|packshot|detail/.test(semantic)) {
        matchedAsset = eligibleAssets.find(
          (asset) =>
            asset.source === 'uploaded' &&
            (asset.referenceCategory === 'product' || asset.referenceCategory === 'packaging') &&
            !boundAssetIds.includes(asset.id)
        );
      } else if (/lifestyle|ugc|portrait|usage|campaign/.test(semantic)) {
        matchedAsset = eligibleAssets.find(
          (asset) =>
            asset.source === 'uploaded' &&
            asset.referenceCategory === 'lifestyle' &&
            !boundAssetIds.includes(asset.id)
        );
      }
    }

    // Backwards-compatible flat asset IDs.
    if (!matchedAsset && section.assetIds?.length) {
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
        (asset) => asset.sectionId === section.id && asset.aspectRatio === req.aspectRatio && !boundAssetIds.includes(asset.id)
      );
    }

    if (!matchedAsset && pageId) {
      matchedAsset = eligibleAssets.find(
        (asset) => asset.pageId === pageId && asset.aspectRatio === req.aspectRatio && !boundAssetIds.includes(asset.id)
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
      diagnostics.push(`Mandatory asset slot "${req.slot}" (${req.aspectRatio}) is missing for section "${section.name}".`);
    } else {
      missingOptionalSlots.push(req);
    }
  }

  return { assets, boundAssetIds, missingMandatorySlots, missingOptionalSlots, diagnostics };
}
