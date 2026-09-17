import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Blocks,
  FolderKanban,
  Image as ImageIcon,
  MonitorSmartphone,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { createEmptyProject, type Project, type ProjectType } from '@shared/project';
import { projectRepository } from './data/projectRepository';
import { BriefEditor } from './components/BriefEditor';
import { DesignWorkspace } from './components/DesignWorkspace';
import { AssetPlannerView } from './components/AssetPlannerView';
import { ComponentLibraryView } from './components/ComponentLibraryView';
import { ComponentSandboxView } from './components/ComponentSandboxView';
import { NewProjectModal } from './components/NewProjectModal';
import { BuildWorkspace } from './components/BuildWorkspace';
import { SitePreviewView } from './components/SitePreviewView';
import { StandalonePreviewView } from './components/StandalonePreviewView';
import { HandoffView } from './components/HandoffView';

const navItems = [
  { label: 'Projects', icon: FolderKanban },
  { label: 'Component Sandbox', icon: MonitorSmartphone },
  { label: 'Component Library', icon: Blocks },
  { label: 'Asset Library', icon: ImageIcon },
  { label: 'Settings', icon: Settings },
];

const workspaceTabs = ['Brief', 'Strategy', 'Design', 'Assets', 'Build', 'Preview', 'Review', 'Handoff'];

export default function App() {
  const isStandalonePreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/studio-preview');
  if (isStandalonePreview) return <StandalonePreviewView />;

  const [activeNav, setActiveNav] = useState('Projects');
  const [activeTab, setActiveTab] = useState('Brief');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [project, setProject] = useState<Project>(() => createEmptyProject('demo-project', 'business_website', 'Atelier Kanso Architecture'));

  useEffect(() => {
    let cancelled = false;
    async function loadProjects() {
      try {
        const list = await projectRepository.list();
        if (cancelled) return;
        if (list.length > 0) setProject(list[0]);
        else await projectRepository.save(project);
      } catch {
        // Local project remains usable if persistence is unavailable.
      }
    }
    loadProjects();
    return () => { cancelled = true; };
  }, []);

  const handleUpdateProject = (updated: Project) => {
    setProject(updated);
    projectRepository.save(updated).catch(console.error);
  };

  const handleCreateProject = (newProject: Project) => {
    setProject(newProject);
    setActiveNav('Projects');
    setActiveTab('Brief');
    projectRepository.save(newProject).catch(console.error);
  };

  const setProjectType = (type: ProjectType) => {
    handleUpdateProject({ ...project, projectType: type, updatedAt: new Date().toISOString() });
  };

  const pipelineSteps = useMemo(() => {
    const sections = project.pages.flatMap((page) => page.sections);
    const hasBrief = Boolean(project.business.businessName && project.business.description);
    const hasReferences = Boolean(project.brand.referenceAnalyses?.length);
    const hasArtDirection = Boolean(project.designSystem.artDirection);
    const hasComponentPlan = sections.length > 0;
    const hasAssetPlan = project.assets.length > 0;
    const contentReady = hasComponentPlan && sections.every((section) => section.contentStatus === 'ready' && !section.missingFactualFields?.length && !section.missingAssetRequirements?.length);
    const hasHandoff = project.status === 'exported';
    return [
      { name: 'Strategic Brief', completed: hasBrief },
      { name: 'Reference Analysis', completed: hasReferences },
      { name: 'Art Direction', completed: hasArtDirection },
      { name: 'Component Selection', completed: hasComponentPlan },
      { name: 'Asset Manifest Plan', completed: hasAssetPlan },
      { name: 'Production Content', completed: contentReady },
      { name: 'Design Review', completed: project.status === 'review' || project.status === 'approved' || project.status === 'exported' },
      { name: 'Handoff Export', completed: hasHandoff },
    ];
  }, [project]);

  const renderSettings = () => (
    <section className="workspace-card">
      <div className="canvas-main" style={{ padding: 36, maxWidth: 820 }}>
        <div className="section-intro">
          <div>
            <span className="eyebrow">ENVIRONMENT & ENGINE</span>
            <h2>Studio Architecture Settings</h2>
            <p className="section-description">Server-side Gemini orchestration, governed component rendering and validated multi-platform exports.</p>
          </div>
        </div>
        <div className="form-card">
          <div className="card-header-line"><Sparkles size={16} /><h3>Engine Configuration</h3></div>
          <div className="detail-item"><span className="detail-label">Image model</span><p><code className="code-pill">gemini-3.1-flash-image</code> via server-side proxy</p></div>
          <div className="detail-item"><span className="detail-label">Persistence</span><p>Local repository with optional Firebase abstraction</p></div>
          <div className="detail-item"><span className="detail-label">Direction</span><p>LTR and first-class RTL rendering</p></div>
          <div className="detail-item"><span className="detail-label">Delivery</span><p>React source ZIP, WordPress theme ZIP, Shopify Online Store 2.0 ZIP</p></div>
        </div>
      </div>
    </section>
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">N</div>
          <div><div className="brand-name">Natanel Studio</div><div className="brand-subtitle">Website operating system</div></div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-button ${activeNav === label ? 'active' : ''}`} onClick={() => setActiveNav(label)}>
              <Icon size={18} strokeWidth={1.6} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-footer"><div className="status-dot" /><span>Private workspace • Node 22</span></div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div><div className="eyebrow">NATANEL STUDIO</div><h1>Build sites with taste, not templates.</h1></div>
          <button className="primary-button" onClick={() => setIsNewProjectModalOpen(true)}><Plus size={17} /> New project</button>
        </header>

        {activeNav === 'Component Sandbox' ? (
          <section className="workspace-card"><div className="canvas-main" style={{ padding: 32 }}><ComponentSandboxView /></div></section>
        ) : activeNav === 'Component Library' ? (
          <section className="workspace-card"><div className="canvas-main" style={{ padding: 32 }}><ComponentLibraryView /></div></section>
        ) : activeNav === 'Asset Library' ? (
          <section className="workspace-card"><div className="canvas-main" style={{ padding: 32 }}><AssetPlannerView project={project} onUpdateProject={handleUpdateProject} /></div></section>
        ) : activeNav === 'Settings' ? renderSettings() : (
          <section className="workspace-card">
            <div className="workspace-header">
              <div>
                <div className="workspace-title-row">
                  <span className="project-dot" /><strong>{project.name}</strong><span className="status-pill status-approved">{project.status}</span>
                  {project.business.direction === 'rtl' && <span className="status-pill" style={{ borderColor: '#d6a84f', color: '#d6a84f' }}>RTL</span>}
                </div>
                <div className="muted">Platform-neutral until handoff • {project.business.industry || 'Business website'}</div>
              </div>
              <div className="segmented-control">
                <button className={project.projectType === 'business_website' ? 'selected' : ''} onClick={() => setProjectType('business_website')}><MonitorSmartphone size={16} /> Business Website</button>
                <button className={project.projectType === 'shopify' ? 'selected' : ''} onClick={() => setProjectType('shopify')}><ShoppingBag size={16} /> Shopify Store</button>
              </div>
            </div>

            <div className="tabs">
              {workspaceTabs.map((tab) => <button key={tab} className={activeTab === tab ? 'active' : ''} onClick={() => setActiveTab(tab)}>{tab}</button>)}
            </div>

            <div className="canvas">
              <div className="canvas-main">
                {activeTab === 'Brief' && <BriefEditor project={project} onUpdate={handleUpdateProject} onProceedToDesign={() => setActiveTab('Design')} />}

                {activeTab === 'Strategy' && (
                  <div className="strategy-view">
                    <div className="section-intro"><div><span className="eyebrow">STRATEGY</span><h2>Conversion Funnel & Positioning</h2><p className="section-description">Keep positioning, audience, goals and required pages aligned before visual composition.</p></div><button className="primary-button" onClick={() => setActiveTab('Design')}>Proceed to Design <ArrowRight size={14} /></button></div>
                    <div className="form-grid">
                      <div className="form-card"><div className="card-header-line"><h3>Positioning</h3></div><div className="detail-item"><span className="detail-label">Business</span><p>{project.business.description || 'Define in Brief'}</p></div><div className="detail-item"><span className="detail-label">Audience</span><p>{project.business.targetAudience || 'Define in Brief'}</p></div><div className="detail-item"><span className="detail-label">Primary Goal</span><p>{project.business.primaryGoal || 'Define in Brief'}</p></div></div>
                      <div className="form-card"><div className="card-header-line"><h3>Delivery Context</h3></div><div className="detail-item"><span className="detail-label">Direction</span><p>{project.business.direction.toUpperCase()}</p></div><div className="detail-item"><span className="detail-label">Language</span><p>{project.business.language}</p></div><div className="detail-item"><span className="detail-label">Pages</span><p>{project.strategy.requiredPages.join(', ') || 'Home'}</p></div></div>
                    </div>
                  </div>
                )}

                {activeTab === 'Design' && <DesignWorkspace project={project} onUpdateProject={handleUpdateProject} onNavigateToAssets={() => setActiveTab('Assets')} />}
                {activeTab === 'Assets' && <AssetPlannerView project={project} onUpdateProject={handleUpdateProject} />}
                {activeTab === 'Build' && <BuildWorkspace project={project} onUpdateProject={handleUpdateProject} onProceedToPreview={() => setActiveTab('Preview')} onProceedToDesign={() => setActiveTab('Design')} onProceedToAssets={() => setActiveTab('Assets')} />}
                {activeTab === 'Preview' && <SitePreviewView project={project} onProceedToReview={() => setActiveTab('Review')} onProceedToBuild={() => setActiveTab('Build')} />}

                {activeTab === 'Review' && (
                  <div className="review-view">
                    <div className="section-intro"><div><span className="eyebrow">QA REVIEW</span><h2>Production readiness</h2><p className="section-description">Review the assembled pages visually, then return to Build for any content, asset or component corrections before handoff.</p></div><button className="primary-button" onClick={() => setActiveTab('Preview')}>Open Preview <ArrowRight size={14} /></button></div>
                    <div className="foundation-grid">
                      <article className="metric-card"><span className="metric-label">Art Direction</span><strong>{project.designSystem.artDirection || 'Pending'}</strong><span>{project.designSystem.creativeConcept || 'Design tab'}</span></article>
                      <article className="metric-card"><span className="metric-label">Sections</span><strong>{project.pages.reduce((sum, page) => sum + page.sections.length, 0)}</strong><span>Canonical components</span></article>
                      <article className="metric-card"><span className="metric-label">Assets</span><strong>{project.assets.filter((asset) => asset.status === 'approved' || asset.status === 'generated').length}</strong><span>Generated or approved</span></article>
                    </div>
                  </div>
                )}

                {activeTab === 'Handoff' && <HandoffView project={project} onUpdateProject={handleUpdateProject} />}
              </div>

              <aside className="inspector">
                <div className="inspector-title">Architecture Pipeline</div>
                <ol className="pipeline">
                  {pipelineSteps.map((step, index) => <li key={step.name} className={step.completed ? 'completed' : ''}><span>{step.completed ? '✓' : String(index + 1).padStart(2, '0')}</span><span>{step.name}</span></li>)}
                </ol>
                <div style={{ marginTop: 28, borderTop: '1px solid #1f1f23', paddingTop: 18 }}>
                  <div className="inspector-title">Project Snapshot</div>
                  <div style={{ display: 'grid', gap: 8, fontSize: 11.5, color: '#888890' }}>
                    <div><span style={{ color: '#5b5b63', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Art Direction</span><strong style={{ color: '#e0e0dc' }}>{project.designSystem.artDirection || 'Not locked'}</strong></div>
                    <div><span style={{ color: '#5b5b63', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Orientation</span><strong style={{ color: '#e0e0dc' }}>{project.business.direction.toUpperCase()}</strong></div>
                    <div><span style={{ color: '#5b5b63', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Pages</span><strong style={{ color: '#e0e0dc' }}>{project.pages.length}</strong></div>
                    <div><span style={{ color: '#5b5b63', display: 'block', fontSize: 10, textTransform: 'uppercase' }}>Last Export</span><strong style={{ color: '#e0e0dc' }}>{String(project.exportConfig.settings.lastArtifactName || 'None')}</strong></div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      <NewProjectModal isOpen={isNewProjectModalOpen} onClose={() => setIsNewProjectModalOpen(false)} onCreate={handleCreateProject} />
    </div>
  );
}
