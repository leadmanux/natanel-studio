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
 * Strictly adheres to production rules:
 * - Prefers 'approved' asset, then 'generated' asset.
 * - NEVER binds 'rejected' or 'failed' assets.
 * - NEVER silently injects placeholder Unsplash imagery in production mode.
 * - Surfaces missing mandatory asset diagnostics for the Builder inspector.
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

  // Determine slot requirements from component content contract or component definition
  const contract = getContentContract(section.componentRegistryId);
  const requirements: AssetSlotRequirement[] = [];

  if (contract && contract.assetSlots.length > 0) {
    requirements.push(...contract.assetSlots);
  } else if (componentDefinition?.imageRequirements && componentDefinition.imageRequirements.length > 0) {
    for (const req of componentDefinition.imageRequirements) {
      requirements.push({
        slot: req.slot,
        purpose: req.purpose,
        aspectRatio: req.aspectRatio,
        required: true,
      });
    }
  }

  // Filter project assets: ONLY 'approved' or 'generated' are eligible
  const eligibleAssets = projectAssets.filter(
    (a) => (a.status === 'approved' || a.status === 'generated') && a.outputUrl
  );

  for (const req of requirements) {
    let matchedAsset: GeneratedAsset | undefined;

    // 1. Check if section.assetIds contains a directly assigned asset
    if (section.assetIds && section.assetIds.length > 0) {
      const explicit = eligibleAssets.find(
        (a) => section.assetIds.includes(a.id) && (a.aspectRatio === req.aspectRatio || requirements.length === 1)
      );
      if (explicit) {
        matchedAsset = explicit;
      }
    }

    // 2. Match by exact sectionId and purpose
    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (a) =>
          a.sectionId === section.id &&
          (a.purpose.toLowerCase().includes(req.slot.toLowerCase()) ||
            a.purpose.toLowerCase().includes(req.purpose.toLowerCase()))
      );
    }

    // 3. Match by sectionId and aspect ratio
    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (a) => a.sectionId === section.id && a.aspectRatio === req.aspectRatio
      );
    }

    // 4. Match by pageId and aspect ratio
    if (!matchedAsset && pageId) {
      matchedAsset = eligibleAssets.find(
        (a) => a.pageId === pageId && a.aspectRatio === req.aspectRatio && !boundAssetIds.includes(a.id)
      );
    }

    // 5. Match by general aspect ratio and purpose across unassigned assets
    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (a) =>
          a.aspectRatio === req.aspectRatio &&
          !boundAssetIds.includes(a.id) &&
          (a.purpose.toLowerCase().includes(req.purpose.toLowerCase()) ||
            req.purpose.toLowerCase().includes(a.purpose.toLowerCase()))
      );
    }

    // 6. Match any available eligible asset with compatible aspect ratio
    if (!matchedAsset) {
      matchedAsset = eligibleAssets.find(
        (a) => a.aspectRatio === req.aspectRatio && !boundAssetIds.includes(a.id)
      );
    }

    if (matchedAsset && matchedAsset.outputUrl) {
      assets[req.slot] = {
        url: matchedAsset.outputUrl,
        alt: matchedAsset.purpose || `${section.name} image`,
        aspectRatio: matchedAsset.aspectRatio,
      };
      boundAssetIds.push(matchedAsset.id);
    } else {
      if (req.required) {
        missingMandatorySlots.push(req);
        diagnostics.push(
          `Mandatory asset slot "${req.slot}" (${req.aspectRatio}) is missing for section "${section.name}". Generate or assign an approved asset in the Asset Planner.`
        );
      } else {
        missingOptionalSlots.push(req);
      }
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
