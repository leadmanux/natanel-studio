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
import { db } from './firebase';

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
    return snapshot.docs.map((item) => item.data() as Project);
  }

  async get(id: string): Promise<Project | null> {
    const database = this.requireDb();
    const snapshot = await getDoc(doc(database, 'projects', id));
    return snapshot.exists() ? (snapshot.data() as Project) : null;
  }

  async save(project: Project): Promise<void> {
    const database = this.requireDb();
    await setDoc(doc(database, 'projects', project.id), project, { merge: true });
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
    return raw ? (JSON.parse(raw) as Project[]) : [];
  }

  private write(projects: Project[]) {
    localStorage.setItem(this.key, JSON.stringify(projects));
  }

  async list() {
    return this.read().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: string) {
    return this.read().find((project) => project.id === id) ?? null;
  }

  async save(project: Project) {
    const projects = this.read();
    const index = projects.findIndex((item) => item.id === project.id);
    if (index >= 0) projects[index] = project;
    else projects.push(project);
    this.write(projects);
  }

  async remove(id: string) {
    this.write(this.read().filter((project) => project.id !== id));
  }
}

export const projectRepository: ProjectRepository = db
  ? new FirestoreProjectRepository()
  : new LocalProjectRepository();
