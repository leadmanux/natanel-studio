import { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { demoComponents } from '@shared/componentRegistry';
import { createEmptyProject, type ProjectType } from '@shared/project';
import { exporters } from '@shared/exporters';

const navItems = [
  { label: 'Projects', icon: FolderKanban },
  { label: 'Component Library', icon: Blocks },
  { label: 'Asset Library', icon: ImageIcon },
  { label: 'Settings', icon: Settings },
];

const workspaceTabs = ['Brief', 'Strategy', 'Design', 'Assets', 'Build', 'Preview', 'Review', 'Handoff'];

export default function App() {
  const [activeNav, setActiveNav] = useState('Projects');
  const [activeTab, setActiveTab] = useState('Brief');
  const [projectType, setProjectType] = useState<ProjectType>('business_website');

  const project = useMemo(
    () => createEmptyProject('demo-project', projectType, 'Demo Project'),
    [projectType],
  );
  const availableExporters = exporters.filter((exporter) => exporter.canExport(project));

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
          Private workspace
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div>
            <div className="eyebrow">V1 FOUNDATION</div>
            <h1>Build sites with taste, not templates.</h1>
          </div>
          <button className="primary-button">
            <Plus size={17} /> New project
          </button>
        </header>

        <section className="workspace-card">
          <div className="workspace-header">
            <div>
              <div className="workspace-title-row">
                <span className="project-dot" />
                <strong>{project.name}</strong>
                <span className="status-pill">{project.status}</span>
              </div>
              <div className="muted">Platform-neutral until handoff</div>
            </div>
            <div className="segmented-control">
              <button
                className={projectType === 'business_website' ? 'selected' : ''}
                onClick={() => setProjectType('business_website')}
              >
                <MonitorSmartphone size={16} /> Business Website
              </button>
              <button
                className={projectType === 'shopify' ? 'selected' : ''}
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
              <div className="section-heading">
                <div>
                  <div className="eyebrow">{activeTab.toUpperCase()}</div>
                  <h2>{activeTab === 'Handoff' ? 'Choose how this site leaves the studio.' : 'Foundation workspace'}</h2>
                </div>
                <Sparkles size={20} strokeWidth={1.4} />
              </div>

              {activeTab === 'Handoff' ? (
                <div className="handoff-grid">
                  {availableExporters.map((exporter) => (
                    <article className="handoff-card" key={exporter.id}>
                      <div className="handoff-icon">
                        {exporter.id === 'shopify' ? <ShoppingBag /> : exporter.id === 'react' ? <Box /> : <PackageOpen />}
                      </div>
                      <div>
                        <h3>{exporter.name}</h3>
                        <p>
                          {exporter.id === 'wordpress' && 'Installable WordPress theme for client-owned hosting and editing.'}
                          {exporter.id === 'react' && 'Source project ready for GitHub, developers or external hosting.'}
                          {exporter.id === 'managed' && 'Agency-managed deployment and maintenance workflow.'}
                          {exporter.id === 'shopify' && 'Validated Online Store 2.0 theme ZIP for the client Shopify account.'}
                        </p>
                      </div>
                      <ChevronRight size={19} />
                    </article>
                  ))}
                </div>
              ) : (
                <div className="foundation-grid">
                  <article className="metric-card">
                    <span className="metric-label">Approved demo components</span>
                    <strong>{demoComponents.length}</strong>
                    <span>Registry architecture ready for expansion</span>
                  </article>
                  <article className="metric-card">
                    <span className="metric-label">Visual engine</span>
                    <strong>Nano Banana 2</strong>
                    <span>gemini-3.1-flash-image, server-side only</span>
                  </article>
                  <article className="metric-card">
                    <span className="metric-label">Direction</span>
                    <strong>{project.business.direction.toUpperCase()}</strong>
                    <span>RTL is a first-class project property</span>
                  </article>
                </div>
              )}
            </div>

            <aside className="inspector">
              <div className="inspector-title">Architecture</div>
              <ol className="pipeline">
                {['Brief', 'Art Direction', 'Component Selection', 'Asset Plan', 'Compose', 'Critic', 'Export'].map((step, index) => (
                  <li key={step}>
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
