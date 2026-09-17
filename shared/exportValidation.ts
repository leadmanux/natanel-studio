import type { Project, SiteSection, SitePage } from './project';
import type { ComponentDefinition } from './componentRegistry';
import { hasComponentImplementation } from './componentImplementations';
import { getContentContract, validateComponentContent } from './contentContracts';
import { isStudioMotionPreset } from './studioMotion';
import { normalizeManualSlug } from './pageSlug';
import { resolveSectionAssets } from './assetBinding';
import { evaluateComponentEligibility } from './componentEligibility';
import type { ExportValidation, ExportValidationIssue, ExportTarget } from './exportTypes';

/**
 * Canonical production export validator.
 *
 * IMPORTANT: Registry data is supplied by the caller. Server export routes must pass
 * canonicalComponentStore.getAllComponents(). This keeps mutable canonical status
 * authoritative and prevents export code from silently falling back to static metadata.
 */
export function validateProjectForExport(
  project: Project,
  target: ExportTarget,
  canonicalComponents: ComponentDefinition[]
): ExportValidation {
  const issues: ExportValidationIssue[] = [];
  const componentLookup = new Map(canonicalComponents.map((component) => [component.id, component]));

  if (target !== 'wordpress' && target !== 'react') {
    issues.push({
      code: 'unsupported_export_target',
      message: `Export target "${target}" is not available in Export Engine V1.`,
      severity: 'error',
    });
  }

  if (project.projectType !== 'business_website') {
    issues.push({
      code: 'unsupported_project_type',
      message: `Export Engine V1 supports business_website projects only. Current type: "${project.projectType}".`,
      severity: 'error',
    });
  }

  if (!project.pages?.length) {
    issues.push({
      code: 'no_pages',
      message: 'The project must contain at least one page before export.',
      severity: 'error',
    });
    return finalizeValidation(issues);
  }

  const normalizedSlugs = new Set<string>();
  for (const page of project.pages) {
    const raw = page.slug?.trim() || '';
    if (!raw) {
      issues.push({
        code: 'invalid_page_slug',
        message: `Page "${page.name}" has an empty slug.`,
        severity: 'error',
        pageId: page.id,
      });
      continue;
    }

    const normalized = normalizeManualSlug(raw);
    if (normalized !== raw || !/^\/$|^\/[a-z0-9-]+$/.test(raw)) {
      issues.push({
        code: 'invalid_page_slug',
        message: `Page "${page.name}" has invalid export slug "${raw}". Use a normalized ASCII path such as /services.`,
        severity: 'error',
        pageId: page.id,
      });
    }

    const slugKey = normalized.toLowerCase();
    if (normalizedSlugs.has(slugKey)) {
      issues.push({
        code: 'duplicate_page_slug',
        message: `Duplicate page slug "${normalized}" found on page "${page.name}".`,
        severity: 'error',
        pageId: page.id,
      });
    } else {
      normalizedSlugs.add(slugKey);
    }
  }

  for (const page of project.pages) {
    if (!page.sections?.length) {
      issues.push({
        code: 'empty_page',
        message: `Page "${page.name}" (${page.slug}) does not contain any sections.`,
        severity: 'error',
        pageId: page.id,
      });
      continue;
    }

    for (const section of page.sections) {
      validateSection(section, page, project, componentLookup, issues);
    }
  }

  validateWarnings(project, componentLookup, issues);
  return finalizeValidation(issues);
}

function validateSection(
  section: SiteSection,
  page: SitePage,
  project: Project,
  componentLookup: Map<string, ComponentDefinition>,
  issues: ExportValidationIssue[]
) {
  const component = componentLookup.get(section.componentRegistryId);

  if (!component) {
    issues.push({
      code: 'unknown_component',
      message: `Section "${section.name}" references unknown canonical component "${section.componentRegistryId}".`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
    return;
  }

  if (component.status !== 'approved') {
    issues.push({
      code: 'component_not_approved',
      message: `Section "${section.name}" uses canonical component "${component.name}" with status "${component.status}".`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  if (!hasComponentImplementation(component.id)) {
    issues.push({
      code: 'component_implementation_missing',
      message: `Render implementation missing for component "${component.name}" (${component.id}).`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  const contract = getContentContract(component.id);
  if (!contract) {
    issues.push({
      code: 'content_contract_missing',
      message: `Content contract missing for component "${component.name}" (${component.id}).`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  const eligibility = evaluateComponentEligibility(component, project);
  if (!eligibility.eligible) {
    issues.push({
      code: 'component_ineligible',
      message: `Component "${component.name}" is not eligible for this project: ${eligibility.reasons.join('; ')}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  if (section.contentStatus !== 'ready') {
    issues.push({
      code: 'section_not_ready',
      message: `Section "${section.name}" contentStatus is "${section.contentStatus || 'needs_input'}"; it must be "ready".`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  if (section.contentApproved !== true) {
    issues.push({
      code: 'section_content_unapproved',
      message: `Section "${section.name}" content has not been approved in Builder.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  if (section.missingFactualFields?.length) {
    issues.push({
      code: 'missing_factual_fields',
      message: `Section "${section.name}" is missing factual fields: ${section.missingFactualFields.join(', ')}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  if (contract) {
    const contentValidation = validateComponentContent(component.id, section.content || {});
    if (!contentValidation.success) {
      issues.push({
        code: 'invalid_section_content',
        message: `Section "${section.name}" does not satisfy its content contract: ${contentValidation.errors.join('; ')}.`,
        severity: 'error',
        pageId: page.id,
        sectionId: section.id,
      });
    }
  }

  if (section.missingAssetRequirements?.length) {
    issues.push({
      code: 'missing_asset_requirements',
      message: `Section "${section.name}" is missing required assets: ${section.missingAssetRequirements.join(', ')}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  const resolution = resolveSectionAssets(section, component, project.assets, page.id);
  if (resolution.missingMandatorySlots.length) {
    issues.push({
      code: 'missing_mandatory_asset_slot',
      message: `Section "${section.name}" is missing mandatory asset slots: ${resolution.missingMandatorySlots.map((item) => item.slot).join(', ')}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  for (const assetId of resolution.boundAssetIds) {
    const asset = project.assets.find((candidate) => candidate.id === assetId);
    if (!asset?.outputUrl?.trim()) {
      issues.push({
        code: 'bound_asset_no_url',
        message: `Bound asset "${assetId}" for section "${section.name}" has no outputUrl.`,
        severity: 'error',
        pageId: page.id,
        sectionId: section.id,
      });
    }
  }

  if (section.motionPreset && !isStudioMotionPreset(section.motionPreset)) {
    issues.push({
      code: 'invalid_motion_preset',
      message: `Section "${section.name}" specifies unsupported motion preset "${section.motionPreset}".`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }
}

function validateWarnings(
  project: Project,
  componentLookup: Map<string, ComponentDefinition>,
  issues: ExportValidationIssue[]
) {
  if (!project.brand.logoAssets?.length) {
    issues.push({
      code: 'no_favicon_or_logo',
      message: 'No logo or favicon asset is present in the brand profile.',
      severity: 'warning',
    });
  }

  if (!project.business.description?.trim() || project.business.description.trim().length < 20) {
    issues.push({
      code: 'short_seo_description',
      message: 'Business description is short or missing; search snippets may be weak.',
      severity: 'warning',
    });
  }

  const hasSocialAsset = project.assets.some((asset) =>
    (asset.status === 'approved' || asset.status === 'generated') &&
    Boolean(asset.outputUrl) &&
    (asset.purpose.toLowerCase().includes('social') || asset.purpose.toLowerCase().includes('og') || asset.aspectRatio === '16:9')
  );
  if (!hasSocialAsset) {
    issues.push({
      code: 'no_social_image',
      message: 'No approved/generated social sharing image was found.',
      severity: 'warning',
    });
  }

  if (!project.business.phone?.trim() && !project.business.email?.trim() && !project.business.whatsapp?.trim()) {
    issues.push({
      code: 'no_contact_details',
      message: 'No phone, email, or WhatsApp contact information is present.',
      severity: 'warning',
    });
  }

  for (const page of project.pages) {
    for (const section of page.sections || []) {
      const component = componentLookup.get(section.componentRegistryId);
      if (!component) continue;
      const resolution = resolveSectionAssets(section, component, project.assets, page.id);
      if (resolution.missingOptionalSlots.length) {
        issues.push({
          code: 'missing_optional_asset',
          message: `Section "${section.name}" has unfilled optional asset slots: ${resolution.missingOptionalSlots.map((item) => item.slot).join(', ')}.`,
          severity: 'warning',
          pageId: page.id,
          sectionId: section.id,
        });
      }
    }
  }
}

function finalizeValidation(issues: ExportValidationIssue[]): ExportValidation {
  return {
    valid: !issues.some((issue) => issue.severity === 'error'),
    errors: issues.filter((issue) => issue.severity === 'error').map((issue) => issue.message),
    warnings: issues.filter((issue) => issue.severity === 'warning').map((issue) => issue.message),
    issues,
  };
}
