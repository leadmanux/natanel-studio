import React, { useState, useMemo } from 'react';
import {
  Layers,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Copy,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Edit3,
  Image as ImageIcon,
  Sparkles,
  Monitor,
  Tablet,
  Smartphone,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  Check,
  X,
  FileText,
  Settings,
} from 'lucide-react';
import type { Project, SitePage, SiteSection, SectionContentStatus } from '@shared/project';
import { demoComponents, type ComponentDefinition } from '@shared/componentRegistry';
import { hasComponentImplementation } from '@shared/componentImplementations';
import { getContentContract, validateComponentContent } from '@shared/contentContracts';
import { resolveSectionAssets } from '@shared/assetBinding';
import { StudioSiteRenderer } from '../studio-components/StudioSiteRenderer';
import { requestSitePlan, requestSiteCompose, requestSectionCompose } from '../ai/client';
import type { SiteComposerProgress, SectionCompositionProgressStatus } from '../ai/contracts';
import type { StudioMotionPreset } from '../studio-components/types';

export interface BuildWorkspaceProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onProceedToPreview?: () => void;
  onProceedToDesign?: () => void;
}

export function BuildWorkspace({
  project,
  onUpdateProject,
  onProceedToPreview,
  onProceedToDesign,
}: BuildWorkspaceProps) {
  // Navigation & Selection state
  const [selectedPageId, setSelectedPageId] = useState<string>(() => {
    return project.pages && project.pages.length > 0 ? project.pages[0].id : '';
  });
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  // Viewport & Canvas mode
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');

  // AI Orchestration state
  const [isComposing, setIsComposing] = useState(false);
  const [compositionProgress, setCompositionProgress] = useState<SiteComposerProgress | null>(null);
  const [compositionMessage, setCompositionMessage] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);

  // Modals / Dropdowns
  const [isAddPageModalOpen, setIsAddPageModalOpen] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);

  // Selected Page
  const currentPage = useMemo(() => {
    if (!project.pages || project.pages.length === 0) return undefined;
    return project.pages.find((p) => p.id === selectedPageId) || project.pages[0];
  }, [project.pages, selectedPageId]);

  // Selected Section
  const currentSection = useMemo(() => {
    if (!currentPage || !selectedSectionId) return undefined;
    return currentPage.sections.find((s) => s.id === selectedSectionId);
  }, [currentPage, selectedSectionId]);

  // Canonical Approved Components only
  const approvedComponents = useMemo(() => {
    return demoComponents.filter(
      (c) => c.status === 'approved' && hasComponentImplementation(c.id)
    );
  }, []);

  const isRtl = project.business.direction === 'rtl';

  // Compatible components for replacement (filtered by direction & project type)
  const compatibleReplacementOptions = useMemo(() => {
    if (!currentSection) return [];
    return approvedComponents.filter((c) => {
      if (isRtl && c.rtlReady === false) return false;
      if (c.category === 'ecommerce' && project.projectType !== 'shopify') return false;
      return true;
    });
  }, [currentSection, approvedComponents, isRtl, project.projectType]);

  // --- ACTIONS: SITE PLANNING ---
  const handlePlanSiteStructure = async () => {
    setIsPlanning(true);
    try {
      const plannedPages = await requestSitePlan(project);
      const updated: Project = {
        ...project,
        pages: plannedPages,
        status: project.status === 'brief' ? 'building' : project.status,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updated);
      if (plannedPages.length > 0) {
        setSelectedPageId(plannedPages[0].id);
        if (plannedPages[0].sections.length > 0) {
          setSelectedSectionId(plannedPages[0].sections[0].id);
        }
      }
    } catch (err: any) {
      alert(`Site planning failed: ${err.message}`);
    } finally {
      setIsPlanning(false);
    }
  };

  // --- ACTIONS: COMPOSE WEBSITE ---
  const handleComposeWebsite = async () => {
    // Check if design system has been approved
    if (!project.designSystem.artDirection) {
      const proceed = window.confirm(
        'Art Direction has not been approved in the Design tab yet. Composition will use baseline tokens. Proceed?'
      );
      if (!proceed) return;
    }

    // Check if pages exist
    if (!project.pages || project.pages.length === 0) {
      alert('Please plan site structure before composing copy.');
      return;
    }

    setIsComposing(true);
    setCompositionMessage('Initiating Studio Content Composer...');

    try {
      // Stream step-by-step progress simulation visually while calling server composer
      const totalSections = project.pages.reduce((acc, p) => acc + p.sections.length, 0);
      let count = 0;

      for (const p of project.pages) {
        for (const s of p.sections) {
          count++;
          setCompositionProgress({
            pageId: p.id,
            pageName: p.name,
            sectionId: s.id,
            sectionName: s.name,
            status: 'generating_copy',
            message: `Writing copy for ${s.name} (${count}/${totalSections})...`,
          });
        }
      }

      const result = await requestSiteCompose(project);

      const updated: Project = {
        ...project,
        pages: result.pages,
        status: 'review',
        updatedAt: new Date().toISOString(),
      };

      onUpdateProject(updated);
      setCompositionMessage('Composition complete! All sections updated with truthful content.');
      setTimeout(() => {
        setIsComposing(false);
        setCompositionProgress(null);
        setCompositionMessage(null);
      }, 1200);
    } catch (err: any) {
      alert(`Composition failed: ${err.message}`);
      setIsComposing(false);
      setCompositionProgress(null);
      setCompositionMessage(null);
    }
  };

  // --- ACTIONS: REGENERATE SECTION COPY ---
  const handleRegenerateSectionCopy = async () => {
    if (!currentPage || !currentSection) return;
    setIsRegeneratingSection(true);

    try {
      const result = await requestSectionCompose(project, currentPage.id, currentSection.id);
      const updatedPages = project.pages.map((p) => {
        if (p.id !== currentPage.id) return p;
        return {
          ...p,
          sections: p.sections.map((s) => (s.id === currentSection.id ? result.section : s)),
        };
      });

      const updated: Project = {
        ...project,
        pages: updatedPages,
        updatedAt: new Date().toISOString(),
      };
      onUpdateProject(updated);
    } catch (err: any) {
      alert(`Section regeneration failed: ${err.message}`);
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  // --- MANUAL PAGE CONTROLS (Section 13) ---
  const handleAddPage = () => {
    if (!newPageName.trim()) {
      setPageError('Page name is required.');
      return;
    }

    let slug = newPageSlug.trim();
    if (!slug) {
      slug = `/${newPageName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    }
    if (!slug.startsWith('/')) {
      slug = `/${slug}`;
    }

    // Check duplicate slug
    const exists = project.pages.some((p) => p.slug.toLowerCase() === slug.toLowerCase());
    if (exists) {
      setPageError(`A page with slug "${slug}" already exists.`);
      return;
    }

    const newPage: SitePage = {
      id: `page_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: newPageName.trim(),
      slug,
      purpose: `${newPageName.trim()} page`,
      sections: [],
    };

    const updated: Project = {
      ...project,
      pages: [...project.pages, newPage],
      updatedAt: new Date().toISOString(),
    };

    onUpdateProject(updated);
    setSelectedPageId(newPage.id);
    setIsAddPageModalOpen(false);
    setNewPageName('');
    setNewPageSlug('');
    setPageError(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (project.pages.length <= 1) {
      alert('Cannot delete the last page of the project.');
      return;
    }
    const page = project.pages.find((p) => p.id === pageId);
    if (!confirm(`Are you sure you want to delete page "${page?.name || 'this page'}"?`)) {
      return;
    }

    const updatedPages = project.pages.filter((p) => p.id !== pageId);
    const updated: Project = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    onUpdateProject(updated);
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0].id);
      setSelectedSectionId(null);
    }
  };

  const handleUpdatePageSlug = (pageId: string, newSlug: string) => {
    let clean = newSlug.trim();
    if (!clean.startsWith('/')) clean = `/${clean}`;

    const exists = project.pages.some(
      (p) => p.id !== pageId && p.slug.toLowerCase() === clean.toLowerCase()
    );
    if (exists) {
      alert(`A page with slug "${clean}" already exists.`);
      return;
    }

    const updatedPages = project.pages.map((p) => (p.id === pageId ? { ...p, slug: clean } : p));
    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
  };

  // --- MANUAL SECTION CONTROLS (Section 10 & 13) ---
  const handleAddSection = (componentId: string) => {
    if (!currentPage) return;
    const comp = approvedComponents.find((c) => c.id === componentId);
    if (!comp) return;

    const newSection: SiteSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: comp.name,
      componentRegistryId: comp.id,
      purpose: comp.description || comp.name,
      content: {},
      assetIds: [],
      order: currentPage.sections.length + 1,
      motionPreset: 'fadeSettle',
      contentStatus: 'needs_input',
    };

    const updatedPages = project.pages.map((p) => {
      if (p.id !== currentPage.id) return p;
      return {
        ...p,
        sections: [...p.sections, newSection],
      };
    });

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
    setSelectedSectionId(newSection.id);
    setIsAddSectionModalOpen(false);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!currentPage) return;
    const updatedSections = currentPage.sections
      .filter((s) => s.id !== sectionId)
      .map((s, idx) => ({ ...s, order: idx + 1 }));

    const updatedPages = project.pages.map((p) =>
      p.id === currentPage.id ? { ...p, sections: updatedSections } : p
    );

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(null);
    }
  };

  const handleDuplicateSection = (sectionId: string) => {
    if (!currentPage) return;
    const targetIdx = currentPage.sections.findIndex((s) => s.id === sectionId);
    if (targetIdx === -1) return;

    const source = currentPage.sections[targetIdx];
    const clone: SiteSection = {
      ...source,
      id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${source.name} (Copy)`,
      order: targetIdx + 2,
    };

    const nextSections = [
      ...currentPage.sections.slice(0, targetIdx + 1),
      clone,
      ...currentPage.sections.slice(targetIdx + 1),
    ].map((s, idx) => ({ ...s, order: idx + 1 }));

    const updatedPages = project.pages.map((p) =>
      p.id === currentPage.id ? { ...p, sections: nextSections } : p
    );

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
    setSelectedSectionId(clone.id);
  };

  const handleMoveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!currentPage) return;
    const idx = currentPage.sections.findIndex((s) => s.id === sectionId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === currentPage.sections.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...currentPage.sections];
    const temp = reordered[idx];
    reordered[idx] = reordered[swapIdx];
    reordered[swapIdx] = temp;

    const indexed = reordered.map((s, i) => ({ ...s, order: i + 1 }));

    const updatedPages = project.pages.map((p) =>
      p.id === currentPage.id ? { ...p, sections: indexed } : p
    );

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
  };

  const handleReplaceComponent = (newRegistryId: string) => {
    if (!currentPage || !currentSection) return;
    const comp = approvedComponents.find((c) => c.id === newRegistryId);
    if (!comp) return;

    const updatedSection: SiteSection = {
      ...currentSection,
      componentRegistryId: comp.id,
      name: comp.name,
      content: {}, // Reset content to avoid invalid shape
      contentStatus: 'needs_input',
      contentDiagnostics: ['Component replaced. Click Regenerate Copy or edit content in inspector.'],
    };

    const updatedPages = project.pages.map((p) => {
      if (p.id !== currentPage.id) return p;
      return {
        ...p,
        sections: p.sections.map((s) => (s.id === currentSection.id ? updatedSection : s)),
      };
    });

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
  };

  const handleUpdateSectionField = (field: string, value: any) => {
    if (!currentPage || !currentSection) return;

    const nextContent = {
      ...currentSection.content,
      [field]: value,
    };

    // Revalidate against contract
    const validation = validateComponentContent(currentSection.componentRegistryId, nextContent);

    const updatedSection: SiteSection = {
      ...currentSection,
      content: nextContent,
      contentStatus: validation.success ? 'ready' : 'needs_input',
      missingFactualFields: currentSection.missingFactualFields?.filter((f) => f !== field && value),
    };

    const updatedPages = project.pages.map((p) => {
      if (p.id !== currentPage.id) return p;
      return {
        ...p,
        sections: p.sections.map((s) => (s.id === currentSection.id ? updatedSection : s)),
      };
    });

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
  };

  const handleUpdateMotionPreset = (preset: StudioMotionPreset) => {
    if (!currentPage || !currentSection) return;

    const updatedSection: SiteSection = {
      ...currentSection,
      motionPreset: preset,
    };

    const updatedPages = project.pages.map((p) => {
      if (p.id !== currentPage.id) return p;
      return {
        ...p,
        sections: p.sections.map((s) => (s.id === currentSection.id ? updatedSection : s)),
      };
    });

    onUpdateProject({ ...project, pages: updatedPages, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="build-workspace-container" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '840px', background: '#09090b' }}>
      {/* Workspace Sub-Header / Global Action Bar */}
      <div
        className="build-workspace-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 20px',
          background: '#121216',
          borderBottom: '1px solid #222226',
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="eyebrow" style={{ margin: 0 }}>
            SITE COMPOSER V1
          </span>
          <span style={{ color: '#52525b' }}>|</span>
          <span style={{ fontSize: '13px', color: '#d4d4d8', fontWeight: 500 }}>
            {project.business.businessName || project.name}
          </span>
          {isRtl && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 6px',
                background: 'rgba(214, 168, 79, 0.15)',
                color: '#d6a84f',
                border: '1px solid rgba(214, 168, 79, 0.3)',
                borderRadius: '3px',
              }}
            >
              RTL
            </span>
          )}
        </div>

        {/* Viewport & Theme controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ display: 'flex', background: '#18181b', padding: '3px', borderRadius: '4px', border: '1px solid #27272a' }}>
            <button
              title="Desktop"
              onClick={() => setViewport('desktop')}
              style={{
                background: viewport === 'desktop' ? '#27272a' : 'transparent',
                color: viewport === 'desktop' ? '#ffffff' : '#71717a',
                border: 'none',
                padding: '5px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              <Monitor size={14} />
            </button>
            <button
              title="Tablet"
              onClick={() => setViewport('tablet')}
              style={{
                background: viewport === 'tablet' ? '#27272a' : 'transparent',
                color: viewport === 'tablet' ? '#ffffff' : '#71717a',
                border: 'none',
                padding: '5px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              <Tablet size={14} />
            </button>
            <button
              title="Mobile"
              onClick={() => setViewport('mobile')}
              style={{
                background: viewport === 'mobile' ? '#27272a' : 'transparent',
                color: viewport === 'mobile' ? '#ffffff' : '#71717a',
                border: 'none',
                padding: '5px 8px',
                cursor: 'pointer',
                borderRadius: '2px',
              }}
            >
              <Smartphone size={14} />
            </button>
          </div>

          <button
            title="Toggle theme"
            onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')}
            style={{
              background: '#18181b',
              color: '#a1a1aa',
              border: '1px solid #27272a',
              padding: '5px 10px',
              fontSize: '11px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {themeMode.toUpperCase()}
          </button>
        </div>

        {/* Primary Build Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {project.pages.length === 0 ? (
            <button
              className="secondary-button"
              onClick={handlePlanSiteStructure}
              disabled={isPlanning}
              style={{ padding: '6px 14px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Sparkles size={14} />
              <span>{isPlanning ? 'Planning Structure...' : 'Plan Site Structure'}</span>
            </button>
          ) : (
            <button
              className="primary-button"
              onClick={handleComposeWebsite}
              disabled={isComposing}
              style={{
                padding: '7px 16px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: isComposing ? '#27272a' : '#2563eb',
              }}
            >
              <Sparkles size={15} />
              <span>{isComposing ? 'Composing Truthful Copy...' : 'COMPOSE WEBSITE'}</span>
            </button>
          )}

          {onProceedToPreview && (
            <button
              className="secondary-button"
              onClick={onProceedToPreview}
              style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span>Preview</span>
              <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Composition Progress Banner */}
      {isComposing && compositionProgress && (
        <div
          style={{
            background: '#1e3a8a',
            color: '#bfdbfe',
            padding: '8px 20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1d4ed8',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={13} className="animate-spin" />
            <span>
              <strong>Composing:</strong> {compositionProgress.pageName} &gt; {compositionProgress.sectionName}
            </span>
          </div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', opacity: 0.8 }}>
            Status: {compositionProgress.status}
          </span>
        </div>
      )}

      {/* 3-Pane Professional Architecture */}
      <div className="build-workspace-panes" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ========================================================================= */}
        {/* PANE 1: LEFT SIDEBAR (PAGE TREE & SECTION OUTLINE)                        */}
        {/* ========================================================================= */}
        <div
          className="pane-left-tree"
          style={{
            width: '280px',
            background: '#111114',
            borderRight: '1px solid #222226',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {/* Pages Header */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: '1px solid #1f1f23',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
              Pages ({project.pages.length})
            </span>
            <button
              onClick={() => setIsAddPageModalOpen(true)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#a1a1aa',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <Plus size={13} /> Add Page
            </button>
          </div>

          {/* Page Tree List */}
          <div style={{ padding: '8px' }}>
            {project.pages.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: '#71717a', fontSize: '12px' }}>
                <p style={{ margin: '0 0 10px 0' }}>No pages yet.</p>
                <button
                  className="primary-button"
                  onClick={handlePlanSiteStructure}
                  style={{ fontSize: '11px', padding: '6px 12px' }}
                >
                  Plan Architecture
                </button>
              </div>
            ) : (
              project.pages.map((p) => {
                const isActive = p.id === currentPage?.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedPageId(p.id);
                      if (p.sections.length > 0 && !p.sections.some((s) => s.id === selectedSectionId)) {
                        setSelectedSectionId(p.sections[0].id);
                      }
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '4px',
                      background: isActive ? '#1c1c21' : 'transparent',
                      border: isActive ? '1px solid #2e2e36' : '1px solid transparent',
                      marginBottom: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: isActive ? 600 : 400, color: isActive ? '#ffffff' : '#d4d4d8' }}>
                        {p.name}
                      </div>
                      <div style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                        {p.slug} • {p.sections.length} sections
                      </div>
                    </div>
                    {project.pages.length > 1 && (
                      <button
                        title="Delete page"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePage(p.id);
                        }}
                        style={{ background: 'transparent', border: 'none', color: '#52525b', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Section Outline Header */}
          {currentPage && (
            <>
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid #1f1f23',
                  borderBottom: '1px solid #1f1f23',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#0d0d0f',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#71717a' }}>
                  {currentPage.name} Sections ({currentPage.sections.length})
                </span>
                <button
                  onClick={() => setIsAddSectionModalOpen(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#3b82f6',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '11px',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={13} /> Section
                </button>
              </div>

              {/* Sections Ordered List */}
              <div style={{ flex: 1, padding: '8px', overflowY: 'auto' }}>
                {currentPage.sections.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#71717a', fontSize: '12px' }}>
                    No sections in this page. Click "+ Section" to insert one.
                  </div>
                ) : (
                  currentPage.sections
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((sec, idx) => {
                      const isSelected = sec.id === selectedSectionId;
                      const hasMissingFactual = sec.missingFactualFields && sec.missingFactualFields.length > 0;
                      const hasMissingAsset = sec.missingAssetRequirements && sec.missingAssetRequirements.length > 0;

                      return (
                        <div
                          key={sec.id}
                          onClick={() => setSelectedSectionId(sec.id)}
                          style={{
                            padding: '8px 10px',
                            borderRadius: '4px',
                            background: isSelected ? '#1e293b' : '#141418',
                            border: isSelected ? '1px solid #3b82f6' : '1px solid #222226',
                            marginBottom: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.1s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '10px', color: '#71717a', fontFamily: 'monospace' }}>
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              <span style={{ fontSize: '12px', fontWeight: isSelected ? 600 : 500, color: isSelected ? '#ffffff' : '#e4e4e7' }}>
                                {sec.name}
                              </span>
                            </div>

                            {/* Status indicator icon */}
                            {sec.contentStatus === 'ready' && !hasMissingAsset ? (
                              <span title="Ready" style={{ display: 'inline-flex' }}>
                                <CheckCircle2 size={12} style={{ color: '#22c55e' }} />
                              </span>
                            ) : hasMissingFactual || hasMissingAsset ? (
                              <span title="Needs Input / Missing Asset" style={{ display: 'inline-flex' }}>
                                <AlertTriangle size={12} style={{ color: '#f59e0b' }} />
                              </span>
                            ) : (
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b' }} />
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                              {sec.componentRegistryId}
                            </span>

                            {/* Reordering and remove controls */}
                            <div style={{ display: 'flex', gap: '2px' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                title="Move up"
                                disabled={idx === 0}
                                onClick={() => handleMoveSection(sec.id, 'up')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: idx === 0 ? '#3f3f46' : '#a1a1aa',
                                  cursor: idx === 0 ? 'default' : 'pointer',
                                  padding: '2px',
                                }}
                              >
                                <ArrowUp size={11} />
                              </button>
                              <button
                                title="Move down"
                                disabled={idx === currentPage.sections.length - 1}
                                onClick={() => handleMoveSection(sec.id, 'down')}
                                style={{
                                  background: 'transparent',
                                  border: 'none',
                                  color: idx === currentPage.sections.length - 1 ? '#3f3f46' : '#a1a1aa',
                                  cursor: idx === currentPage.sections.length - 1 ? 'default' : 'pointer',
                                  padding: '2px',
                                }}
                              >
                                <ArrowDown size={11} />
                              </button>
                              <button
                                title="Duplicate"
                                onClick={() => handleDuplicateSection(sec.id)}
                                style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '2px' }}
                              >
                                <Copy size={11} />
                              </button>
                              <button
                                title="Delete"
                                onClick={() => handleRemoveSection(sec.id)}
                                style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                              >
                                <Trash2 size={11} />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                )}
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PANE 2: CENTER CANVAS (LIVE INTERACTIVE SITE PREVIEW)                     */}
        {/* ========================================================================= */}
        <div
          className="pane-center-canvas"
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            background: '#0a0a0d',
            overflowY: 'auto',
            padding: viewport === 'desktop' ? '0' : '24px 16px',
            position: 'relative',
          }}
          onClick={() => setSelectedSectionId(null)}
        >
          {currentPage ? (
            <div
              style={{
                width: viewport === 'mobile' ? '375px' : viewport === 'tablet' ? '768px' : '100%',
                maxWidth: '100%',
                minHeight: '100%',
                boxShadow: viewport === 'desktop' ? 'none' : '0 20px 40px rgba(0,0,0,0.6)',
                border: viewport === 'desktop' ? 'none' : '1px solid #27272a',
                transition: 'width 0.2s ease',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <StudioSiteRenderer
                project={project}
                page={currentPage}
                contentMode="production"
                previewMode={viewport}
                themeMode={themeMode}
                isBuilderMode={true}
                selectedSectionId={selectedSectionId || undefined}
                onSelectSection={(id) => setSelectedSectionId(id)}
              />
            </div>
          ) : (
            <div style={{ padding: '80px', textAlign: 'center', color: '#71717a' }}>
              Select or create a page to preview.
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* PANE 3: RIGHT SIDEBAR (SELECTED SECTION INSPECTOR)                        */}
        {/* ========================================================================= */}
        <div
          className="pane-right-inspector"
          style={{
            width: '320px',
            background: '#111114',
            borderLeft: '1px solid #222226',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          {currentSection ? (
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Section Header */}
              <div style={{ borderBottom: '1px solid #222226', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="eyebrow" style={{ margin: 0 }}>
                    SECTION INSPECTOR
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontWeight: 600,
                      background:
                        currentSection.contentStatus === 'ready'
                          ? 'rgba(34, 197, 94, 0.15)'
                          : currentSection.contentStatus === 'invalid'
                          ? 'rgba(239, 68, 68, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                      color:
                        currentSection.contentStatus === 'ready'
                          ? '#4ade80'
                          : currentSection.contentStatus === 'invalid'
                          ? '#f87171'
                          : '#fbbf24',
                    }}
                  >
                    {currentSection.contentStatus ? currentSection.contentStatus.toUpperCase() : 'NEEDS INPUT'}
                  </span>
                </div>
                <h3 style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0 2px 0', color: '#f4f4f2' }}>
                  {currentSection.name}
                </h3>
                <span style={{ fontSize: '11px', color: '#71717a', fontFamily: 'monospace' }}>
                  {currentSection.componentRegistryId}
                </span>
              </div>

              {/* Missing Factual Inputs Callout (Truthfulness Enforcement) */}
              {currentSection.missingFactualFields && currentSection.missingFactualFields.length > 0 && (
                <div
                  style={{
                    background: '#1c170d',
                    border: '1px solid #78350f',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fbbf24', fontWeight: 600, marginBottom: '4px' }}>
                    <AlertTriangle size={14} />
                    <span>Factual Input Required</span>
                  </div>
                  <p style={{ margin: '0 0 6px 0', color: '#d4d4d8', fontSize: '11px', lineHeight: 1.5 }}>
                    In production mode, Gemini does NOT fabricate fake statistics, unverified ratings, or unverified claims.
                    Please provide truthful data for:
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                    {currentSection.missingFactualFields.map((field) => (
                      <span
                        key={field}
                        style={{
                          background: '#2e1f0e',
                          color: '#fcd34d',
                          border: '1px solid #b45309',
                          padding: '1px 6px',
                          borderRadius: '2px',
                          fontSize: '10px',
                          fontFamily: 'monospace',
                        }}
                      >
                        {field}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Asset Warning */}
              {currentSection.missingAssetRequirements && currentSection.missingAssetRequirements.length > 0 && (
                <div
                  style={{
                    background: '#1f1313',
                    border: '1px solid #7f1d1d',
                    padding: '10px 12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#f87171', fontWeight: 600, marginBottom: '4px' }}>
                    <ImageIcon size={14} />
                    <span>Required Asset Missing</span>
                  </div>
                  <p style={{ margin: 0, color: '#fca5a5', fontSize: '11px' }}>
                    Slots: {currentSection.missingAssetRequirements.join(', ')}. Generate or bind assets in the Asset Library.
                  </p>
                </div>
              )}

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="secondary-button"
                  onClick={handleRegenerateSectionCopy}
                  disabled={isRegeneratingSection}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <RefreshCw size={12} className={isRegeneratingSection ? 'animate-spin' : ''} />
                  <span>{isRegeneratingSection ? 'Regenerating...' : 'Regenerate Copy'}</span>
                </button>

                <button
                  className="secondary-button"
                  onClick={() => {
                    handleUpdateSectionField('_approved', true);
                  }}
                  style={{
                    fontSize: '11px',
                    padding: '6px 10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: '#22c55e',
                  }}
                >
                  <Check size={12} />
                  <span>Approve</span>
                </button>
              </div>

              {/* Component Replacement Dropdown (CANONICAL APPROVED ONLY) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                  REPLACE COMPONENT (CANONICAL ONLY)
                </label>
                <select
                  value={currentSection.componentRegistryId}
                  onChange={(e) => handleReplaceComponent(e.target.value)}
                  style={{
                    width: '100%',
                    background: '#18181c',
                    color: '#e4e4e7',
                    border: '1px solid #27272a',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                >
                  {compatibleReplacementOptions.map((c) => (
                    <option key={c.id} value={c.id}>
                      [{c.category.toUpperCase()}] {c.name}
                    </option>
                  ))}
                </select>
                <span style={{ display: 'block', fontSize: '10px', color: '#71717a', marginTop: '4px' }}>
                  Only approved components with verified implementations can be selected.
                </span>
              </div>

              {/* Motion Preset Selector (Section 10) */}
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#a1a1aa', marginBottom: '6px' }}>
                  MOTION PRESET (IMPLEMENTED)
                </label>
                <select
                  value={currentSection.motionPreset || 'fadeSettle'}
                  onChange={(e) => handleUpdateMotionPreset(e.target.value as StudioMotionPreset)}
                  style={{
                    width: '100%',
                    background: '#18181c',
                    color: '#e4e4e7',
                    border: '1px solid #27272a',
                    padding: '6px 8px',
                    fontSize: '12px',
                    borderRadius: '4px',
                  }}
                >
                  <option value="none">None (Reduced Motion)</option>
                  <option value="fadeSettle">Fade Settle (Balanced)</option>
                  <option value="fadeSlideUp">Fade Slide Up (Editorial)</option>
                  <option value="cinematicReveal">Cinematic Reveal (Restrained)</option>
                </select>
              </div>

              {/* Content Editor: Key Fields */}
              <div style={{ borderTop: '1px solid #222226', paddingTop: '12px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
                  CONTENT FIELDS (MANUAL EDIT)
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {Object.entries(currentSection.content || {}).map(([key, val]) => {
                    if (key.startsWith('_')) return null;
                    const isPrimitive = typeof val === 'string' || typeof val === 'number';

                    if (!isPrimitive) return null;

                    return (
                      <div key={key}>
                        <label style={{ display: 'block', fontSize: '11px', color: '#9d9da5', marginBottom: '3px' }}>
                          {key}
                        </label>
                        <input
                          type="text"
                          value={String(val ?? '')}
                          onChange={(e) => handleUpdateSectionField(key, e.target.value)}
                          style={{
                            width: '100%',
                            background: '#18181c',
                            color: '#ffffff',
                            border: '1px solid #27272a',
                            padding: '5px 8px',
                            fontSize: '12px',
                            borderRadius: '3px',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#71717a', fontSize: '12px' }}>
              <Layers size={28} strokeWidth={1.2} style={{ marginBottom: '8px', color: '#52525b' }} />
              <p style={{ margin: '0 0 4px 0', fontWeight: 500, color: '#a1a1aa' }}>No Section Selected</p>
              <p style={{ margin: 0 }}>Click any section in the outline or on the canvas to inspect and edit.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD PAGE */}
      {isAddPageModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '400px',
              background: '#141418',
              border: '1px solid #27272a',
              borderRadius: '6px',
              padding: '24px',
            }}
          >
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Add New Page</h3>

            {pageError && (
              <div style={{ background: '#2e1313', color: '#f87171', padding: '8px 10px', fontSize: '12px', borderRadius: '4px', marginBottom: '12px' }}>
                {pageError}
              </div>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                Page Name
              </label>
              <input
                type="text"
                placeholder="e.g. Services, About, Portfolio"
                value={newPageName}
                onChange={(e) => {
                  setNewPageName(e.target.value);
                  if (!newPageSlug) {
                    setNewPageSlug(`/${e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
                  }
                }}
                style={{
                  width: '100%',
                  background: '#1a1a20',
                  border: '1px solid #2e2e36',
                  color: '#fff',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#a1a1aa', marginBottom: '4px' }}>
                URL Slug
              </label>
              <input
                type="text"
                placeholder="e.g. /services"
                value={newPageSlug}
                onChange={(e) => setNewPageSlug(e.target.value)}
                style={{
                  width: '100%',
                  background: '#1a1a20',
                  border: '1px solid #2e2e36',
                  color: '#fff',
                  padding: '8px 10px',
                  borderRadius: '4px',
                  fontSize: '13px',
                  fontFamily: 'monospace',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                className="secondary-button"
                onClick={() => {
                  setIsAddPageModalOpen(false);
                  setPageError(null);
                }}
              >
                Cancel
              </button>
              <button className="primary-button" onClick={handleAddPage}>
                Create Page
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SECTION */}
      {isAddSectionModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
        >
          <div
            style={{
              width: '540px',
              maxHeight: '80vh',
              background: '#141418',
              border: '1px solid #27272a',
              borderRadius: '6px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#ffffff' }}>Add Approved Section</h3>
                <span style={{ fontSize: '12px', color: '#71717a' }}>Only canonically approved registry components</span>
              </div>
              <button
                onClick={() => setIsAddSectionModalOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
              {approvedComponents
                .filter((c) => {
                  if (isRtl && c.rtlReady === false) return false;
                  if (c.category === 'ecommerce' && project.projectType !== 'shopify') return false;
                  return true;
                })
                .map((comp) => (
                  <div
                    key={comp.id}
                    onClick={() => handleAddSection(comp.id)}
                    style={{
                      background: '#1a1a20',
                      border: '1px solid #27272a',
                      borderRadius: '4px',
                      padding: '10px 14px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'border-color 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3b82f6')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272a')}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#f4f4f2', marginBottom: '2px' }}>
                        {comp.name}
                      </div>
                      <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                        {comp.description || `Category: ${comp.category}`}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '10px',
                        textTransform: 'uppercase',
                        padding: '2px 6px',
                        borderRadius: '3px',
                        background: '#27272a',
                        color: '#a1a1aa',
                      }}
                    >
                      {comp.category}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
