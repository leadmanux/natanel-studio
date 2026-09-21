import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import type { Project } from '@shared/project';
import { syncReferenceAssetsIntoProject } from '@shared/referenceAssetSync';
import { db } from './firebase';

function normalizeProject(project: Project): Project {
  return syncReferenceAssetsIntoProject({
    ...project,
    brand: {
      ...project.brand,
      referenceAssets: project.brand?.referenceAssets || [],
      logoAssets: project.brand?.logoAssets || [],
    },
    assets: project.assets || [],
  });
}

export interface ProjectRepository {
  list(): Promise<Project[]>;
  get(id: string): Promise<Project | null>;
  save(project: Project): Promise<void>;
  remove(id: string): Promise<void>;
}

class FirestoreProjectRepository implements ProjectRepository {
  private requireDb() {
    if (!db) throw new Error('Firebase is not configured.');
    return db;
  }

  async list(): Promise<Project[]> {
    const database = this.requireDb();
    const snapshot = await getDocs(query(collection(database, 'projects'), orderBy('updatedAt', 'desc')));
    return snapshot.docs.map((item) => normalizeProject(item.data() as Project));
  }

  async get(id: string): Promise<Project | null> {
    const database = this.requireDb();
    const snapshot = await getDoc(doc(database, 'projects', id));
    return snapshot.exists() ? normalizeProject(snapshot.data() as Project) : null;
  }

  async save(project: Project): Promise<void> {
    const database = this.requireDb();
    await setDoc(doc(database, 'projects', project.id), normalizeProject(project), { merge: true });
  }

  async remove(id: string): Promise<void> {
    const database = this.requireDb();
    await deleteDoc(doc(database, 'projects', id));
  }
}

class LocalProjectRepository implements ProjectRepository {
  private key = 'natanel-studio-projects';

  private read(): Project[] {
    const raw = localStorage.getItem(this.key);
    return raw ? (JSON.parse(raw) as Project[]).map(normalizeProject) : [];
  }

  private write(projects: Project[]) {
    try {
      localStorage.setItem(this.key, JSON.stringify(projects.map(normalizeProject)));
    } catch (error) {
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        throw new Error('Project storage is full. Remove unused uploaded references or enable Firebase persistence before adding more large images.');
      }
      throw error;
    }
  }

  async list() {
    return this.read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string) {
    return this.read().find((project) => project.id === id) ?? null;
  }

  async save(project: Project) {
    const projects = this.read();
    const normalized = normalizeProject(project);
    const index = projects.findIndex((item) => item.id === project.id);
    if (index >= 0) projects[index] = normalized;
    else projects.push(normalized);
    this.write(projects);
  }

  async remove(id: string) {
    this.write(this.read().filter((project) => project.id !== id));
  }
}

export const projectRepository: ProjectRepository = db
  ? new FirestoreProjectRepository()
  : new LocalProjectRepository();
