import React, { useEffect, useMemo, useState } from 'react';
import type { Project, SitePage } from '@shared/project';
import { projectRepository } from '../data/projectRepository';
import { StudioSiteRenderer } from '../studio-components/StudioSiteRenderer';

export interface StandalonePreviewViewProps {
  projectId?: string;
  pageSlug?: string;
}

function PreviewMessage({ title, message, tone = '#8f8f97' }: { title: string; message: string; tone?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0e0e10', color: tone, fontFamily: 'system-ui, sans-serif', padding: 24, textAlign: 'center' }}>
      <div><h3>{title}</h3><p>{message}</p></div>
    </div>
  );
}

export function StandalonePreviewView({ projectId: propProjectId, pageSlug: propPageSlug }: StandalonePreviewViewProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [currentSlug, setCurrentSlug] = useState('/');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { targetProjectId, targetSlug } = useMemo(() => {
    if (propProjectId) return { targetProjectId: propProjectId, targetSlug: propPageSlug || '/' };
    if (typeof window === 'undefined') return { targetProjectId: '', targetSlug: '/' };

    const parts = window.location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'studio-preview' && parts[1]) {
      const projectId = decodeURIComponent(parts[1]);
      const slugParts = parts.slice(2).map(decodeURIComponent);
      return { targetProjectId: projectId, targetSlug: slugParts.length ? `/${slugParts.join('/')}` : '/' };
    }

    const params = new URLSearchParams(window.location.search);
    return { targetProjectId: params.get('projectId') || '', targetSlug: params.get('slug') || '/' };
  }, [propProjectId, propPageSlug]);

  useEffect(() => setCurrentSlug(targetSlug), [targetSlug]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (!targetProjectId) throw new Error('Preview URL is missing a project ID.');
        const loaded = await projectRepository.get(targetProjectId);
        if (!loaded) throw new Error(`Project "${targetProjectId}" was not found.`);
        if (!cancelled) setProject(loaded);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load project.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [targetProjectId]);

  const currentPage: SitePage | undefined = useMemo(() => {
    if (!project?.pages.length) return undefined;
    const wanted = (currentSlug || '/').toLowerCase();
    return project.pages.find((page) => (page.slug || '/').toLowerCase() === wanted);
  }, [project, currentSlug]);

  const postAction = (actionId: string, payload?: Record<string, unknown>) => {
    if (typeof window !== 'undefined' && window.parent !== window) {
      window.parent.postMessage(
        { type: 'natanel-studio-preview-action', projectId: project?.id, actionId, payload, timestamp: new Date().toISOString() },
        window.location.origin
      );
    }
  };

  if (loading) return <PreviewMessage title="Studio Preview" message="Loading project…" />;
  if (error || !project) return <PreviewMessage title="Preview Error" message={error || 'Project not available.'} tone="#ef4444" />;
  if (!project.pages.length) return <PreviewMessage title="Empty Project" message="This project has no composed pages yet." />;
  if (!currentPage) return <PreviewMessage title="Page Not Found" message={`No composed page exists at "${currentSlug}".`} tone="#f59e0b" />;

  return (
    <div style={{ minHeight: '100vh', width: '100%', margin: 0, padding: 0 }}>
      <StudioSiteRenderer
        project={project}
        page={currentPage}
        contentMode="production"
        onAction={(actionId, payload) => {
          postAction(actionId, payload);
          if (actionId === 'navigate' && typeof payload?.target === 'string') {
            const target = payload.target;
            if (target.startsWith('/') && project.pages.some((page) => page.slug === target)) setCurrentSlug(target);
          }
        }}
      />
    </div>
  );
}
