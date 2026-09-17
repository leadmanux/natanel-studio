import React, { useEffect, useState, useMemo } from 'react';
import type { Project, SitePage } from '@shared/project';
import { projectRepository } from '../data/projectRepository';
import { StudioSiteRenderer } from '../studio-components/StudioSiteRenderer';

export interface StandalonePreviewViewProps {
  projectId?: string;
  pageSlug?: string;
}

export function StandalonePreviewView({ projectId: propProjectId, pageSlug: propPageSlug }: StandalonePreviewViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [currentSlug, setCurrentSlug] = useState<string>('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract from URL if not provided via props
  const { targetProjectId, targetSlug } = useMemo(() => {
    if (propProjectId) {
      return { targetProjectId: propProjectId, targetSlug: propPageSlug || '/' };
    }

    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      // Matches /studio-preview/:projectId or /studio-preview/:projectId/:pageSlug
      const parts = path.split('/').filter(Boolean);
      if (parts[0] === 'studio-preview' && parts[1]) {
        const pId = parts[1];
        const pSlug = parts.slice(2).join('/') ? `/${parts.slice(2).join('/')}` : '/';
        return { targetProjectId: pId, targetSlug: pSlug };
      }

      // Check search params as fallback
      const urlParams = new URLSearchParams(window.location.search);
      const qProject = urlParams.get('projectId');
      const qSlug = urlParams.get('slug') || '/';
      if (qProject) {
        return { targetProjectId: qProject, targetSlug: qSlug };
      }
    }

    return { targetProjectId: 'demo-project', targetSlug: '/' };
  }, [propProjectId, propPageSlug]);

  useEffect(() => {
    setCurrentSlug(targetSlug);
  }, [targetSlug]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        let loaded = await projectRepository.get(targetProjectId);
        if (!loaded) {
          const list = await projectRepository.list();
          if (list.length > 0) {
            loaded = list.find((p) => p.id === targetProjectId) || list[0];
          }
        }

        if (loaded) {
          setProject(loaded);
        } else {
          setError(`Project "${targetProjectId}" was not found.`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [targetProjectId]);

  const currentPage: SitePage | undefined = useMemo(() => {
    if (!project || !project.pages || project.pages.length === 0) return undefined;
    const cleanCurrent = currentSlug === '' ? '/' : currentSlug.toLowerCase();
    const found = project.pages.find((p) => {
      const pSlug = (p.slug === '' ? '/' : p.slug).toLowerCase();
      return pSlug === cleanCurrent;
    });
    return found || project.pages[0];
  }, [project, currentSlug]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0e0e10',
          color: '#8f8f97',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
        }}
      >
        <span>Loading Studio Preview...</span>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0e0e10',
          color: '#ef4444',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div>
          <h3>Preview Error</h3>
          <p>{error || 'Project not available'}</p>
        </div>
      </div>
    );
  }

  if (!currentPage) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0e0e10',
          color: '#8f8f97',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '14px',
          padding: '24px',
          textAlign: 'center',
        }}
      >
        <div>
          <h3>Empty Page</h3>
          <p>This project has no pages composed yet. Open the Build workspace to compose pages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="standalone-preview-container" style={{ minHeight: '100vh', width: '100%', margin: 0, padding: 0 }}>
      <StudioSiteRenderer
        project={project}
        page={currentPage}
        contentMode="production"
        onAction={(actionId, payload) => {
          if (actionId === 'navigate' && payload?.target) {
            const target = payload.target as string;
            // Handle in-preview page navigation
            if (target.startsWith('/') || !target.includes('://')) {
              setCurrentSlug(target);
            }
          }
        }}
      />
    </div>
  );
}
