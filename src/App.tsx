import React, { useEffect, useMemo, useState } from 'react';
import {
  Blocks,
  Box,
  ChevronRight,
  FolderKanban,
  Image as ImageIcon,
  MonitorSmartphone,
  PackageOpen,
  Plus,
  Settings,
  ShoppingBag,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  ShieldCheck,
  ArrowRight,
  Globe,
  Sliders,
} from 'lucide-react';
import { demoComponents } from '@shared/componentRegistry';
import { createEmptyProject, type Project, type ProjectType } from '@shared/project';
import { exporters } from '@shared/exporters';
import { projectRepository } from './data/projectRepository';
import { BriefEditor } from './components/BriefEditor';
import { DesignWorkspace } from './components/DesignWorkspace';
import { AssetPlannerView } from './components/AssetPlannerView';
import { ComponentLibraryView } from './components/ComponentLibraryView';
import { ComponentSandboxView } from './components/ComponentSandboxView';
import { NewProjectModal } from './components/NewProjectModal';

const navItems = [
  { label: 'Projects', icon: FolderKanban },
  { label: 'Component Sandbox', icon: MonitorSmartphone },
  { label: 'Component Library', icon: Blocks },
  { label: 'Asset Library', icon: ImageIcon },
  { label: 'Settings', icon: Settings },
];

const workspaceTabs = ['Brief', 'Strategy', 'Design', 'Assets', 'Build', 'Preview', 'Review', 'Handoff'];

export default function App() {
  const [activeNav, setActiveNav] = useState('Projects');
  const [activeTab, setActiveTab] = useState('Brief');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Initialize or load project
  const [project, setProject] = useState<Project>(() => {
    return createEmptyProject('demo-project', 'business_website', 'Atelier Kanso Architecture');
  });

  // Load latest project from repository on mount
  useEffect(() => {
    async function loadProjects() {
      try {
        const list = await projectRepository.list();
        if (list.length > 0) {
          setProject(list[0]);
        } else {
          // Save default project
          await projectRepository.save(project);
        }
      } catch {
        // Fallback gracefully
      }
    }
    loadProjects();
  }, []);

  const handleUpdateProject = (updated: Project) => {
    setProject(updated);
    projectRepository.save(updated).catch(console.error);
  };

  const handleCreateProject = (newProj: Project) => {
    setProject(newProj);
    setActiveTab('Brief');
    projectRepository.save(newProj).catch(console.error);
  };

  const setProjectType = (type: ProjectType) => {
    const updated: Project = {
      ...project,
      projectType: type,
      updatedAt: new Date().toISOString(),
    };
    handleUpdateProject(updated);
  };

  const availableExporters = exporters.filter((exporter) => exporter.canExport(project));

  // Determine pipeline steps completion
  const pipelineSteps = useMemo(() => {
    const hasBrief = Boolean(project.business.businessName && project.business.description);
    const hasReferences = Boolean(project.brand.referenceAnalyses && project.brand.referenceAnalyses.length > 0);
    const hasArtDirection = Boolean(project.designSystem.artDirection);
    const hasComponentPlan = Boolean(project.pages.length > 0 && project.pages.some((p) => p.sections.length > 0));
    const hasAssetPlan = Boolean(project.assets && project.assets.length > 0);
    const hasCritic = project.status === 'review' || hasComponentPlan;
    const hasHandoff = project.status === 'exported' || project.status === 'approved';

    return [
      { name: 'Strategic Brief', completed: hasBrief },
      { name: 'Reference Analysis', completed: hasReferences },
      { name: 'Art Direction', completed: hasArtDirection },
      { name: '3 Design Directions', completed: hasArtDirection },
      { name: 'Direction Approval', completed: hasArtDirection },
      { name: 'Component Selection', completed: hasComponentPlan },
      { name: 'Asset Manifest Plan', completed: hasAssetPlan },
      { name: 'Design Critic Inspection', completed: hasCritic },
      { name: 'Handoff Export', completed: hasHandoff },
    ];
  }, [project]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <div className="brand-mark">N</div>
          <div>
            <div className="brand-name">Natanel Studio</div>
            <div className="brand-subtitle">Website operating system</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-button ${activeNav === label ? 'active' : ''}`}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Private workspace • Node 22</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">DESIGN BRAIN V1</div>
            <h1>Build sites with taste, not templates.</h1>
          </div>
          <button className="primary-button" onClick={() => setIsNewProjectModalOpen(true)}>
            <Plus size={17} /> New project
          </button>
        </header>

        {/* View switching based on activeNav */}
        {activeNav === 'Component Sandbox' ? (
          <section className="workspace-card">
            <div className="canvas-main" style={{ padding: '32px' }}>
              <ComponentSandboxView />
            </div>
          </section>
        ) : activeNav === 'Component Library' ? (
          <section className="workspace-card">
            <div className="canvas-main" style={{ padding: '32px' }}>
              <ComponentLibraryView />
            </div>
          </section>
        ) : activeNav === 'Asset Library' ? (
          <section className="workspace-card">
            <div className="canvas-main" style={{ padding: '32px' }}>
              <AssetPlannerView project={project} onUpdateProject={handleUpdateProject} />
            </div>
          </section>
        ) : activeNav === 'Settings' ? (
          <section className="workspace-card">
            <div className="canvas-main" style={{ padding: '36px', maxWidth: '820px' }}>
              <div className="section-intro">
                <div>
                  <span className="eyebrow">ENVIRONMENT & ENGINE</span>
                  <h2>Studio Architecture Settings</h2>
                  <p className="section-description">
                    Server-side AI orchestration running on Gemini with native image synthesis and multi-platform handoff.
                  </p>
                </div>
              </div>

              <div className="form-card">
                <div className="card-header-line">
                  <Sparkles size={16} />
                  <h3>AI Engine Configuration</h3>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Default Image Synthesis Model</span>
                  <p><code className="code-pill">gemini-3.1-flash-image</code> (Nano Banana 2, Server-side proxy)</p>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Reasoning & Art Director Engine</span>
                  <p><code className="code-pill">gemini-2.5-flash</code> with heuristic fallback guarantee</p>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Persistence Mode</span>
                  <p>Local Repository (Browser-safe storage with Firestore abstraction layer)</p>
                </div>
                <div className="detail-item">
                  <span className="detail-label">RTL Support</span>
                  <p>First-class Hebrew & Arabic directional layout with typography and component mirroring</p>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Main Projects Workspace */
          <section className="workspace-card">
            <div className="workspace-header">
              <div>
                <div className="workspace-title-row">
                  <span className="project-dot" />
                  <strong>{project.name}</strong>
                  <span className="status-pill status-approved">{project.status}</span>
                  {project.business.direction === 'rtl' && (
                    <span className="status-pill" style={{ borderColor: '#d6a84f', color: '#d6a84f' }}>
                      RTL HEBREW
                    </span>
                  )}
                </div>
                <div className="muted">
                  Platform-neutral until handoff • {project.business.industry || 'Architecture & Design'}
                </div>
              </div>

              <div className="segmented-control">
                <button
                  className={project.projectType === 'business_website' ? 'selected' : ''}
                  onClick={() => setProjectType('business_website')}
                >
                  <MonitorSmartphone size={16} /> Business Website
                </button>
                <button
                  className={project.projectType === 'shopify' ? 'selected' : ''}
                  onClick={() => setProjectType('shopify')}
                >
                  <ShoppingBag size={16} /> Shopify Store
                </button>
              </div>
            </div>

            <div className="tabs">
              {workspaceTabs.map((tab) => (
                <button
                  key={tab}
                  className={activeTab === tab ? 'active' : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="canvas">
              <div className="canvas-main">
                {/* 1. BRIEF TAB */}
                {activeTab === 'Brief' && (
                  <BriefEditor
                    project={project}
                    onUpdate={handleUpdateProject}
                    onProceedToDesign={() => setActiveTab('Design')}
                  />
                )}

                {/* 2. STRATEGY TAB */}
                {activeTab === 'Strategy' && (
                  <div className="strategy-view">
                    <div className="section-intro">
                      <div>
                        <span className="eyebrow">STAGE 01.2 / STRATEGY</span>
                        <h2>Conversion Funnel & Positioning Framework</h2>
                        <p className="section-description">
                          Strategic alignment for {project.business.businessName || 'the studio'}. Defines the primary
                          conversion pathway and audience expectations.
                        </p>
                      </div>
                      <button className="primary-button" onClick={() => setActiveTab('Design')}>
                        Proceed to Design <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="form-grid">
                      <div className="form-card">
                        <div className="card-header-line">
                          <h3>Core Positioning</h3>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Business Objective</span>
                          <p>{project.business.description || 'Define in Brief tab'}</p>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Target Audience</span>
                          <p>{project.business.targetAudience || 'Discerning clientele and enterprise partners'}</p>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Primary Conversion Goal</span>
                          <p>{project.business.primaryGoal || 'High-trust qualified inquiry'}</p>
                        </div>
                      </div>

                      <div className="form-card">
                        <div className="card-header-line">
                          <h3>Content Cadence & Density</h3>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Density Setting</span>
                          <p style={{ textTransform: 'capitalize' }}>{project.brand.contentDensity} spacing</p>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">RTL First-Class Status</span>
                          <p>{project.business.direction === 'rtl' ? 'Active (Hebrew layout mirroring)' : 'LTR Standard'}</p>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Visual Foundation</span>
                          <p>{project.brand.colors.join(', ') || '#0d0d0f, #161619, #e8e6e1'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. DESIGN TAB */}
                {activeTab === 'Design' && (
                  <DesignWorkspace
                    project={project}
                    onUpdateProject={handleUpdateProject}
                    onNavigateToAssets={() => setActiveTab('Assets')}
                  />
                )}

                {/* 4. ASSETS TAB */}
                {activeTab === 'Assets' && (
                  <AssetPlannerView project={project} onUpdateProject={handleUpdateProject} />
                )}

                {/* 5. BUILD TAB */}
                {activeTab === 'Build' && (
                  <div className="build-view">
                    <div className="section-intro">
                      <div>
                        <span className="eyebrow">STAGE 04 / COMPOSITION</span>
                        <h2>Architectural Assembly & Page Blueprint</h2>
                        <p className="section-description">
                          Composition of approved registry components. Assembled sections maintain mathematical
                          rhythm, tokenized padding, and responsive typography scales.
                        </p>
                      </div>
                      <button className="primary-button" onClick={() => setActiveTab('Preview')}>
                        Live Preview <ArrowRight size={14} />
                      </button>
                    </div>

                    {project.pages.length === 0 ? (
                      <div className="empty-state-box">
                        <Layers size={32} strokeWidth={1.2} />
                        <h3>No pages assembled yet</h3>
                        <p>Complete the Art Direction and Component Selection in the Design tab to compose pages.</p>
                        <button className="primary-button" onClick={() => setActiveTab('Design')} style={{ marginTop: '14px' }}>
                          Go to Component Selection
                        </button>
                      </div>
                    ) : (
                      <div className="page-blueprint-card">
                        <div className="page-blueprint-header">
                          <div>
                            <h3>{project.pages[0].name} ({project.pages[0].sections.length} Sections)</h3>
                            <span className="page-slug">{project.pages[0].slug}</span>
                          </div>
                          <span className="status-pill status-approved">ASSEMBLY READY</span>
                        </div>
                        <div className="sections-pipeline">
                          {project.pages[0].sections.map((sec, idx) => (
                            <div key={sec.id} className="section-blueprint-row">
                              <div className="section-order-col">
                                <span className="order-number">{String(idx + 1).padStart(2, '0')}</span>
                              </div>
                              <div className="section-detail-card">
                                <strong>{sec.purpose}</strong>
                                <span className="reg-id-mono">{sec.componentRegistryId}</span>
                                <p className="selection-reason">{sec.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 6. PREVIEW TAB */}
                {activeTab === 'Preview' && (
                  <div className="preview-view" dir={project.business.direction}>
                    <div className="section-intro">
                      <div>
                        <span className="eyebrow">STAGE 05 / WIREFRAME & CADENCE PREVIEW</span>
                        <h2>
                          {project.business.direction === 'rtl' ? 'תצוגה מקדימה (RTL)' : 'Live Structural Preview'}
                        </h2>
                        <p className="section-description">
                          Reviewing section rhythm, optical balance, and orientation alignment.
                          {project.business.direction === 'rtl' && ' Layout is rendered right-to-left.'}
                        </p>
                      </div>
                      <button className="secondary-button" onClick={() => setActiveTab('Review')}>
                        Run Quality Review <ShieldCheck size={14} />
                      </button>
                    </div>

                    <div
                      style={{
                        border: '1px solid #29292e',
                        background: '#0e0e10',
                        padding: '28px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '24px',
                      }}
                    >
                      {/* Wireframe Mock Header */}
                      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #222225', paddingBottom: '16px' }}>
                        <div style={{ fontWeight: 700, fontSize: '18px', letterSpacing: '-0.02em' }}>
                          {project.business.businessName || project.name}
                        </div>
                        <nav style={{ display: 'flex', gap: '20px', fontSize: '13px', color: '#9d9da5' }}>
                          <span>Overview</span>
                          <span>Portfolio</span>
                          <span>Philosophy</span>
                          <span>Contact</span>
                        </nav>
                      </header>

                      {/* Sections Wireframe */}
                      {project.pages.length > 0 && project.pages[0].sections.length > 0 ? (
                        project.pages[0].sections.map((sec, idx) => (
                          <div
                            key={sec.id}
                            style={{
                              border: '1px dashed #2d2d33',
                              background: '#131316',
                              padding: '36px 28px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span className="eyebrow">SECTION {String(idx + 1).padStart(2, '0')} // {sec.componentRegistryId.toUpperCase()}</span>
                              <span className="category-pill">{sec.purpose}</span>
                            </div>
                            <h3 style={{ margin: '4px 0', fontSize: '22px', fontWeight: 550 }}>
                              {sec.purpose}
                            </h3>
                            <p style={{ margin: 0, fontSize: '13px', color: '#8f8f97', maxWidth: '640px' }}>
                              {sec.reason}
                            </p>
                          </div>
                        ))
                      ) : (
                        <div style={{ padding: '48px 0', textAlign: 'center', color: '#77777f' }}>
                          Execute Component Selection in the Design tab to generate section wireframes.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 7. REVIEW TAB */}
                {activeTab === 'Review' && (
                  <div className="review-view">
                    <div className="section-intro">
                      <div>
                        <span className="eyebrow">STAGE 06 / QA REVIEW</span>
                        <h2>Design Quality Scorecard</h2>
                        <p className="section-description">
                          Comprehensive automated anti-slop audit across hierarchy, typography ratios, spacing consistency,
                          and conversion readiness.
                        </p>
                      </div>
                      <button className="primary-button" onClick={() => setActiveTab('Design')}>
                        Open Critic in Design Workspace <ArrowRight size={14} />
                      </button>
                    </div>

                    <div className="foundation-grid">
                      <article className="metric-card">
                        <span className="metric-label">Approved Art Direction</span>
                        <strong>{project.designSystem.artDirection || 'Pending'}</strong>
                        <span>{project.designSystem.creativeConcept || 'Generate in Design tab'}</span>
                      </article>
                      <article className="metric-card">
                        <span className="metric-label">Planned Sections</span>
                        <strong>{project.pages.reduce((acc, p) => acc + p.sections.length, 0)}</strong>
                        <span>Approved registry components only</span>
                      </article>
                      <article className="metric-card">
                        <span className="metric-label">Asset Manifest</span>
                        <strong>{project.assets.length} planned</strong>
                        <span>gemini-3.1-flash-image 4K & 2K</span>
                      </article>
                    </div>
                  </div>
                )}

                {/* 8. HANDOFF TAB */}
                {activeTab === 'Handoff' && (
                  <div className="handoff-view">
                    <div className="section-intro">
                      <div>
                        <span className="eyebrow">STAGE 07 / EXPORT</span>
                        <h2>Choose how this site leaves the studio.</h2>
                        <p className="section-description">
                          Target-specific compiler preserves your platform-neutral design system and translates it into clean,
                          production-ready code without unnecessary runtime dependencies.
                        </p>
                      </div>
                    </div>

                    <div className="handoff-grid">
                      {availableExporters.map((exporter) => (
                        <article className="handoff-card" key={exporter.id}>
                          <div className="handoff-icon">
                            {exporter.id === 'shopify' ? (
                              <ShoppingBag />
                            ) : exporter.id === 'react' ? (
                              <Box />
                            ) : (
                              <PackageOpen />
                            )}
                          </div>
                          <div>
                            <h3>{exporter.name}</h3>
                            <p>
                              {exporter.id === 'wordpress' &&
                                'Installable WordPress theme with custom Gutenberg blocks for client-owned hosting.'}
                              {exporter.id === 'react' &&
                                'Source TypeScript + React + Tailwind project ready for GitHub, Vercel, or custom hosting.'}
                              {exporter.id === 'managed' &&
                                'Agency-managed high-performance deployment and maintenance workflow.'}
                              {exporter.id === 'shopify' &&
                                'Online Store 2.0 validated Shopify theme ZIP with Liquid templates and section schemas.'}
                            </p>
                          </div>
                          <ChevronRight size={19} />
                        </article>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* RIGHT INSPECTOR */}
              <aside className="inspector">
                <div className="inspector-title">Architecture Pipeline</div>
                <ol className="pipeline">
                  {pipelineSteps.map((step, index) => (
                    <li key={step.name} className={step.completed ? 'completed' : ''}>
                      <span>{step.completed ? '✓' : String(index + 1).padStart(2, '0')}</span>
                      <span>{step.name}</span>
                    </li>
                  ))}
                </ol>

                <div style={{ marginTop: '28px', borderTop: '1px solid #1f1f23', paddingTop: '18px' }}>
                  <div className="inspector-title">Design System Tokens</div>
                  <div style={{ display: 'grid', gap: '8px', fontSize: '11.5px', color: '#888890' }}>
                    <div>
                      <span style={{ color: '#5b5b63', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Direction</span>
                      <strong style={{ color: '#e0e0dc' }}>{project.designSystem.artDirection || 'Not yet locked'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#5b5b63', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Density</span>
                      <strong style={{ color: '#e0e0dc' }}>{project.brand.contentDensity}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#5b5b63', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Orientation</span>
                      <strong style={{ color: '#e0e0dc' }}>{project.business.direction.toUpperCase()}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#5b5b63', display: 'block', fontSize: '10px', textTransform: 'uppercase' }}>Components</span>
                      <strong style={{ color: '#e0e0dc' }}>
                        {demoComponents.filter((c) => c.status === 'approved').length} approved in registry
                      </strong>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </section>
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onCreate={handleCreateProject}
      />
    </div>
  );
}
