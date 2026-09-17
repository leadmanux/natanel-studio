import type { Project, SiteSection, SitePage } from './project';
import { demoComponents, type ComponentDefinition } from './componentRegistry';
import { hasComponentImplementation } from './componentImplementations';
import { getContentContract } from './contentContracts';
import { isStudioMotionPreset } from './studioMotion';
import { normalizeManualSlug } from './pageSlug';
import { resolveSectionAssets } from './assetBinding';
import { evaluateComponentEligibility } from './componentEligibility';
import type { ExportValidation, ExportValidationIssue, ExportTarget } from './exportTypes';

const componentLookup = new Map<string, ComponentDefinition>(
  demoComponents.map((component) => [component.id, component])
);

/**
 * Validates a business website project against all production export requirements.
 * Reusable across client UI, server export routes, and validation test suite.
 */
export function validateProjectForExport(
  project: Project,
  target?: ExportTarget
): ExportValidation {
  const issues: ExportValidationIssue[] = [];

  // 1. Project Type Check (Currently only business_website is exportable)
  if (project.projectType !== 'business_website') {
    issues.push({
      code: 'unsupported_project_type',
      message: `Export is currently supported for business_website projects only. Current type: "${project.projectType}".`,
      severity: 'error',
    });
  }

  // 2. Pages Presence Check
  if (!project.pages || project.pages.length === 0) {
    issues.push({
      code: 'no_pages',
      message: 'The project must contain at least one page before export.',
      severity: 'error',
    });
    return finalizeValidation(issues);
  }

  // 3. Page Slugs Uniqueness and Validity Check
  const normalizedSlugs = new Set<string>();
  for (const page of project.pages) {
    if (!page.slug || page.slug.trim() === '') {
      issues.push({
        code: 'invalid_page_slug',
        message: `Page "${page.name}" has an empty or invalid slug.`,
        severity: 'error',
        pageId: page.id,
      });
      continue;
    }

    const normalized = normalizeManualSlug(page.slug);
    if (normalizedSlugs.has(normalized)) {
      issues.push({
        code: 'duplicate_page_slug',
        message: `Duplicate page slug "${normalized}" found on page "${page.name}". Slugs must be unique across all pages.`,
        severity: 'error',
        pageId: page.id,
      });
    } else {
      normalizedSlugs.add(normalized);
    }
  }

  // 4. Per-Page & Per-Section Validation
  for (const page of project.pages) {
    if (!page.sections || page.sections.length === 0) {
      issues.push({
        code: 'empty_page',
        message: `Page "${page.name}" (${page.slug}) does not contain any sections.`,
        severity: 'error',
        pageId: page.id,
      });
      continue;
    }

    for (const section of page.sections) {
      validateSection(section, page, project, issues);
    }
  }

  // 5. Warnings (Non-blocking notices for SEO, brand, and media completeness)
  validateWarnings(project, issues);

  return finalizeValidation(issues);
}

function validateSection(
  section: SiteSection,
  page: SitePage,
  project: Project,
  issues: ExportValidationIssue[]
) {
  const component = componentLookup.get(section.componentRegistryId);

  // A. Canonical component existence
  if (!component) {
    issues.push({
      code: 'unknown_component',
      message: `Section "${section.name}" references an unknown component ID: "${section.componentRegistryId}".`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
    return;
  }

  // B. Canonical component status: must be approved
  if (component.status !== 'approved') {
    issues.push({
      code: 'component_not_approved',
      message: `Section "${section.name}" uses component "${component.name}" which is in "${component.status}" status (must be approved).`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  // C. Component implementation existence
  if (!hasComponentImplementation(component.id)) {
    issues.push({
      code: 'component_implementation_missing',
      message: `Render implementation missing for component "${component.name}" (${component.id}).`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  // D. Content contract existence
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

  // E. Eligibility check (e.g. RTL support, project type support)
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

  // F. Section Content Status (must be 'ready')
  if (section.contentStatus !== 'ready') {
    issues.push({
      code: 'section_not_ready',
      message: `Section "${section.name}" contentStatus is "${section.contentStatus || 'needs_input'}" (must be "ready").`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  // G. Section Content Approved (must be true)
  if (section.contentApproved !== true) {
    issues.push({
      code: 'section_content_unapproved',
      message: `Section "${section.name}" content has not been approved. Review and approve the section in the Builder before exporting.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  // H. Mandatory Factual Fields Missing
  if (section.missingFactualFields && section.missingFactualFields.length > 0) {
    issues.push({
      code: 'missing_factual_fields',
      message: `Section "${section.name}" is missing mandatory factual fields: ${section.missingFactualFields.join(', ')}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  // Required content schema fields check
  if (contract?.requiredFields && contract.requiredFields.length > 0) {
    for (const field of contract.requiredFields) {
      const val = section.content ? section.content[field] : undefined;
      const isMissing =
        val === undefined ||
        val === null ||
        (typeof val === 'string' && val.trim() === '');

      if (isMissing) {
        issues.push({
          code: 'missing_required_field',
          message: `Section "${section.name}" is missing required schema field: "${field}".`,
          severity: 'error',
          pageId: page.id,
          sectionId: section.id,
        });
      }
    }
  }

  // I. Mandatory Assets & Bound Assets Verification
  if (section.missingAssetRequirements && section.missingAssetRequirements.length > 0) {
    issues.push({
      code: 'missing_asset_requirements',
      message: `Section "${section.name}" is missing required assets: ${section.missingAssetRequirements.join(', ')}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  const assetResolution = resolveSectionAssets(section, component, project.assets, page.id);
  if (assetResolution.missingMandatorySlots.length > 0) {
    const slotNames = assetResolution.missingMandatorySlots.map((s) => s.slot).join(', ');
    issues.push({
      code: 'missing_mandatory_asset_slot',
      message: `Section "${section.name}" is missing mandatory asset slots: ${slotNames}.`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }

  // Verify bound assets have actual outputUrl
  for (const assetId of assetResolution.boundAssetIds) {
    const boundAsset = project.assets.find((a) => a.id === assetId);
    if (!boundAsset || !boundAsset.outputUrl || boundAsset.outputUrl.trim() === '') {
      issues.push({
        code: 'bound_asset_no_url',
        message: `Bound asset "${assetId}" for section "${section.name}" has no valid outputUrl.`,
        severity: 'error',
        pageId: page.id,
        sectionId: section.id,
      });
    }
  }

  // J. Motion Preset Verification
  if (section.motionPreset && !isStudioMotionPreset(section.motionPreset)) {
    issues.push({
      code: 'invalid_motion_preset',
      message: `Section "${section.name}" specifies unsupported motion preset: "${section.motionPreset}".`,
      severity: 'error',
      pageId: page.id,
      sectionId: section.id,
    });
  }
}

function validateWarnings(project: Project, issues: ExportValidationIssue[]) {
  // Brand favicon / logo warning
  if (!project.brand.logoAssets || project.brand.logoAssets.length === 0) {
    issues.push({
      code: 'no_favicon_or_logo',
      message: 'No logo or favicon asset uploaded in brand profile. Default studio branding will be omitted.',
      severity: 'warning',
    });
  }

  // SEO description warning
  if (!project.business.description || project.business.description.trim().length < 20) {
    issues.push({
      code: 'short_seo_description',
      message: 'Business description is very short or missing. Search engine snippet description will be minimal.',
      severity: 'warning',
    });
  }

  // Social sharing (OG) image warning
  const hasSocialAsset = project.assets.some(
    (a) =>
      (a.status === 'approved' || a.status === 'generated') &&
      a.outputUrl &&
      (a.purpose.toLowerCase().includes('social') ||
        a.purpose.toLowerCase().includes('og') ||
        a.aspectRatio === '16:9')
  );
  if (!hasSocialAsset) {
    issues.push({
      code: 'no_social_image',
      message: 'No 16:9 social share image (Open Graph) was generated or approved.',
      severity: 'warning',
    });
  }

  // Contact details warning when not strictly required by a specific section
  const hasAnyContact = Boolean(
    project.business.phone?.trim() ||
    project.business.email?.trim() ||
    project.business.whatsapp?.trim()
  );
  if (!hasAnyContact) {
    issues.push({
      code: 'no_contact_details',
      message: 'No direct contact information (phone, email, or WhatsApp) provided in business profile.',
      severity: 'warning',
    });
  }

  // Check for optional missing assets across pages
  for (const page of project.pages) {
    for (const section of page.sections || []) {
      const component = componentLookup.get(section.componentRegistryId);
      if (component) {
        const resolution = resolveSectionAssets(section, component, project.assets, page.id);
        if (resolution.missingOptionalSlots.length > 0) {
          issues.push({
            code: 'missing_optional_asset',
            message: `Section "${section.name}" has optional asset slot(s) unfilled: ${resolution.missingOptionalSlots
              .map((s) => s.slot)
              .join(', ')}.`,
            severity: 'warning',
            pageId: page.id,
            sectionId: section.id,
          });
        }
      }
    }
  }
}

function finalizeValidation(issues: ExportValidationIssue[]): ExportValidation {
  const errors = issues
    .filter((issue) => issue.severity === 'error')
    .map((issue) => issue.message);
  const warnings = issues
    .filter((issue) => issue.severity === 'warning')
    .map((issue) => issue.message);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    issues,
  };
}
