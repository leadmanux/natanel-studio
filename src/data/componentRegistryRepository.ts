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

  /**
   * Syncs with canonical server registry.
   * When server is reachable, server state is strictly authoritative.
   * LocalStorage serves solely as an offline cache/fallback.
   */
  async syncWithServer(): Promise<ComponentDefinition[]> {
    if (this.isSyncing) return this.cache || demoComponents;
    this.isSyncing = true;
    try {
      const response = await fetch('/api/components');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.components) && data.components.length > 0) {
          // Server state is canonical. Overwrite local cache with authoritative server state.
          this.cache = data.components;
          this.saveToLocalStorage();
          this.notify();
          return this.cache || demoComponents;
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

  /**
   * Updates component approval status.
   * Awaits server confirmation when online and updates local cache from confirmed server result.
   * If server write fails, surfaces the error instead of silently pretending success.
   */
  async updateStatus(id: string, newStatus: 'approved' | 'candidate' | 'rejected'): Promise<ComponentDefinition> {
    if (!this.cache) {
      this.initCache();
    }

    let confirmedItem: ComponentDefinition | null = null;
    let isNetworkError = false;

    try {
      const res = await fetch(`/api/components/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server failed to update status (${res.status})`);
      }

      const resData = await res.json();
      confirmedItem = resData.component;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      // Check if it was purely a network disconnection / offline error
      if (err instanceof TypeError || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        isNetworkError = true;
        console.warn('[ComponentRegistryRepository] Server unreachable, falling back to local storage:', err);
      } else {
        // Business logic or validation error from server (e.g. incomplete provenance, bad status)
        throw err;
      }
    }

    if (confirmedItem) {
      this.cache = (this.cache || demoComponents).map((c) => (c.id === id ? confirmedItem! : c));
      this.saveToLocalStorage();
      this.notify();
      return confirmedItem;
    }

    if (isNetworkError) {
      // Offline fallback
      const existing = (this.cache || demoComponents).find((c) => c.id === id);
      if (!existing) {
        throw new Error(`Component with ID "${id}" not found.`);
      }
      const updated = { ...existing, status: newStatus };
      this.cache = (this.cache || demoComponents).map((c) => (c.id === id ? updated : c));
      this.saveToLocalStorage();
      this.notify();
      return updated;
    }

    throw new Error(`Failed to update status for component "${id}".`);
  }

  /**
   * Registers a candidate component.
   * Awaits server response when online and updates local cache from confirmed result.
   */
  async registerCandidate(candidate: ComponentDefinition): Promise<ComponentDefinition> {
    if (!this.cache) {
      this.initCache();
    }

    let confirmedItem: ComponentDefinition | null = null;
    let isNetworkError = false;

    try {
      const res = await fetch('/api/components/candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(candidate),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server failed to register candidate (${res.status})`);
      }

      const resData = await res.json();
      confirmedItem = resData.component;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (err instanceof TypeError || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        isNetworkError = true;
        console.warn('[ComponentRegistryRepository] Server unreachable, applying offline fallback for candidate:', err);
      } else {
        throw err;
      }
    }

    if (confirmedItem) {
      this.cache = (this.cache || demoComponents).filter((c) => c.id !== confirmedItem!.id);
      this.cache.unshift(confirmedItem);
      this.saveToLocalStorage();
      this.notify();
      return confirmedItem;
    }

    if (isNetworkError) {
      const normalized: ComponentDefinition = {
        ...candidate,
        status: 'candidate',
        dateImported: candidate.dateImported || new Date().toISOString().split('T')[0],
        version: candidate.version || '1.0.0',
      };
      this.cache = (this.cache || demoComponents).filter((c) => c.id !== normalized.id);
      this.cache.unshift(normalized);
      this.saveToLocalStorage();
      this.notify();
      return normalized;
    }

    throw new Error(`Failed to register candidate component "${candidate.name || candidate.id}".`);
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const componentRegistryRepository = new ComponentRegistryRepository();
