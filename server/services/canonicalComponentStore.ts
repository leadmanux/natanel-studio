import fs from 'fs';
import path from 'path';
import { demoComponents, type ComponentDefinition } from '../../shared/componentRegistry';
import { hasComponentImplementation } from '../../shared/componentImplementations';
import {
  type ComponentRegistryPersistence,
  createComponentPersistence,
} from './persistence';

/**
 * Validates whether an external component has complete required provenance.
 */
export function validateProvenance(component: ComponentDefinition): {
  valid: boolean;
  missing: string[];
} {
  if (component.source === 'internal') {
    return { valid: true, missing: [] };
  }

  const missing: string[] = [];
  if (!component.source || component.source.trim() === '') {
    missing.push('source');
  }
  if (!component.sourceUrl || component.sourceUrl.trim() === '') {
    missing.push('sourceUrl');
  }
  if (!component.sourceAuthor || component.sourceAuthor.trim() === '' || component.sourceAuthor.toLowerCase() === 'external author') {
    missing.push('sourceAuthor');
  }
  if (!component.license || component.license.trim() === '') {
    missing.push('license');
  }

  return {
    valid: missing.length === 0,
    missing,
  };
}

/**
 * Server-side canonical component store.
 * Authoritative source of truth for component status, provenance, and AI selection.
 */
export class CanonicalComponentStore {
  private persistence: ComponentRegistryPersistence;
  private statusOverrides: Map<string, 'approved' | 'candidate' | 'rejected'> = new Map();
  private registeredCandidates: Map<string, ComponentDefinition> = new Map();
  private initializedPromise: Promise<void> | null = null;

  constructor(persistence?: ComponentRegistryPersistence) {
    this.persistence = persistence || createComponentPersistence();
    this.init();
  }

  init(): Promise<void> {
    if (!this.initializedPromise) {
      this.initializedPromise = (async () => {
        try {
          const data = await this.persistence.load();
          if (data.statusOverrides) {
            Object.entries(data.statusOverrides).forEach(([id, status]) => {
              if (status === 'approved' || status === 'candidate' || status === 'rejected') {
                this.statusOverrides.set(id, status);
              }
            });
          }
          if (Array.isArray(data.registeredCandidates)) {
            data.registeredCandidates.forEach((cand: ComponentDefinition) => {
              if (cand && cand.id) {
                this.registeredCandidates.set(cand.id, cand);
              }
            });
          }
        } catch (err) {
          console.warn('[CanonicalComponentStore] Failed initializing persistence:', err);
        }
      })();
    }
    return this.initializedPromise;
  }

  private async persist(): Promise<void> {
    const data = {
      statusOverrides: Object.fromEntries(this.statusOverrides.entries()),
      registeredCandidates: Array.from(this.registeredCandidates.values()),
      updatedAt: new Date().toISOString(),
    };
    await this.persistence.save(data);
  }

  getAllComponents(): ComponentDefinition[] {
    const list: ComponentDefinition[] = [];

    // Base components with status overrides applied
    for (const comp of demoComponents) {
      const overrideStatus = this.statusOverrides.get(comp.id);
      list.push(overrideStatus ? { ...comp, status: overrideStatus } : { ...comp });
    }

    // Additional registered candidates
    for (const cand of this.registeredCandidates.values()) {
      const overrideStatus = this.statusOverrides.get(cand.id);
      list.push(overrideStatus ? { ...cand, status: overrideStatus } : { ...cand });
    }

    return list;
  }

  getApprovedComponents(): ComponentDefinition[] {
    return this.getAllComponents().filter((c) => c.status === 'approved');
  }

  getComponentById(id: string): ComponentDefinition | null {
    const all = this.getAllComponents();
    return all.find((c) => c.id === id) || null;
  }

  async updateComponentStatus(
    id: string,
    newStatus: 'approved' | 'candidate' | 'rejected'
  ): Promise<ComponentDefinition> {
    await this.init();

    const existing = this.getComponentById(id);
    if (!existing) {
      throw new Error(`Component with ID "${id}" does not exist in canonical registry.`);
    }

    // Enforce mandate: A component may not transition to approved unless a real render implementation exists.
    // Metadata-only external candidates must remain Candidate until implementation exists.
    if (newStatus === 'approved') {
      if (!hasComponentImplementation(id)) {
        throw new Error(
          `Cannot approve component "${existing.name || id}": No render implementation exists in the studio component registry. Metadata-only candidates must remain Candidate until implementation exists.`
        );
      }

      if (!existing.codeLocation) {
        throw new Error(
          `Cannot approve component "${existing.name || id}": Missing codeLocation metadata.`
        );
      }

      const diskPath = path.resolve(process.cwd(), existing.codeLocation);
      if (!fs.existsSync(diskPath)) {
        throw new Error(
          `Cannot approve component "${existing.name || id}": Implementation file does not exist on disk at "${existing.codeLocation}".`
        );
      }

      // Provenance check for external components
      if (existing.source !== 'internal') {
        const provenance = validateProvenance(existing);
        if (!provenance.valid) {
          throw new Error(
            `Cannot approve external component "${existing.name || id}": Provenance is incomplete. Missing: ${provenance.missing.join(', ')}.`
          );
        }
      }
    }

    this.statusOverrides.set(id, newStatus);
    await this.persist();

    return {
      ...existing,
      status: newStatus,
    };
  }

  async registerCandidate(candidate: ComponentDefinition): Promise<ComponentDefinition> {
    await this.init();

    if (!candidate || !candidate.id || !candidate.name) {
      throw new Error('Valid candidate component with id and name is required.');
    }

    // Strip fake default author placeholders if provided
    let cleanAuthor = candidate.sourceAuthor;
    if (cleanAuthor && cleanAuthor.toLowerCase() === 'external author') {
      cleanAuthor = undefined;
    }

    const normalized: ComponentDefinition = {
      ...candidate,
      status: 'candidate', // candidates are candidate status by default
      sourceAuthor: cleanAuthor,
      sourceUrl: candidate.sourceUrl || null,
      upstreamComponent: candidate.upstreamComponent || null,
      originalCategory: candidate.originalCategory || null,
      dateImported: candidate.dateImported || new Date().toISOString().split('T')[0],
      version: candidate.version || '1.0.0',
      mobileVerificationStatus: candidate.mobileVerificationStatus || 'untested',
      rtlVerificationStatus: candidate.rtlVerificationStatus || 'untested',
      supportedProjectTypes: candidate.supportedProjectTypes?.length
        ? candidate.supportedProjectTypes
        : ['business_website', 'both'],
    };

    this.registeredCandidates.set(normalized.id, normalized);
    // If status override was previously set, retain or set to candidate
    this.statusOverrides.set(normalized.id, 'candidate');
    await this.persist();

    return normalized;
  }
}

// Export singleton
export const canonicalComponentStore = new CanonicalComponentStore();
