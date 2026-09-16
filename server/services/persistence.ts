import fs from 'fs';
import path from 'path';
import type { ComponentDefinition } from '../../shared/componentRegistry';

export interface RegistryPersistenceData {
  statusOverrides: Record<string, 'approved' | 'candidate' | 'rejected'>;
  registeredCandidates: ComponentDefinition[];
  updatedAt?: string;
}

export interface ComponentRegistryPersistence {
  load(): Promise<RegistryPersistenceData>;
  save(data: RegistryPersistenceData): Promise<void>;
}

/**
 * Local file-system persistence used as local development fallback.
 */
export class FileComponentRegistryPersistence implements ComponentRegistryPersistence {
  private filePath: string;

  constructor(filePath = path.join(process.cwd(), 'data', 'component-status-overrides.json')) {
    this.filePath = filePath;
  }

  async load(): Promise<RegistryPersistenceData> {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          statusOverrides: parsed.statusOverrides || {},
          registeredCandidates: Array.isArray(parsed.registeredCandidates) ? parsed.registeredCandidates : [],
          updatedAt: parsed.updatedAt,
        };
      }
    } catch (err) {
      console.warn('[FilePersistence] Error reading local status overrides, using empty defaults:', err);
    }
    return { statusOverrides: {}, registeredCandidates: [] };
  }

  async save(data: RegistryPersistenceData): Promise<void> {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[FilePersistence] Failed to write status overrides to disk:', err);
      throw err;
    }
  }
}

/**
 * Firestore persistence used when Firebase environment configuration is present.
 * Does not block local development if Firebase credentials are absent.
 */
export class FirestoreComponentRegistryPersistence implements ComponentRegistryPersistence {
  private fallbackFile: FileComponentRegistryPersistence;
  private isConfigured: boolean = false;
  private dbPromise: Promise<any> | null = null;

  constructor() {
    this.fallbackFile = new FileComponentRegistryPersistence();
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
    this.isConfigured = Boolean(projectId);
  }

  private async getDb() {
    if (!this.isConfigured) return null;
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        try {
          // Dynamic import of firebase to prevent hard crashing if node environment lacks config
          const { initializeApp, getApps } = await import('firebase/app');
          const { getFirestore } = await import('firebase/firestore');

          const config = {
            apiKey: process.env.FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY,
            projectId: process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID,
            appId: process.env.FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID,
          };

          const app = getApps().length > 0 ? getApps()[0] : initializeApp(config);
          return getFirestore(app);
        } catch (err) {
          console.warn('[FirestorePersistence] Failed to initialize Firestore client:', err);
          return null;
        }
      })();
    }
    return this.dbPromise;
  }

  async load(): Promise<RegistryPersistenceData> {
    const db = await this.getDb();
    if (!db) {
      return this.fallbackFile.load();
    }

    try {
      const { doc, getDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'system', 'component-registry-overrides');
      const snapshot = await getDoc(docRef);

      if (snapshot.exists()) {
        const data = snapshot.data() as RegistryPersistenceData;
        return {
          statusOverrides: data.statusOverrides || {},
          registeredCandidates: data.registeredCandidates || [],
          updatedAt: data.updatedAt,
        };
      }
    } catch (err) {
      console.warn('[FirestorePersistence] Failed to load from Firestore, falling back to local file:', err);
    }
    return this.fallbackFile.load();
  }

  async save(data: RegistryPersistenceData): Promise<void> {
    const db = await this.getDb();
    if (!db) {
      return this.fallbackFile.save(data);
    }

    try {
      const { doc, setDoc } = await import('firebase/firestore');
      const docRef = doc(db, 'system', 'component-registry-overrides');
      await setDoc(docRef, data, { merge: true });
      // Keep local mirror updated as well
      await this.fallbackFile.save(data).catch(() => {});
    } catch (err) {
      console.warn('[FirestorePersistence] Failed to save to Firestore, falling back to local file write:', err);
      return this.fallbackFile.save(data);
    }
  }
}

/**
 * Creates the appropriate persistence instance based on runtime environment.
 */
export function createComponentRegistryPersistence(): ComponentRegistryPersistence {
  const hasFirebase = Boolean(
    process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
  );

  if (hasFirebase) {
    return new FirestoreComponentRegistryPersistence();
  }
  return new FileComponentRegistryPersistence();
}

export const createComponentPersistence = createComponentRegistryPersistence;

