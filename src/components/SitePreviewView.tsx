import React, { useState, useMemo } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  ShieldCheck,
  Activity,
  Layers,
  Sparkles,
  ChevronRight,
  ArrowRight,
  Info,
} from 'lucide-react';
import type { Project, SitePage } from '@shared/project';
import type { SiteActionRecord } from '@shared/siteActions';
import { StudioSiteRenderer } from '../studio-components/StudioSiteRenderer';

export interface SitePreviewViewProps {
  project: Project;
  onProceedToReview?: () => void;
  onProceedToBuild?: () => void;
}

export function SitePreviewView({ project, onProceedToReview, onProceedToBuild }: SitePreviewViewProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [selectedPageId, setSelectedPageId] = useState<string>(() => {
    return project.pages && project.pages.length > 0 ? project.pages[0].id : '';
  });
  const [actionLogs, setActionLogs] = useState<SiteActionRecord[]>([]);
  const [isLogDrawerOpen, setIsLogDrawerOpen] = useState(false);
  const [useIframeMode, setUseIframeMode] = useState(true);

  const currentPage = useMemo(() => {
    if (!project.pages || project.pages.length === 0) return undefined;
    return project.pages.find((p) => p.id === selectedPageId) || project.pages[0];
  }, [project.pages, selectedPageId]);

  const viewportWidth = useMemo(() => {
    if (viewport === 'mobile') return '375px';
    if (viewport === 'tablet') return '768px';
    return '100%';
  }, [viewport]);

  const previewIframeSrc = useMemo(() => {
    if (!currentPage) return '';
    const cleanSlug = currentPage.slug === '/' ? '' : currentPage.slug.replace(/^\//, '');
    return `/studio-preview/${project.id}/${cleanSlug}`;
  }, [project.id, currentPage]);

  const handleRecordAction = (record: SiteActionRecord) => {
    setActionLogs((prev) => [record, ...prev.slice(0, 49)]);
  };

  if (!project.pages || project.pages.length === 0 || !currentPage) {
    return (
      <div className="preview-empty-state" style={{ padding: '64px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: '520px', margin: '0 auto', background: '#121215', border: '1px solid #27272a', padding: '40px 32px', borderRadius: '4px' }}>
          <Layers size={36} strokeWidth={1.3} style={{ color: '#9d9da5', marginBottom: '16px' }} />
          <h3 style={{ fontSize: '20px', fontWeight: 600, margin: '0 0 10px 0', color: '#f4f4f2' }}>No Assembled Pages Found</h3>
          <p style={{ fontSize: '14px', color: '#8e8e93', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Site Preview requires an assembled and composed page architecture. Open the Build workspace to plan your site structure and compose copy.
          </p>
          <button
            className="primary-button"
            onClick={onProceedToBuild}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            Open Build Workspace <ArrowRight size={15} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="site-preview-workspace" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '800px', background: '#0a0a0c' }}>
      {/* Studio Preview Topbar */}
      <div
        className="preview-toolbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          borderBottom: '1px solid #222226',
          background: '#121216',
          zIndex: 40,
        }}
      >
        {/* Page Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#71717a', fontWeight: 600 }}>
            Page:
          </span>
          <div style={{ display: 'flex', gap: '4px', background: '#18181b', padding: '3px', borderRadius: '4px', border: '1px solid #27272a' }}>
            {project.pages.map((p) => {
              const isActive = p.id === currentPage.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedPageId(p.id)}
                  style={{
                    background: isActive ? '#27272a' : 'transparent',
                    color: isActive ? '#ffffff' : '#a1a1aa',
                    border: 'none',
                    padding: '4px 10px',
                    fontSize: '12px',
                    cursor: 'pointer',
                    fontWeight: isActive ? 600 : 400,
                    borderRadius: '2px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>{p.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.6 }}>{p.slug}</span>
                </button>
              );
            })}
          </div>

          {project.business.direction === 'rtl' && (
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                background: 'rgba(214, 168, 79, 0.15)',
                color: '#d6a84f',
                border: '1px solid rgba(214, 168, 79, 0.3)',
                borderRadius: '3px',
                fontWeight: 600,
              }}
            >
              RTL HEBREW
            </span>
          )}
        </div>

        {/* Viewport Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#18181b', padding: '3px', borderRadius: '4px', border: '1px solid #27272a' }}>
            <button
              title="Desktop Viewport (100%)"
              onClick={() => setViewport('desktop')}
              style={{
                background: viewport === 'desktop' ? '#27272a' : 'transparent',
                color: viewport === 'desktop' ? '#ffffff' : '#71717a',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                borderRadius: '2px',
              }}
            >
              <Monitor size={15} />
              <span>Desktop</span>
            </button>
            <button
              title="Tablet Viewport (768px)"
              onClick={() => setViewport('tablet')}
              style={{
                background: viewport === 'tablet' ? '#27272a' : 'transparent',
                color: viewport === 'tablet' ? '#ffffff' : '#71717a',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                borderRadius: '2px',
              }}
            >
              <Tablet size={15} />
              <span>Tablet (768)</span>
            </button>
            <button
              title="Mobile Viewport (375px)"
              onClick={() => setViewport('mobile')}
              style={{
                background: viewport === 'mobile' ? '#27272a' : 'transparent',
                color: viewport === 'mobile' ? '#ffffff' : '#71717a',
                border: 'none',
                padding: '6px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                borderRadius: '2px',
              }}
            >
              <Smartphone size={15} />
              <span>Mobile (375)</span>
            </button>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Action Log Drawer Toggle */}
          <button
            onClick={() => setIsLogDrawerOpen(!isLogDrawerOpen)}
            style={{
              background: isLogDrawerOpen ? '#27272a' : '#18181b',
              color: actionLogs.length > 0 ? '#38bdf8' : '#a1a1aa',
              border: '1px solid #27272a',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '3px',
            }}
          >
            <Activity size={14} />
            <span>Simulated Actions ({actionLogs.length})</span>
          </button>

          {/* Standalone New Tab */}
          <a
            href={previewIframeSrc}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              background: '#18181b',
              color: '#d4d4d8',
              border: '1px solid #27272a',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              borderRadius: '3px',
              textDecoration: 'none',
            }}
          >
            <ExternalLink size={14} />
            <span>Standalone</span>
          </a>

          {/* Run Design Critic */}
          {onProceedToReview && (
            <button
              className="primary-button"
              onClick={onProceedToReview}
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <ShieldCheck size={14} />
              <span>Review Website</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Stage */}
      <div
        className="preview-viewport-stage"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'stretch',
          background: '#09090b',
          overflowY: 'auto',
          padding: viewport === 'desktop' ? '0' : '32px 16px',
          position: 'relative',
        }}
      >
        <div
          className="viewport-frame-container"
          style={{
            width: viewportWidth,
            maxWidth: '100%',
            height: viewport === 'desktop' ? '100%' : 'calc(100vh - 240px)',
            minHeight: viewport === 'desktop' ? '100%' : '780px',
            background: 'var(--studio-bg, #121214)',
            border: viewport === 'desktop' ? 'none' : '1px solid #27272a',
            borderRadius: viewport === 'desktop' ? '0' : '8px',
            boxShadow: viewport === 'desktop' ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          {/* Viewport Dimensions Marker on mobile/tablet */}
          {viewport !== 'desktop' && (
            <div
              style={{
                background: '#18181b',
                borderBottom: '1px solid #27272a',
                padding: '6px 14px',
                fontSize: '11px',
                color: '#71717a',
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'monospace',
              }}
            >
              <span>{viewport === 'mobile' ? 'Mobile Viewport • 375px' : 'Tablet Viewport • 768px'}</span>
              <span>{currentPage.name} ({currentPage.slug})</span>
            </div>
          )}

          {/* Real responsive iframe reflecting actual viewport media queries */}
          {useIframeMode ? (
            <iframe
              key={`${currentPage.id}-${viewport}`}
              src={previewIframeSrc}
              title={`Studio Site Preview - ${currentPage.name}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flex: 1,
                background: 'transparent',
              }}
              onError={() => setUseIframeMode(false)}
            />
          ) : (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <StudioSiteRenderer
                project={project}
                page={currentPage}
                contentMode="production"
                previewMode={viewport}
                onAction={(actionId, payload) => {
                  handleRecordAction({
                    id: `act_${Date.now()}`,
                    type: (actionId as any) || 'navigate',
                    payload,
                    timestamp: new Date().toISOString(),
                    status: 'simulated',
                    message: `Simulated action "${actionId}"`,
                  });
                }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Simulated Actions Drawer */}
      {isLogDrawerOpen && (
        <div
          className="simulated-actions-drawer"
          style={{
            position: 'fixed',
            bottom: 0,
            right: 0,
            width: '420px',
            maxHeight: '360px',
            background: '#121216',
            border: '1px solid #27272a',
            borderBottom: 'none',
            borderTopLeftRadius: '6px',
            boxShadow: '0 -10px 30px rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid #222226',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={15} style={{ color: '#38bdf8' }} />
              <strong style={{ fontSize: '13px', color: '#f4f4f2' }}>Simulated Action Log</strong>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActionLogs([])}
                style={{ background: 'transparent', border: 'none', color: '#71717a', fontSize: '11px', cursor: 'pointer' }}
              >
                Clear
              </button>
              <button
                onClick={() => setIsLogDrawerOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', fontSize: '14px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
            {actionLogs.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#71717a', margin: 0, textAlign: 'center', padding: '24px 0' }}>
                No actions triggered yet. Interact with buttons, forms, and links inside the preview.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {actionLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      background: '#18181c',
                      border: '1px solid #27272a',
                      padding: '8px 10px',
                      borderRadius: '3px',
                      fontSize: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: '#38bdf8', fontWeight: 600, textTransform: 'uppercase', fontSize: '10px' }}>
                        {log.type}
                      </span>
                      <span style={{ color: '#71717a', fontSize: '10px' }}>
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p style={{ margin: 0, color: '#e4e4e7', fontSize: '12px' }}>{log.message}</p>
                    {log.target && (
                      <span style={{ display: 'block', fontSize: '11px', color: '#9d9da5', marginTop: '2px', fontFamily: 'monospace' }}>
                        Target: {log.target}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
