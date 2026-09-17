import fs from 'fs';
import path from 'path';
import type { ComponentDefinition } from './componentRegistry';
import { getContentContract } from './contentContracts';

export interface RegistryIntegrityReport {
  valid: boolean;
  totalComponents: number;
  approvedCount: number;
  candidateCount: number;
  rejectedCount: number;
  errors: string[];
  warnings: string[];
}

/**
 * Validates registry integrity:
 * - every Approved component has a render implementation
 * - every renderImplementationId resolves
 * - duplicate IDs do not exist
 * - aliases resolve to real implementations
 * - metadata codeLocation corresponds to the intended implementation file on disk
 * - external components with incomplete provenance remain candidate
 * - supportedProjectTypes strictly business_website | shopify | both
 * - verification statuses default to untested (no auto manually_verified)
 * - dateImported does not use fake 2026-03-01 default
 */
export function validateComponentRegistryIntegrity(
  components: ComponentDefinition[],
  hasImplementationFn: (id: string) => boolean,
  aliases: Record<string, string> = {},
  options: { checkFilesOnDisk?: boolean; basePath?: string } = {}
): RegistryIntegrityReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const seenIds = new Set<string>();

  const allowedProjectTypes = new Set(['business_website', 'shopify', 'both']);
  const allowedVerificationStatuses = new Set(['untested', 'manually_verified', 'automated_verified']);

  let approvedCount = 0;
  let candidateCount = 0;
  let rejectedCount = 0;

  for (const comp of components) {
    if (comp.status === 'approved') approvedCount++;
    else if (comp.status === 'candidate') candidateCount++;
    else if (comp.status === 'rejected') rejectedCount++;

    // 1. Duplicate ID check
    if (seenIds.has(comp.id)) {
      errors.push(`Duplicate component ID detected in registry: "${comp.id}".`);
    }
    seenIds.add(comp.id);

    // 2. Approved components MUST have a render implementation
    if (comp.status === 'approved') {
      const hasImpl = hasImplementationFn(comp.id);
      if (!hasImpl) {
        errors.push(`Approved component "${comp.id}" has no render implementation in resolver.`);
      }

      if (!comp.renderImplementationId) {
        errors.push(`Approved component "${comp.id}" is missing renderImplementationId.`);
      } else if (!hasImplementationFn(comp.renderImplementationId)) {
        errors.push(
          `Approved component "${comp.id}" has invalid renderImplementationId "${comp.renderImplementationId}" that does not resolve.`
        );
      }

      // Content Contract check
      const contract = getContentContract(comp.id);
      if (!contract) {
        errors.push(`Approved component "${comp.id}" has no content contract defined.`);
      } else if (!contract.schema) {
        errors.push(`Approved component "${comp.id}" content contract is missing a Zod schema.`);
      }
    }

    // 3. Metadata codeLocation check on disk
    if (options.checkFilesOnDisk && comp.status === 'approved') {
      const basePath = options.basePath || process.cwd();
      const resolvedPath = path.resolve(basePath, comp.codeLocation);
      if (!fs.existsSync(resolvedPath)) {
        errors.push(
          `Component "${comp.id}" codeLocation "${comp.codeLocation}" does not exist on disk at "${resolvedPath}".`
        );
      }
    }

    // 4. Project types model validation
    if (comp.supportedProjectTypes) {
      for (const pt of comp.supportedProjectTypes) {
        if (!allowedProjectTypes.has(pt)) {
          errors.push(
            `Component "${comp.id}" uses invalid supportedProjectType "${pt}". Must be strictly "business_website" | "shopify" | "both".`
          );
        }
      }
    }

    // 5. Verification metadata validation
    if (comp.rtlVerificationStatus && !allowedVerificationStatuses.has(comp.rtlVerificationStatus)) {
      errors.push(
        `Component "${comp.id}" has invalid rtlVerificationStatus: "${comp.rtlVerificationStatus}".`
      );
    }
    if (comp.mobileVerificationStatus && !allowedVerificationStatuses.has(comp.mobileVerificationStatus)) {
      errors.push(
        `Component "${comp.id}" has invalid mobileVerificationStatus: "${comp.mobileVerificationStatus}".`
      );
    }

    // Disallow fake dateImported
    if (comp.dateImported === '2026-03-01') {
      errors.push(`Component "${comp.id}" contains forbidden fake default dateImported: '2026-03-01'.`);
    }

    // Disallow generic placeholder author
    if (comp.sourceAuthor && comp.sourceAuthor.toLowerCase() === 'external author') {
      errors.push(`Component "${comp.id}" uses forbidden generic placeholder author: "External Author".`);
    }

    // External provenance check
    if (comp.source !== 'internal') {
      const missingProvenance: string[] = [];
      if (!comp.sourceUrl) missingProvenance.push('sourceUrl');
      if (!comp.sourceAuthor) missingProvenance.push('sourceAuthor');
      if (!comp.license) missingProvenance.push('license');

      if (missingProvenance.length > 0 && comp.status === 'approved') {
        errors.push(
          `External component "${comp.id}" cannot be Approved because required provenance is incomplete (missing: ${missingProvenance.join(', ')}).`
        );
      }
    }
  }

  // 6. Aliases resolution check
  for (const [alias, target] of Object.entries(aliases)) {
    if (!hasImplementationFn(target)) {
      errors.push(`Alias "${alias}" points to non-existent implementation target "${target}".`);
    }
  }

  return {
    valid: errors.length === 0,
    totalComponents: components.length,
    approvedCount,
    candidateCount,
    rejectedCount,
    errors,
    warnings,
  };
}
