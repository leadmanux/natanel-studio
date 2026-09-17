import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Check,
  CheckCircle2,
  Copy,
  Database,
  Image as ImageIcon,
  Layers,
  Monitor,
  Plus,
  RefreshCw,
  Smartphone,
  Tablet,
  Trash2,
  X,
} from 'lucide-react';
import type { ComponentDefinition } from '@shared/componentRegistry';
import type { Project, SitePage, SiteSection } from '@shared/project';
import { getEligibleComponents } from '@shared/componentEligibility';
import { getContentContract, validateComponentContent } from '@shared/contentContracts';
import { resolveSectionAssets } from '@shared/assetBinding';
import { createStablePageSlug, normalizeManualSlug } from '@shared/pageSlug';
import { normalizeStudioMotionPreset, STUDIO_MOTION_PRESETS, type StudioMotionPreset } from '@shared/studioMotion';
import { componentRegistryRepository } from '../data/componentRegistryRepository';
import { requestSectionCompose, requestSiteCompose, requestSitePlan } from '../ai/client';
import { StudioSiteRenderer } from '../studio-components/StudioSiteRenderer';
import { ProjectFactsEditor } from './build/ProjectFactsEditor';

export interface BuildWorkspaceProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onProceedToPreview?: () => void;
  onProceedToDesign?: () => void;
  onProceedToAssets?: () => void;
}

function sectionReady(section: SiteSection): boolean {
  return (
    section.contentStatus === 'ready' &&
    !(section.missingFactualFields?.length) &&
    !(section.missingAssetRequirements?.length)
  );
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean)));
}

export function BuildWorkspace({
  project,
  onUpdateProject,
  onProceedToPreview,
  onProceedToDesign,
  onProceedToAssets,
}: BuildWorkspaceProps) {
  const [registry, setRegistry] = useState<ComponentDefinition[]>(() => componentRegistryRepository.getSynchronous());
  const [registryOffline, setRegistryOffline] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState(project.pages[0]?.id || '');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [themeMode, setThemeMode] = useState<'dark' | 'light'>('dark');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isComposing, setIsComposing] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showFacts, setShowFacts] = useState(false);
  const [showAddPage, setShowAddPage] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newPageName, setNewPageName] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = componentRegistryRepository.subscribe((components) => {
      setRegistry(components);
      setRegistryOffline(false);
    });
    componentRegistryRepository.syncWithServer()
      .then((components) => { setRegistry(components); setRegistryOffline(false); })
      .catch(() => setRegistryOffline(true));
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!selectedPageId && project.pages[0]) setSelectedPageId(project.pages[0].id);
  }, [project.pages, selectedPageId]);

  const currentPage = useMemo(
    () => project.pages.find((page) => page.id === selectedPageId) || project.pages[0],
    [project.pages, selectedPageId]
  );
  const currentSection = useMemo(
    () => currentPage?.sections.find((section) => section.id === selectedSectionId),
    [currentPage, selectedSectionId]
  );

  const eligibleComponents = useMemo(() => getEligibleComponents(registry, project), [registry, project]);
  const definitionMap = useMemo(() => new Map(registry.map((item) => [item.id, item])), [registry]);
  const currentDefinition = currentSection ? definitionMap.get(currentSection.componentRegistryId) : undefined;
  const currentContract = currentSection ? getContentContract(currentSection.componentRegistryId) : undefined;
  const currentAssetResolution = useMemo(() => {
    if (!currentPage || !currentSection) return null;
    return resolveSectionAssets(currentSection, currentDefinition, project.assets, currentPage.id);
  }, [currentPage, currentSection, currentDefinition, project.assets]);

  const replacementOptions = useMemo(() => {
    if (!currentDefinition) return [];
    return eligibleComponents.filter((item) => item.category === currentDefinition.category);
  }, [eligibleComponents, currentDefinition]);

  const updateSection = (pageId: string, sectionId: string, updater: (section: SiteSection) => SiteSection) => {
    const pages = project.pages.map((page) => page.id !== pageId ? page : {
      ...page,
      sections: page.sections.map((section) => section.id === sectionId ? updater(section) : section),
    });
    onUpdateProject({ ...project, pages, updatedAt: new Date().toISOString() });
  };

  const handlePlan = async () => {
    setIsPlanning(true);
    setMessage('Planning site structure from the canonical component registry…');
    try {
      const pages = await requestSitePlan(project);
      onUpdateProject({ ...project, pages, status: 'building', updatedAt: new Date().toISOString() });
      setSelectedPageId(pages[0]?.id || '');
      setSelectedSectionId(pages[0]?.sections[0]?.id || null);
      setMessage(`Planned ${pages.length} page${pages.length === 1 ? '' : 's'}.`);
    } catch (error) {
      setMessage(`Planning failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsPlanning(false);
    }
  };

  const handleCompose = async () => {
    if (!project.pages.length) return handlePlan();
    if (!project.designSystem.artDirection && !window.confirm('Art direction is not approved. Compose with explicit fallback tokens?')) return;
    setIsComposing(true);
    setMessage('Composing production-safe copy and binding verified assets…');
    try {
      const result = await requestSiteCompose(project);
      const allReady = result.pages.every((page) => page.sections.every(sectionReady));
      onUpdateProject({
        ...project,
        pages: result.pages,
        status: allReady ? 'review' : 'building',
        updatedAt: new Date().toISOString(),
      });
      setMessage(allReady ? 'Composition complete. Site is ready for review.' : 'Composition complete. Some sections still need verified facts or assets.');
    } catch (error) {
      setMessage(`Composition failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsComposing(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentPage || !currentSection) return;
    setIsRegenerating(true);
    try {
      const result = await requestSectionCompose(project, currentPage.id, currentSection.id);
      updateSection(currentPage.id, currentSection.id, () => result.section);
      setMessage(result.section.contentStatus === 'ready' ? 'Section recomposed and ready.' : 'Section recomposed; verified input is still required.');
    } catch (error) {
      setMessage(`Section composition failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleAddPage = () => {
    const name = newPageName.trim();
    if (!name) return setPageError('Page name is required.');
    const used = new Set(project.pages.map((page) => page.slug.toLowerCase()));
    const slug = newPageSlug.trim()
      ? normalizeManualSlug(newPageSlug)
      : createStablePageSlug(name, project.pages.length, used);
    if (project.pages.some((page) => page.slug.toLowerCase() === slug.toLowerCase())) {
      return setPageError(`Slug "${slug}" is already in use.`);
    }
    const page: SitePage = {
      id: `page_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      slug,
      purpose: `${name} page`,
      sections: [],
    };
    onUpdateProject({ ...project, pages: [...project.pages, page], updatedAt: new Date().toISOString() });
    setSelectedPageId(page.id);
    setSelectedSectionId(null);
    setShowAddPage(false);
    setNewPageName('');
    setNewPageSlug('');
    setPageError(null);
  };

  const handleDeletePage = (pageId: string) => {
    if (project.pages.length <= 1) return setMessage('The final page cannot be deleted.');
    const page = project.pages.find((item) => item.id === pageId);
    if (!window.confirm(`Delete "${page?.name || 'this page'}"?`)) return;
    const pages = project.pages.filter((item) => item.id !== pageId);
    onUpdateProject({ ...project, pages, updatedAt: new Date().toISOString() });
    setSelectedPageId(pages[0]?.id || '');
    setSelectedSectionId(null);
  };

  const handleAddSection = (componentId: string) => {
    if (!currentPage) return;
    const component = eligibleComponents.find((item) => item.id === componentId);
    if (!component) return;
    const section: SiteSection = {
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: component.name,
      componentRegistryId: component.id,
      purpose: component.description || component.name,
      content: {},
      assetIds: [],
      assetBindings: {},
      order: currentPage.sections.length + 1,
      motionPreset: 'fadeSettle',
      contentStatus: 'needs_input',
      contentApproved: false,
    };
    const pages = project.pages.map((page) => page.id === currentPage.id ? { ...page, sections: [...page.sections, section] } : page);
    onUpdateProject({ ...project, pages, updatedAt: new Date().toISOString() });
    setSelectedSectionId(section.id);
    setShowAddSection(false);
  };

  const handleRemoveSection = (sectionId: string) => {
    if (!currentPage) return;
    const sections = currentPage.sections.filter((item) => item.id !== sectionId).map((item, index) => ({ ...item, order: index + 1 }));
    const pages = project.pages.map((page) => page.id === currentPage.id ? { ...page, sections } : page);
    onUpdateProject({ ...project, pages, updatedAt: new Date().toISOString() });
    if (selectedSectionId === sectionId) setSelectedSectionId(null);
  };

  const handleDuplicateSection = (sectionId: string) => {
    if (!currentPage) return;
    const index = currentPage.sections.findIndex((item) => item.id === sectionId);
    if (index < 0) return;
    const source = currentPage.sections[index];
    const clone: SiteSection = {
      ...source,
      id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: `${source.name} (Copy)`,
      contentApproved: false,
      assetBindings: { ...(source.assetBindings || {}) },
    };
    const sections = [...currentPage.sections.slice(0, index + 1), clone, ...currentPage.sections.slice(index + 1)]
      .map((item, position) => ({ ...item, order: position + 1 }));
    const pages = project.pages.map((page) => page.id === currentPage.id ? { ...page, sections } : page);
    onUpdateProject({ ...project, pages, updatedAt: new Date().toISOString() });
    setSelectedSectionId(clone.id);
  };

  const handleMove = (sectionId: string, delta: -1 | 1) => {
    if (!currentPage) return;
    const index = currentPage.sections.findIndex((item) => item.id === sectionId);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= currentPage.sections.length) return;
    const sections = [...currentPage.sections];
    [sections[index], sections[target]] = [sections[target], sections[index]];
    const ordered = sections.map((item, position) => ({ ...item, order: position + 1 }));
    const pages = project.pages.map((page) => page.id === currentPage.id ? { ...page, sections: ordered } : page);
    onUpdateProject({ ...project, pages, updatedAt: new Date().toISOString() });
  };

  const handleReplace = (componentId: string) => {
    if (!currentPage || !currentSection) return;
    const component = replacementOptions.find((item) => item.id === componentId);
    if (!component) return;
    updateSection(currentPage.id, currentSection.id, (section) => ({
      ...section,
      name: component.name,
      componentRegistryId: component.id,
      content: {},
      assetIds: [],
      assetBindings: {},
      contentStatus: 'needs_input',
      contentApproved: false,
      missingFactualFields: undefined,
      missingAssetRequirements: undefined,
      contentDiagnostics: ['Component replaced. Recompose this section before approval.'],
    }));
  };

  const handleGeneratedField = (field: string, value: unknown) => {
    if (!currentPage || !currentSection || !currentContract?.generatedCopyFields.includes(field)) return;
    const nextContent = { ...currentSection.content, [field]: value };
    const validation = validateComponentContent(currentSection.componentRegistryId, nextContent);
    const missingFacts = currentSection.missingFactualFields || [];
    const missingAssets = currentAssetResolution?.missingMandatorySlots.map((slot) => slot.slot) || [];
    const status = missingFacts.length || missingAssets.length ? 'needs_input' : validation.success ? 'ready' : 'invalid';
    updateSection(currentPage.id, currentSection.id, (section) => ({
      ...section,
      content: nextContent,
      contentStatus: status,
      contentApproved: false,
      missingAssetRequirements: missingAssets,
      contentDiagnostics: validation.success ? section.contentDiagnostics : validation.errors,
    }));
  };

  const handleAssetBinding = (slot: string, assetId: string) => {
    if (!currentPage || !currentSection) return;
    const bindings = { ...(currentSection.assetBindings || {}) };
    if (assetId) bindings[slot] = assetId;
    else delete bindings[slot];
    const draft: SiteSection = {
      ...currentSection,
      assetBindings: bindings,
      assetIds: unique(Object.values(bindings)),
      contentApproved: false,
    };
    const resolution = resolveSectionAssets(draft, currentDefinition, project.assets, currentPage.id);
    const missingAssets = resolution.missingMandatorySlots.map((item) => item.slot);
    const validation = validateComponentContent(draft.componentRegistryId, draft.content);
    const status = (draft.missingFactualFields?.length || missingAssets.length)
      ? 'needs_input'
      : validation.success ? 'ready' : 'invalid';
    updateSection(currentPage.id, currentSection.id, () => ({
      ...draft,
      assetIds: resolution.boundAssetIds,
      missingAssetRequirements: missingAssets,
      contentStatus: status,
    }));
  };

  const handleApprove = () => {
    if (!currentPage || !currentSection || !sectionReady(currentSection)) return;
    updateSection(currentPage.id, currentSection.id, (section) => ({ ...section, contentApproved: true }));
  };

  const handleMotion = (preset: StudioMotionPreset) => {
    if (!currentPage || !currentSection) return;
    updateSection(currentPage.id, currentSection.id, (section) => ({ ...section, motionPreset: normalizeStudioMotionPreset(preset), contentApproved: false }));
  };

  const eligibleAssets = project.assets.filter((asset) => (asset.status === 'approved' || asset.status === 'generated') && asset.outputUrl);
  const canApprove = Boolean(currentSection && sectionReady(currentSection));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 820, background: '#09090b', color: '#e4e4e7' }}>
      <div style={{ minHeight: 54, padding: '9px 16px', borderBottom: '1px solid #232328', background: '#111114', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', color: '#71717a' }}>SITE COMPOSER</div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{project.business.businessName || project.name}</div>
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['desktop', 'tablet', 'mobile'] as const).map((mode) => (
            <button key={mode} onClick={() => setViewport(mode)} title={mode} style={{ border: '1px solid #2b2b31', background: viewport === mode ? '#29292f' : '#17171b', color: '#c6c6cc', borderRadius: 4, padding: '6px 8px', cursor: 'pointer' }}>
              {mode === 'desktop' ? <Monitor size={14} /> : mode === 'tablet' ? <Tablet size={14} /> : <Smartphone size={14} />}
            </button>
          ))}
          <button onClick={() => setThemeMode(themeMode === 'dark' ? 'light' : 'dark')} style={{ border: '1px solid #2b2b31', background: '#17171b', color: '#aaaab2', borderRadius: 4, padding: '6px 9px', cursor: 'pointer', fontSize: 11 }}>{themeMode.toUpperCase()}</button>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {registryOffline && <span style={{ color: '#f59e0b', fontSize: 10 }}>OFFLINE REGISTRY CACHE</span>}
          <button onClick={() => setShowFacts(true)} style={{ border: '1px solid #303038', background: '#18181d', color: '#d4d4d8', padding: '7px 10px', borderRadius: 4, cursor: 'pointer', display: 'flex', gap: 6, alignItems: 'center', fontSize: 11 }}><Database size={13} /> Verified Facts</button>
          <button onClick={handleCompose} disabled={isComposing || isPlanning} style={{ border: 'none', background: '#2563eb', color: '#fff', padding: '8px 13px', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>{isComposing ? 'Composing…' : project.pages.length ? 'COMPOSE WEBSITE' : 'PLAN SITE'}</button>
          {onProceedToPreview && <button onClick={onProceedToPreview} style={{ border: '1px solid #303038', background: '#18181d', color: '#d4d4d8', padding: '7px 10px', borderRadius: 4, cursor: 'pointer', display: 'flex', gap: 5, alignItems: 'center', fontSize: 11 }}>Preview <ArrowRight size={12} /></button>}
        </div>
      </div>

      {message && <div style={{ padding: '7px 16px', fontSize: 11, color: '#b6c8ff', background: '#111a31', borderBottom: '1px solid #22355d' }}>{message}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '270px minmax(0, 1fr) 340px', flex: 1, minHeight: 0 }}>
        <aside style={{ borderRight: '1px solid #232328', background: '#101013', overflowY: 'auto' }}>
          <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #202025' }}>
            <strong style={{ fontSize: 11, color: '#9a9aa3' }}>PAGES</strong>
            <button onClick={() => setShowAddPage(true)} style={{ background: 'transparent', border: 0, color: '#60a5fa', cursor: 'pointer', fontSize: 11 }}><Plus size={12} /> Page</button>
          </div>
          <div style={{ padding: 8 }}>
            {!project.pages.length && <button onClick={handlePlan} disabled={isPlanning} style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 0, padding: 8, borderRadius: 4, cursor: 'pointer' }}>{isPlanning ? 'Planning…' : 'Plan Site Structure'}</button>}
            {project.pages.map((page) => (
              <div key={page.id} style={{ marginBottom: 7 }}>
                <div onClick={() => { setSelectedPageId(page.id); setSelectedSectionId(page.sections[0]?.id || null); }} style={{ padding: '8px 9px', background: currentPage?.id === page.id ? '#202938' : '#151519', border: `1px solid ${currentPage?.id === page.id ? '#355e9d' : '#25252a'}`, borderRadius: 4, cursor: 'pointer' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><span style={{ fontSize: 12, fontWeight: 600 }}>{page.name}</span><button onClick={(event) => { event.stopPropagation(); handleDeletePage(page.id); }} style={{ background: 'transparent', border: 0, color: '#7f7f88', cursor: 'pointer' }}><Trash2 size={11} /></button></div>
                  <div style={{ fontSize: 10, color: '#6f6f78', marginTop: 2 }}>{page.slug}</div>
                </div>
                {currentPage?.id === page.id && <div style={{ marginTop: 6, paddingLeft: 5 }}>
                  <button onClick={() => setShowAddSection(true)} style={{ width: '100%', background: 'transparent', border: '1px dashed #32323a', color: '#9a9aa3', padding: 6, borderRadius: 4, cursor: 'pointer', fontSize: 10 }}><Plus size={11} /> Add Section</button>
                  {[...page.sections].sort((a, b) => a.order - b.order).map((section, index) => (
                    <div key={section.id} onClick={() => setSelectedSectionId(section.id)} style={{ marginTop: 5, padding: '7px 7px', background: selectedSectionId === section.id ? '#19263a' : '#141417', border: `1px solid ${selectedSectionId === section.id ? '#315a96' : '#222228'}`, borderRadius: 4, cursor: 'pointer' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{index + 1}. {section.name}</span>
                        {sectionReady(section) ? <CheckCircle2 size={11} color={section.contentApproved ? '#22c55e' : '#60a5fa'} /> : <AlertTriangle size={11} color="#f59e0b" />}
                      </div>
                      <div onClick={(event) => event.stopPropagation()} style={{ display: 'flex', justifyContent: 'flex-end', gap: 3, marginTop: 4 }}>
                        <button onClick={() => handleMove(section.id, -1)} disabled={index === 0} style={{ background: 'transparent', border: 0, color: '#81818b', cursor: 'pointer' }}><ArrowUp size={10} /></button>
                        <button onClick={() => handleMove(section.id, 1)} disabled={index === page.sections.length - 1} style={{ background: 'transparent', border: 0, color: '#81818b', cursor: 'pointer' }}><ArrowDown size={10} /></button>
                        <button onClick={() => handleDuplicateSection(section.id)} style={{ background: 'transparent', border: 0, color: '#81818b', cursor: 'pointer' }}><Copy size={10} /></button>
                        <button onClick={() => handleRemoveSection(section.id)} style={{ background: 'transparent', border: 0, color: '#ef6464', cursor: 'pointer' }}><Trash2 size={10} /></button>
                      </div>
                    </div>
                  ))}
                </div>}
              </div>
            ))}
          </div>
        </aside>

        <main style={{ background: '#08080a', overflow: 'auto', padding: viewport === 'desktop' ? 0 : 20, display: 'flex', justifyContent: 'center' }} onClick={() => setSelectedSectionId(null)}>
          {currentPage ? <div onClick={(event) => event.stopPropagation()} style={{ width: viewport === 'mobile' ? 375 : viewport === 'tablet' ? 768 : '100%', maxWidth: '100%', minHeight: '100%', background: '#111' }}>
            <StudioSiteRenderer project={project} page={currentPage} contentMode="production" previewMode={viewport} themeMode={themeMode} isBuilderMode selectedSectionId={selectedSectionId || undefined} onSelectSection={setSelectedSectionId} />
          </div> : <div style={{ margin: 'auto', color: '#71717a' }}>Plan or create a page to begin.</div>}
        </main>

        <aside style={{ borderLeft: '1px solid #232328', background: '#101013', overflowY: 'auto', padding: 14 }}>
          {!currentSection ? <div style={{ padding: 28, textAlign: 'center', color: '#71717a', fontSize: 12 }}><Layers size={24} /><p>Select a section to edit.</p></div> : <>
            <div style={{ borderBottom: '1px solid #25252a', paddingBottom: 12, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#71717a', letterSpacing: '.07em' }}>SECTION INSPECTOR</div>
              <h3 style={{ margin: '5px 0 2px', fontSize: 14 }}>{currentSection.name}</h3>
              <div style={{ fontSize: 10, color: '#686871', fontFamily: 'monospace' }}>{currentSection.componentRegistryId}</div>
            </div>

            {!sectionReady(currentSection) && <div style={{ background: '#21190d', border: '1px solid #69430c', color: '#fbbf24', padding: 9, borderRadius: 4, fontSize: 11, marginBottom: 12 }}>
              <strong>Needs input</strong>
              {!!currentSection.missingFactualFields?.length && <div style={{ marginTop: 4 }}>Facts: {currentSection.missingFactualFields.join(', ')}</div>}
              {!!currentSection.missingAssetRequirements?.length && <div style={{ marginTop: 4 }}>Assets: {currentSection.missingAssetRequirements.join(', ')}</div>}
            </div>}

            <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
              <button onClick={handleRegenerate} disabled={isRegenerating} style={{ flex: 1, border: '1px solid #303038', background: '#19191e', color: '#d4d4d8', borderRadius: 4, padding: 7, cursor: 'pointer', fontSize: 10 }}><RefreshCw size={11} /> {isRegenerating ? 'Working…' : 'Regenerate Copy'}</button>
              <button onClick={handleApprove} disabled={!canApprove} style={{ border: '1px solid #304a37', background: currentSection.contentApproved ? '#16321f' : '#18251c', color: canApprove ? '#4ade80' : '#666', borderRadius: 4, padding: '7px 9px', cursor: canApprove ? 'pointer' : 'not-allowed', fontSize: 10 }}><Check size={11} /> {currentSection.contentApproved ? 'Approved' : 'Approve'}</button>
            </div>

            {currentDefinition && <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, color: '#85858e', marginBottom: 4 }}>COMPONENT</label>
              <select value={currentSection.componentRegistryId} onChange={(event) => handleReplace(event.target.value)} style={{ width: '100%', background: '#17171b', color: '#e4e4e7', border: '1px solid #2b2b31', borderRadius: 4, padding: 7, fontSize: 11 }}>
                {replacementOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <div style={{ marginTop: 3, color: '#666670', fontSize: 9 }}>Only approved, renderable, contract-backed components in the same category.</div>
            </div>}

            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 10, color: '#85858e', marginBottom: 4 }}>MOTION</label>
              <select value={normalizeStudioMotionPreset(currentSection.motionPreset)} onChange={(event) => handleMotion(event.target.value as StudioMotionPreset)} style={{ width: '100%', background: '#17171b', color: '#e4e4e7', border: '1px solid #2b2b31', borderRadius: 4, padding: 7, fontSize: 11 }}>
                {STUDIO_MOTION_PRESETS.map((preset) => <option key={preset} value={preset}>{preset}</option>)}
              </select>
            </div>

            {!!currentContract?.generatedCopyFields.length && <div style={{ borderTop: '1px solid #25252a', paddingTop: 12, marginTop: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#85858e', marginBottom: 7 }}>GENERATIVE COPY</div>
              {currentContract.generatedCopyFields.map((field) => {
                const value = currentSection.content[field];
                const complex = value !== undefined && value !== null && typeof value === 'object';
                return <div key={`${currentSection.id}-${field}`} style={{ marginBottom: 8 }}>
                  <label style={{ display: 'block', fontSize: 10, color: '#7d7d86', marginBottom: 3 }}>{field}</label>
                  {complex ? <textarea defaultValue={JSON.stringify(value, null, 2)} onBlur={(event) => { try { handleGeneratedField(field, JSON.parse(event.currentTarget.value)); } catch { setMessage(`Invalid JSON for ${field}.`); } }} style={{ width: '100%', minHeight: 76, boxSizing: 'border-box', background: '#151519', color: '#e4e4e7', border: '1px solid #292930', borderRadius: 4, padding: 7, fontFamily: 'monospace', fontSize: 10 }} /> : <textarea value={String(value ?? '')} onChange={(event) => handleGeneratedField(field, event.target.value)} style={{ width: '100%', minHeight: 54, boxSizing: 'border-box', background: '#151519', color: '#e4e4e7', border: '1px solid #292930', borderRadius: 4, padding: 7, fontSize: 11 }} />}
                </div>;
              })}
            </div>}

            {!!currentContract?.factualClaimFields.length && <div style={{ borderTop: '1px solid #25252a', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div><div style={{ fontSize: 10, fontWeight: 700, color: '#85858e' }}>VERIFIED FACT FIELDS</div><div style={{ marginTop: 4, fontSize: 9, color: '#666670' }}>{currentContract.factualClaimFields.join(', ')}</div></div>
                <button onClick={() => setShowFacts(true)} style={{ border: '1px solid #314159', background: '#162033', color: '#93c5fd', borderRadius: 4, padding: '5px 7px', cursor: 'pointer', fontSize: 9 }}>Edit Facts</button>
              </div>
            </div>}

            {!!currentContract?.assetSlots.length && <div style={{ borderTop: '1px solid #25252a', paddingTop: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}><span style={{ fontSize: 10, fontWeight: 700, color: '#85858e' }}>ASSET SLOTS</span>{onProceedToAssets && <button onClick={onProceedToAssets} style={{ border: 0, background: 'transparent', color: '#60a5fa', cursor: 'pointer', fontSize: 9 }}>Open Assets →</button>}</div>
              {currentContract.assetSlots.map((slot) => {
                const options = eligibleAssets.filter((asset) => asset.aspectRatio === slot.aspectRatio);
                return <div key={slot.slot} style={{ marginBottom: 8 }}>
                  <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7d7d86', marginBottom: 3 }}><span>{slot.slot}{slot.required ? ' *' : ''}</span><span>{slot.aspectRatio}</span></label>
                  <select value={currentSection.assetBindings?.[slot.slot] || ''} onChange={(event) => handleAssetBinding(slot.slot, event.target.value)} style={{ width: '100%', background: '#151519', color: '#e4e4e7', border: '1px solid #292930', borderRadius: 4, padding: 6, fontSize: 10 }}>
                    <option value="">{slot.required ? 'Select required asset…' : 'None'}</option>
                    {options.map((asset) => <option key={asset.id} value={asset.id}>{asset.status === 'approved' ? '✓ ' : ''}{asset.purpose || asset.id}</option>)}
                  </select>
                </div>;
              })}
              {!eligibleAssets.length && <div style={{ color: '#f59e0b', fontSize: 9 }}><ImageIcon size={10} /> No generated/approved assets are available yet.</div>}
            </div>}
          </>}
        </aside>
      </div>

      {showFacts && <ProjectFactsEditor project={project} onUpdateProject={(updated) => { onUpdateProject(updated); setMessage('Verified facts saved. Recompose affected sections to apply them.'); }} onClose={() => setShowFacts(false)} />}

      {showAddPage && <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 390, background: '#141418', border: '1px solid #2b2b31', borderRadius: 7, padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><h3 style={{ margin: 0, fontSize: 15 }}>Add Page</h3><button onClick={() => setShowAddPage(false)} style={{ background: 'transparent', border: 0, color: '#aaa', cursor: 'pointer' }}><X size={15} /></button></div>
          {pageError && <div style={{ marginTop: 10, padding: 7, background: '#311616', color: '#fca5a5', fontSize: 11 }}>{pageError}</div>}
          <input value={newPageName} onChange={(event) => { setNewPageName(event.target.value); setPageError(null); }} placeholder="Page name (Hebrew supported)" style={{ width: '100%', boxSizing: 'border-box', marginTop: 12, background: '#19191e', border: '1px solid #303038', color: '#fff', padding: 8, borderRadius: 4 }} />
          <input value={newPageSlug} onChange={(event) => setNewPageSlug(event.target.value)} placeholder="Optional ASCII slug, e.g. /services" style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, background: '#19191e', border: '1px solid #303038', color: '#fff', padding: 8, borderRadius: 4 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7, marginTop: 14 }}><button onClick={() => setShowAddPage(false)} style={{ background: '#202025', color: '#bbb', border: '1px solid #303038', padding: '7px 10px', borderRadius: 4 }}>Cancel</button><button onClick={handleAddPage} style={{ background: '#2563eb', color: '#fff', border: 0, padding: '7px 11px', borderRadius: 4 }}>Create</button></div>
        </div>
      </div>}

      {showAddSection && <div style={{ position: 'fixed', inset: 0, zIndex: 150, background: 'rgba(0,0,0,.72)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 560, maxHeight: '78vh', overflow: 'auto', background: '#141418', border: '1px solid #2b2b31', borderRadius: 7, padding: 18 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}><div><h3 style={{ margin: 0, fontSize: 15 }}>Add Approved Component</h3><div style={{ fontSize: 10, color: '#71717a', marginTop: 3 }}>Canonical, compatible and contract-backed only.</div></div><button onClick={() => setShowAddSection(false)} style={{ background: 'transparent', border: 0, color: '#aaa', cursor: 'pointer' }}><X size={15} /></button></div>
          {eligibleComponents.map((component) => <button key={component.id} onClick={() => handleAddSection(component.id)} style={{ display: 'block', width: '100%', textAlign: 'left', background: '#19191e', color: '#e4e4e7', border: '1px solid #292930', borderRadius: 4, padding: '9px 10px', marginBottom: 6, cursor: 'pointer' }}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}><strong style={{ fontSize: 11 }}>{component.name}</strong><span style={{ fontSize: 9, color: '#71717a' }}>{component.category}</span></div><div style={{ marginTop: 3, fontSize: 9, color: '#777780' }}>{component.description}</div></button>)}
        </div>
      </div>}
    </div>
  );
}
