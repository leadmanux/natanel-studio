export interface StoredExport {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  createdAt: number;
}

const store = new Map<string, StoredExport>();
const TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export const exportStore = {
  set(id: string, exportData: Omit<StoredExport, 'createdAt'>) {
    // Cleanup old items
    const now = Date.now();
    for (const [key, item] of store.entries()) {
      if (now - item.createdAt > TTL_MS) {
        store.delete(key);
      }
    }

    store.set(id, {
      ...exportData,
      createdAt: now,
    });
  },

  get(id: string): StoredExport | undefined {
    const item = store.get(id);
    if (!item) return undefined;
    if (Date.now() - item.createdAt > TTL_MS) {
      store.delete(id);
      return undefined;
    }
    return item;
  },

  delete(id: string) {
    store.delete(id);
  },
};
