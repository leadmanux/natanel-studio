import { demoComponents, type ComponentDefinition } from '@shared/componentRegistry';

const LOCAL_STORAGE_KEY = 'natanel-studio-component-registry-v1';
const OVERRIDES_STORAGE_KEY = 'natanel-studio-status-overrides-v1';

type Listener = (components: ComponentDefinition[]) => void;

class ComponentRegistryRepository {
  private cache: ComponentDefinition[] | null = null;
  private listeners: Set<Listener> = new Set();
  private isSyncing = false;

  constructor() {
    this.initCache();
    // Attempt background sync with server
    if (typeof window !== 'undefined') {
      this.syncWithServer().catch(() => {});
    }
  }

  private initCache(): void {
    if (typeof window === 'undefined') {
      this.cache = [...demoComponents];
      return;
    }

    try {
      const storedOverrides = localStorage.getItem(OVERRIDES_STORAGE_KEY);
      const overridesMap: Record<string, 'approved' | 'candidate' | 'rejected'> = storedOverrides
        ? JSON.parse(storedOverrides)
        : {};

      const storedCandidates = localStorage.getItem(LOCAL_STORAGE_KEY);
      const additionalCandidates: ComponentDefinition[] = storedCandidates
        ? JSON.parse(storedCandidates)
        : [];

      // Merge demo components with overrides
      const baseMerged = demoComponents.map((comp) => {
        const overrideStatus = overridesMap[comp.id];
        return overrideStatus ? { ...comp, status: overrideStatus } : comp;
      });

      // Merge additional candidate registrations
      const candidateMerged = additionalCandidates.map((cand) => {
        const overrideStatus = overridesMap[cand.id];
        return overrideStatus ? { ...cand, status: overrideStatus } : cand;
      });

      this.cache = [...baseMerged, ...candidateMerged];
    } catch {
      this.cache = [...demoComponents];
    }
  }

  private saveToLocalStorage(): void {
    if (typeof window === 'undefined' || !this.cache) return;
    try {
      const overrides: Record<string, string> = {};
      const customCandidates: ComponentDefinition[] = [];

      for (const item of this.cache) {
        const isBase = demoComponents.some((d) => d.id === item.id);
        if (isBase) {
          const original = demoComponents.find((d) => d.id === item.id);
          if (original && original.status !== item.status) {
            overrides[item.id] = item.status;
          }
        } else {
          customCandidates.push(item);
          overrides[item.id] = item.status;
        }
      }

      localStorage.setItem(OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customCandidates));
    } catch (e) {
      console.warn('[ComponentRegistryRepository] LocalStorage write failed:', e);
    }
  }

  private notify(): void {
    if (!this.cache) return;
    const current = [...this.cache];
    this.listeners.forEach((listener) => {
      try {
        listener(current);
      } catch (err) {
        console.error('[ComponentRegistryRepository] Listener error:', err);
      }
    });
  }

  async syncWithServer(): Promise<ComponentDefinition[]> {
    if (this.isSyncing) return this.cache || demoComponents;
    this.isSyncing = true;
    try {
      const response = await fetch('/api/components');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.components) && data.components.length > 0) {
          // If local has more recent overrides, retain them; otherwise use server state
          const serverMap = new Map<string, ComponentDefinition>(data.components.map((c: ComponentDefinition) => [c.id, c]));
          const merged: ComponentDefinition[] = [];

          // Include all server items
          for (const sComp of data.components) {
            const localComp = this.cache?.find((c) => c.id === sComp.id);
            // Local takes precedence if modified
            merged.push(localComp || sComp);
          }

          // Include any local candidates not yet on server
          if (this.cache) {
            for (const lComp of this.cache) {
              if (!serverMap.has(lComp.id)) {
                merged.push(lComp);
              }
            }
          }

          this.cache = merged;
          this.saveToLocalStorage();
          this.notify();
        }
      }
    } catch {
      // Offline fallback: rely on initialized local cache
    } finally {
      this.isSyncing = false;
    }
    return this.cache || demoComponents;
  }

  async list(): Promise<ComponentDefinition[]> {
    if (!this.cache) {
      this.initCache();
    }
    return [...(this.cache || demoComponents)];
  }

  getSynchronous(): ComponentDefinition[] {
    if (!this.cache) {
      this.initCache();
    }
    return [...(this.cache || demoComponents)];
  }

  async get(id: string): Promise<ComponentDefinition | null> {
    const all = await this.list();
    return all.find((c) => c.id === id) || null;
  }

  async updateStatus(id: string, newStatus: 'approved' | 'candidate' | 'rejected'): Promise<ComponentDefinition> {
    if (!this.cache) {
      this.initCache();
    }

    let updatedItem: ComponentDefinition | null = null;
    this.cache = (this.cache || demoComponents).map((comp) => {
      if (comp.id === id) {
        updatedItem = { ...comp, status: newStatus };
        return updatedItem;
      }
      return comp;
    });

    if (!updatedItem) {
      throw new Error(`Component with ID "${id}" not found in canonical repository.`);
    }

    this.saveToLocalStorage();
    this.notify();

    // Replicate to server asynchronously
    fetch(`/api/components/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    }).catch((err) => {
      console.warn('[ComponentRegistryRepository] Failed to sync status to server:', err);
    });

    return updatedItem;
  }

  async registerCandidate(candidate: ComponentDefinition): Promise<ComponentDefinition> {
    if (!this.cache) {
      this.initCache();
    }

    const normalized: ComponentDefinition = {
      ...candidate,
      status: 'candidate', // candidates are candidate status by default
      dateImported: candidate.dateImported || new Date().toISOString().split('T')[0],
      version: candidate.version || '1.0.0',
    };

    // Remove existing if any
    this.cache = (this.cache || demoComponents).filter((c) => c.id !== normalized.id);
    this.cache.unshift(normalized);

    this.saveToLocalStorage();
    this.notify();

    // Replicate to server asynchronously
    fetch('/api/components/candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    }).catch((err) => {
      console.warn('[ComponentRegistryRepository] Failed to sync candidate to server:', err);
    });

    return normalized;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const componentRegistryRepository = new ComponentRegistryRepository();
