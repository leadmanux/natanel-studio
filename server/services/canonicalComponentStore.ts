import { demoComponents, type ComponentDefinition } from '../../shared/componentRegistry';
import fs from 'fs';
import path from 'path';

/**
 * Server-side canonical component store.
 * Holds canonical approval state, persists status overrides to disk,
 * and ensures GeminiComponentSelector and UI share the exact same source of truth.
 */
class CanonicalComponentStore {
  private overridesFilePath = path.join(process.cwd(), 'data', 'component-status-overrides.json');
  private statusOverrides: Map<string, 'approved' | 'candidate' | 'rejected'> = new Map();
  private registeredCandidates: Map<string, ComponentDefinition> = new Map();

  constructor() {
    this.loadFromDisk();
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.overridesFilePath)) {
        const raw = fs.readFileSync(this.overridesFilePath, 'utf-8');
        const data = JSON.parse(raw);
        if (data.statusOverrides && typeof data.statusOverrides === 'object') {
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
      }
    } catch (err) {
      console.warn('[CanonicalComponentStore] Could not read status overrides file, using default registry:', err);
    }
  }

  private saveToDisk() {
    try {
      const dir = path.dirname(this.overridesFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = {
        statusOverrides: Object.fromEntries(this.statusOverrides.entries()),
        registeredCandidates: Array.from(this.registeredCandidates.values()),
        updatedAt: new Date().toISOString(),
      };
      fs.writeFileSync(this.overridesFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('[CanonicalComponentStore] Could not persist status overrides to disk:', err);
    }
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

  updateComponentStatus(id: string, newStatus: 'approved' | 'candidate' | 'rejected'): ComponentDefinition | null {
    this.statusOverrides.set(id, newStatus);
    this.saveToDisk();

    const all = this.getAllComponents();
    return all.find((c) => c.id === id) || null;
  }

  registerCandidate(candidate: ComponentDefinition): ComponentDefinition {
    const normalized: ComponentDefinition = {
      ...candidate,
      status: 'candidate', // candidates are candidate status by default
      dateImported: new Date().toISOString().split('T')[0],
      version: candidate.version || '1.0.0',
    };

    this.registeredCandidates.set(normalized.id, normalized);
    this.saveToDisk();
    return normalized;
  }
}

export const canonicalComponentStore = new CanonicalComponentStore();
