import React, { useEffect, useMemo, useState } from 'react';
import {
  Blocks,
  ChevronRight,
  FolderKanban,
  Image as ImageIcon,
  MonitorSmartphone,
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
import type { Project, ProjectType } from '@shared/project';
import {
  applyProjectTypeDefaults,
  createProjectWithDefaults,
  PROJECT_TYPE_DEFAULTS,
} from '@shared/projectDefaults';
import { createShopifyReferenceProject } from '@shared/referenceShopifyProject';
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
import { ExportWorkspace } from './components/ExportWorkspace';

const primaryNavItems = [
  { label: 'Projects', icon: FolderKanban },
  { label: 'Settings', icon: Settings },
];

const advancedNavItems = [
  { label: 'Component Library', icon: Blocks },
  { label: 'Component Sandbox', icon: MonitorSmartphone },
  { label: 'Asset Library', icon: ImageIcon },
];

const guidedSteps = [
  { tab: 'Brief', label: 'Setup', help: 'Business, goal & language' },
  { tab: 'Design', label: 'Design', help: 'Choose the visual direction' },
  { tab: 'Assets', label: 'Images', help: 'Generate or upload visuals' },
  { tab: 'Build', label: 'Build', help: 'Pages, sections & content' },
  { tab: 'Preview', label: 'Preview & QA', help: 'Check desktop and mobile' },
  { tab: 'Handoff', label: 'Export', help: 'Download the finished site' },
] as const;

const activeStepForTab: Record<string, number> = {
  Brief: 0,
  Strategy: 0,
  Design: 1,
  Assets: 2,
  Build: 3,
  Preview: 4,
  Review: 4,
  Handoff: 5,
};

const stepInstructions = [
  'Enter the business basics and choose English or Hebrew. Then continue.',
  'Generate design directions, choose the one you like, and approve it.',
  'Generate or upload the images the site needs. Approve the visuals you want to use.',
  'Generate the pages and sections. Review the content, replace sections if needed, then approve.',
  'Check desktop and mobile. Fix anything that looks wrong and review the QA summary.',
  'Run validation, then download the WordPress, React, or Shopify package for this project.',
] as const;

export default function App() {
  // Check if current route is standalone preview
  const isStandalonePreview = typeof window !== 'undefined' && window.location.pathname.startsWith('/studio-preview');
  if (isStandalonePreview) {
    return <StandalonePreviewView />;
  }

  const [activeNav, setActiveNav] = useState('Projects');
  const [activeTab, setActiveTab] = useState('Brief');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  // Initialize or load project
  const [project, setProject] = useState<Project>(() =>
    createProjectWithDefaults('demo-project', 'business_website', 'New Business Website', 'English')
  );

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
    if (type === project.projectType) return;
    const updated = applyProjectTypeDefaults(project, type);
    handleUpdateProject(updated);
    setActiveTab('Brief');
  };

  const handleLoadShopifyReferenceStore = () => {
    const referenceProject = createShopifyReferenceProject('rtl');
    handleUpdateProject(referenceProject);
    setActiveNav('Projects');
    setActiveTab('Preview');
  };

  const progressSteps = useMemo(() => {
    const hasBrief = Boolean(project.business.businessName && project.business.description);
    const hasDesign = Boolean(project.designSystem.artDirection);
    const hasAssets = Boolean(project.assets.length);
    const hasBuild = Boolean(project.pages.some((page) => page.sections.length > 0));
    const hasPreview = hasBuild;
    const hasExport = project.exportConfig.status === 'complete' || project.status === 'exported';

    return [
      { name: 'Setup', completed: hasBrief },
      { name: 'Design', completed: hasDesign },
      { name: 'Images', completed: hasAssets },
      { name: 'Build', completed: hasBuild },
      { name: 'Preview & QA', completed: hasPreview },
      { name: 'Export', completed: hasExport },
    ];
  }, [project]);

  const currentStepIndex = activeStepForTab[activeTab] ?? 0;
  const currentStep = guidedSteps[currentStepIndex];
  const projectDefaults = PROJECT_TYPE_DEFAULTS[project.projectType];

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
          {primaryNavItems.map(({ label, icon: Icon }) => (
            <button
              key={label}
              className={`nav-button ${activeNav === label ? 'active' : ''}`}
              onClick={() => setActiveNav(label)}
            >
              <Icon size={18} strokeWidth={1.6} />
              <span>{label}</span>
            </button>
          ))}

          <details className="sidebar-advanced">
            <summary>Advanced tools</summary>
            <div className="sidebar-advanced-items">
              {advancedNavItems.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  className={`nav-button ${activeNav === label ? 'active' : ''}`}
                  onClick={() => setActiveNav(label)}
                >
                  <Icon size={17} strokeWidth={1.6} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </details>
        </nav>

        <div className="sidebar-footer">
          <div className="status-dot" />
          <span>Private workspace • Node 22</span>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">NATANEL STUDIO</div>
            <h1>Build a complete website in six clear steps.</h1>
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
            <div className="canvas-main" style={{ padding: '36px', maxWidth: '860px' }}>
              <div className="section-intro">
                <div>
                  <span className="eyebrow">SETTINGS</span>
                  <h2>Studio Settings</h2>
                  <p className="section-description">
                    Most users never need to touch these. The six-step project workflow already applies the correct defaults.
                  </p>
                </div>
              </div>

              <div className="form-card">
                <div className="card-header-line">
                  <Sparkles size={16} />
                  <div>
                    <h3>AI & Runtime</h3>
                    <span className="card-help">Technical configuration for the Studio engine.</span>
                  </div>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Image Model</span>
                  <p><code className="code-pill">gemini-3.1-flash-image</code></p>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Design / Reasoning Model</span>
                  <p><code className="code-pill">gemini-2.5-flash</code></p>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Storage</span>
                  <p>Local browser repository with optional Firebase persistence.</p>
                </div>
              </div>

              <div className="form-card" style={{ marginTop: 18 }}>
                <div className="card-header-line">
                  <ShieldCheck size={16} />
                  <div>
                    <h3>QA Reference Store</h3>
                    <span className="card-help">Internal test project for validating the Shopify workflow.</span>
                  </div>
                </div>
                <button className="secondary-button" onClick={handleLoadShopifyReferenceStore}>
                  <ShoppingBag size={15} /> Load RTL Shopify Reference Store
                </button>
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
                  {projectDefaults.label} · {project.business.industry || 'Industry not set'} · {project.business.language || 'English'}
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

            <div className="guided-workflow">
              {guidedSteps.map((step, index) => {
                const isActive = currentStepIndex === index;
                const isComplete = progressSteps[index]?.completed;
                return (
                  <button
                    key={step.tab}
                    type="button"
                    className={`guided-step-button ${isActive ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                    onClick={() => setActiveTab(step.tab)}
                  >
                    <span className="guided-step-number">{isComplete ? '✓' : index + 1}</span>
                    <span className="guided-step-copy">
                      <strong>{step.label}</strong>
                      <small>{step.help}</small>
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="workflow-context-bar">
              <span><strong>Current:</strong> Step {currentStepIndex + 1} of 6 · {currentStep.label}</span>
              <div>
                <button type="button" onClick={() => setActiveTab('Strategy')}>View strategy</button>
                <button type="button" onClick={() => setActiveTab('Review')}>View QA summary</button>
              </div>
            </div>

            <div className="canvas">
              <div className="canvas-main">
                {activeTab !== 'Brief' && (
                  <div className="step-guide-banner">
                    <span>STEP {currentStepIndex + 1} OF 6</span>
                    <div>
                      <strong>{currentStep.label}</strong>
                      <p>{stepInstructions[currentStepIndex]}</p>
                    </div>
                  </div>
                )}

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
                  <BuildWorkspace
                    project={project}
                    onUpdateProject={handleUpdateProject}
                    onProceedToPreview={() => setActiveTab('Preview')}
                    onProceedToDesign={() => setActiveTab('Design')}
                  />
                )}

                {/* 6. PREVIEW TAB */}
                {activeTab === 'Preview' && (
                  <SitePreviewView
                    project={project}
                    onProceedToReview={() => setActiveTab('Review')}
                    onProceedToBuild={() => setActiveTab('Build')}
                  />
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
                  <ExportWorkspace
                    project={project}
                    onUpdateProject={handleUpdateProject}
                    onNavigateToBuilder={(_pageId, _sectionId) => setActiveTab('Build')}
                  />
                )}
              </div>

              {/* RIGHT INSPECTOR */}
              <aside className="inspector guided-inspector">
                <div className="inspector-title">Your Progress</div>
                <ol className="pipeline">
                  {progressSteps.map((step, index) => (
                    <li
                      key={step.name}
                      className={`${step.completed ? 'completed' : ''} ${currentStepIndex === index ? 'current' : ''}`}
                    >
                      <span>{step.completed ? '✓' : String(index + 1).padStart(2, '0')}</span>
                      <span>{step.name}</span>
                    </li>
                  ))}
                </ol>

                <div className="what-next-card">
                  <div className="what-next-label">WHAT TO DO NOW</div>
                  <strong>{currentStep.label}</strong>
                  <p>{currentStep.help}.</p>
                </div>

                <div className="project-defaults-card">
                  <div className="inspector-title">Automatic Defaults</div>
                  <div><span>Project</span><strong>{projectDefaults.label}</strong></div>
                  <div><span>Mode</span><strong>{projectDefaults.ecommerceMode === 'ecommerce' ? 'Ecommerce' : 'Lead generation'}</strong></div>
                  <div><span>Language</span><strong>{project.business.language || 'English'}</strong></div>
                  <div><span>Direction</span><strong>{project.business.direction.toUpperCase()}</strong></div>
                  <div><span>Export</span><strong>{projectDefaults.exportTarget === 'shopify' ? 'Shopify Theme' : 'WordPress'}</strong></div>
                </div>

                <details className="inspector-technical">
                  <summary>Technical details</summary>
                  <div>
                    <span>{demoComponents.filter((component) => component.status === 'approved').length} approved components</span>
                    <span>{project.designSystem.artDirection || 'Art direction not selected yet'}</span>
                  </div>
                </details>
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
