import React, { useState, useMemo } from 'react';
import {
  type ComponentDefinition,
  type ComponentCategory,
  demoComponents,
} from '@shared/componentRegistry';
import {
  componentImportAdapters,
  type ExternalComponentPayload,
} from '@shared/importAdapters';
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Smartphone,
  ArrowRightLeft,
  Activity,
  Plus,
  ChevronDown,
  MonitorSmartphone,
} from 'lucide-react';
import { ComponentSandboxView } from './ComponentSandboxView';

interface ComponentLibraryViewProps {
  onSelectComponent?: (comp: ComponentDefinition) => void;
}

export function ComponentLibraryView({ onSelectComponent }: ComponentLibraryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'registry'>('sandbox');
  const [components, setComponents] = useState<ComponentDefinition[]>(demoComponents);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [selectedStyle, setSelectedStyle] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedMotion, setSelectedMotion] = useState<string>('all');
  const [selectedMobileMin, setSelectedMobileMin] = useState<number>(0);
  const [rtlOnly, setRtlOnly] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Import payload simulation state
  const [importAdapterId, setImportAdapterId] = useState('adapter-magic-ui');
  const [importUrl, setImportUrl] = useState('https://magicui.design/docs/components/marquee');
  const [importAuthor, setImportAuthor] = useState('Magic UI Community');
  const [importName, setImportName] = useState('Editorial Logo Marquee');
  const [importCat, setImportCat] = useState('logos');
  const [importDesc, setImportDesc] = useState('Smooth horizontal kinetic logo reel with infinite scroll and pause on hover.');
  const [importSuccessMsg, setImportSuccessMsg] = useState<string | null>(null);

  // Extract unique styles and industries
  const allStyles = useMemo(() => {
    const set = new Set<string>();
    components.forEach((c) => c.styleTags.forEach((s) => set.add(s)));
    return Array.from(set).sort();
  }, [components]);

  const allIndustries = useMemo(() => {
    const set = new Set<string>();
    components.forEach((c) => c.industryFit.forEach((i) => set.add(i)));
    return Array.from(set).sort();
  }, [components]);

  // Filtered components
  const filteredComponents = useMemo(() => {
    return components.filter((c) => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const match =
          c.name.toLowerCase().includes(query) ||
          c.description.toLowerCase().includes(query) ||
          c.tags.some((t) => t.toLowerCase().includes(query)) ||
          c.id.toLowerCase().includes(query);
        if (!match) return false;
      }
      if (selectedCategory !== 'all' && c.category !== selectedCategory) return false;
      if (selectedStatus !== 'all' && c.status !== selectedStatus) return false;
      if (selectedSource !== 'all' && c.source !== selectedSource) return false;
      if (selectedStyle !== 'all' && !c.styleTags.includes(selectedStyle)) return false;
      if (selectedIndustry !== 'all' && !c.industryFit.includes(selectedIndustry)) return false;
      if (selectedMotion !== 'all' && c.motionLevel !== selectedMotion) return false;
      if (selectedMobileMin > 0 && c.mobileQuality < selectedMobileMin) return false;
      if (rtlOnly && !c.rtlReady) return false;

      return true;
    });
  }, [
    components,
    searchQuery,
    selectedCategory,
    selectedStatus,
    selectedSource,
    selectedStyle,
    selectedIndustry,
    selectedMotion,
    selectedMobileMin,
    rtlOnly,
  ]);

  const handleUpdateStatus = (
    compId: string,
    newStatus: 'candidate' | 'approved' | 'rejected'
  ) => {
    setComponents((prev) =>
      prev.map((c) => (c.id === compId ? { ...c, status: newStatus } : c))
    );
  };

  const handleRunImport = async () => {
    const adapter = componentImportAdapters.find((a) => a.id === importAdapterId);
    if (!adapter) return;

    const payload: ExternalComponentPayload = {
      sourceUrl: importUrl,
      source: adapter.sourceType,
      author: importAuthor,
      license: adapter.supportedLicenses[0] || 'MIT',
      originalCategory: importCat,
      name: importName,
      description: importDesc,
      rawCode: '// transformed internal code placeholder',
      dependencies: ['lucide-react'],
      tags: ['external-import', adapter.sourceType],
    };

    const result = await adapter.adapt(payload);
    setComponents((prev) => [result.internalTransformedVersion, ...prev]);
    setImportSuccessMsg(`Successfully adapted "${result.internalTransformedVersion.name}" from ${adapter.name}. Added to Candidate queue.`);
    setTimeout(() => {
      setImportSuccessMsg(null);
      setShowImportModal(false);
    }, 2000);
  };

  return (
    <div className="component-library-view">
      {/* VIEW SUB-TAB TOGGLE */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          borderBottom: '1px solid #27272a',
          paddingBottom: '16px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'inline-flex', gap: '8px', background: '#121214', padding: '4px', borderRadius: '8px', border: '1px solid #27272a' }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('sandbox')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: activeSubTab === 'sandbox' ? '#d6a84f' : 'transparent',
              color: activeSubTab === 'sandbox' ? '#111' : '#a1a1aa',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <MonitorSmartphone size={15} /> Interactive Sandbox ({demoComponents.filter((c) => c.status === 'approved').length} Live Patterns)
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('registry')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '6px',
              backgroundColor: activeSubTab === 'registry' ? '#d6a84f' : 'transparent',
              color: activeSubTab === 'registry' ? '#111' : '#a1a1aa',
              fontSize: '13px',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <Layers size={15} /> Registry & Approval Matrix
          </button>
        </div>

        {activeSubTab === 'registry' && (
          <button className="primary-button" onClick={() => setShowImportModal(true)}>
            <Plus size={15} /> External Import Adapter
          </button>
        )}
      </div>

      {activeSubTab === 'sandbox' ? (
        <ComponentSandboxView />
      ) : (
        <>
          <div className="section-intro">
            <div>
              <span className="eyebrow">REGISTRY & APPROVAL SYSTEM</span>
              <h2>Component Library & Import Standards</h2>
              <p className="section-description">
                Vetted structural blocks with strict approval states. <strong>Only Approved components</strong> may be
                automatically chosen by the website-generation agent. Candidate blocks undergo visual review, while
                Rejected clichés (excessive purple gradients, bloated cards) are permanently barred.
              </p>
            </div>
          </div>

      {/* FILTER CONTROLS TOOLBAR */}
      <div className="filter-toolbar-card">
        <div className="search-bar-row">
          <div className="search-input-wrapper">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search components by name, tag, or registry ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-quick-chips">
            <button
              className={`filter-chip ${selectedStatus === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('all')}
            >
              All ({components.length})
            </button>
            <button
              className={`filter-chip ${selectedStatus === 'approved' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('approved')}
            >
              <CheckCircle2 size={12} /> Approved ({components.filter((c) => c.status === 'approved').length})
            </button>
            <button
              className={`filter-chip ${selectedStatus === 'candidate' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('candidate')}
            >
              <Clock size={12} /> Candidates ({components.filter((c) => c.status === 'candidate').length})
            </button>
            <button
              className={`filter-chip ${selectedStatus === 'rejected' ? 'active' : ''}`}
              onClick={() => setSelectedStatus('rejected')}
            >
              <XCircle size={12} /> Rejected ({components.filter((c) => c.status === 'rejected').length})
            </button>
          </div>
        </div>

        <div className="secondary-filters-row">
          {/* Category */}
          <div className="filter-select-box">
            <label>Category</label>
            <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
              <option value="all">All Categories</option>
              <option value="hero">Hero</option>
              <option value="navigation">Navigation</option>
              <option value="cro">CRO & Trust</option>
              <option value="portfolio">Portfolio</option>
              <option value="services">Services</option>
              <option value="testimonials">Testimonials</option>
              <option value="forms">Forms</option>
              <option value="cta">CTA</option>
              <option value="footer">Footer</option>
              <option value="ecommerce">Ecommerce</option>
              <option value="features">Features</option>
            </select>
          </div>

          {/* Source */}
          <div className="filter-select-box">
            <label>Source</label>
            <select value={selectedSource} onChange={(e) => setSelectedSource(e.target.value)}>
              <option value="all">All Sources</option>
              <option value="internal">Internal Studio</option>
              <option value="magic-ui">Magic UI</option>
              <option value="motion-primitives">Motion Primitives</option>
              <option value="kokonut-ui">Kokonut UI</option>
              <option value="21st-dev">21st.dev</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Style */}
          <div className="filter-select-box">
            <label>Style Tag</label>
            <select value={selectedStyle} onChange={(e) => setSelectedStyle(e.target.value)}>
              <option value="all">All Styles</option>
              {allStyles.map((style) => (
                <option key={style} value={style}>{style}</option>
              ))}
            </select>
          </div>

          {/* Motion */}
          <div className="filter-select-box">
            <label>Motion Level</label>
            <select value={selectedMotion} onChange={(e) => setSelectedMotion(e.target.value)}>
              <option value="all">All Motion</option>
              <option value="none">None</option>
              <option value="subtle">Subtle</option>
              <option value="moderate">Moderate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          {/* Mobile Quality */}
          <div className="filter-select-box">
            <label>Min Mobile Quality</label>
            <select
              value={selectedMobileMin}
              onChange={(e) => setSelectedMobileMin(Number(e.target.value))}
            >
              <option value="0">Any Quality</option>
              <option value="4">★ 4.0 and higher</option>
              <option value="5">★ 5.0 (Flawless)</option>
            </select>
          </div>

          {/* RTL Ready Toggle */}
          <div className="filter-toggle-box">
            <label>RTL First-Class</label>
            <button
              className={`toggle-button ${rtlOnly ? 'active' : ''}`}
              onClick={() => setRtlOnly(!rtlOnly)}
            >
              <ArrowRightLeft size={13} /> {rtlOnly ? 'RTL Only' : 'All Orientations'}
            </button>
          </div>
        </div>
      </div>

      {/* COMPONENT CARDS GRID */}
      <div className="component-cards-grid">
        {filteredComponents.map((comp) => {
          const isApproved = comp.status === 'approved';
          const isCandidate = comp.status === 'candidate';
          const isRejected = comp.status === 'rejected';

          return (
            <article key={comp.id} className={`comp-registry-card status-${comp.status}`}>
              <div className="comp-card-topbar">
                <div className="comp-tags-left">
                  <span className="category-pill">{comp.category.toUpperCase()}</span>
                  <span className="source-pill">{comp.source}</span>
                  <span className="license-pill">{comp.license}</span>
                </div>

                <div className="status-selector-group">
                  <select
                    className={`status-select status-${comp.status}`}
                    value={comp.status}
                    onChange={(e) =>
                      handleUpdateStatus(comp.id, e.target.value as any)
                    }
                  >
                    <option value="approved">Approved (Eligible)</option>
                    <option value="candidate">Candidate (Under Review)</option>
                    <option value="rejected">Rejected (Barred)</option>
                  </select>
                </div>
              </div>

              <div className="comp-card-content">
                <h3 className="comp-name">{comp.name}</h3>
                <span className="comp-id-code">{comp.id}</span>
                <p className="comp-description">{comp.description}</p>

                {/* AI Eligibility Notice */}
                <div className={`eligibility-notice ${isApproved ? 'eligible' : 'excluded'}`}>
                  {isApproved ? (
                    <><CheckCircle2 size={13} /> Eligible for AI site planning & auto-selection</>
                  ) : isCandidate ? (
                    <><Clock size={13} /> Candidate: Pending manual approval before AI can select</>
                  ) : (
                    <><XCircle size={13} /> Rejected: Barred from auto-selection (violates anti-slop rules)</>
                  )}
                </div>

                <div className="comp-technical-specs">
                  <div className="spec-row">
                    <span className="spec-title"><Smartphone size={13} /> Mobile Quality:</span>
                    <span className="spec-value">★ {comp.mobileQuality}.0 / 5.0</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-title"><ArrowRightLeft size={13} /> RTL Native:</span>
                    <span className="spec-value">{comp.rtlReady ? 'Yes (Verified)' : 'No (Requires adaptation)'}</span>
                  </div>
                  <div className="spec-row">
                    <span className="spec-title"><Activity size={13} /> Motion Level:</span>
                    <span className="spec-value">{comp.motionLevel}</span>
                  </div>
                </div>

                {comp.imageRequirements.length > 0 && (
                  <div className="image-reqs-section">
                    <span className="section-label">Required Image Slots:</span>
                    <div className="slots-list">
                      {comp.imageRequirements.map((img, iIdx) => (
                        <span key={iIdx} className="slot-badge">
                          {img.slot} ({img.aspectRatio})
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="comp-tags-section">
                  <div className="tags-row">
                    {comp.styleTags.map((t, idx) => (
                      <span key={idx} className="style-tag">{t}</span>
                    ))}
                  </div>
                  <div className="tags-row">
                    {comp.industryFit.map((ind, idx) => (
                      <span key={idx} className="industry-tag">{ind}</span>
                    ))}
                  </div>
                </div>

                <div className="comp-location-foot">
                  <span className="location-code">{comp.codeLocation}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* EXTERNAL COMPONENT ADAPTERS OVERVIEW */}
      <div className="external-adapters-section">
        <div className="section-header-compact">
          <Layers size={18} />
          <h3>Open-Source Component Import Adapters</h3>
        </div>
        <p className="adapters-desc">
          Architecture prepared for future curated component ingestion. Retains source URL, license, author,
          dependency list, original category, and converts into Natanel Studio normalized tokens.
        </p>

        <div className="adapters-grid">
          {componentImportAdapters.map((adapter) => (
            <div key={adapter.id} className="adapter-card">
              <div className="adapter-header">
                <strong>{adapter.name}</strong>
                <span className="source-tag">{adapter.sourceType}</span>
              </div>
              <p className="adapter-desc">{adapter.description}</p>
              <div className="adapter-licenses">
                Licenses: {adapter.supportedLicenses.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}

      {/* IMPORT SIMULATION MODAL */}
      {showImportModal && (
        <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ingest External Component Pattern</h3>
              <button className="close-button" onClick={() => setShowImportModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-subtitle">
                Import from approved open-source libraries into the Candidate review queue with full attribution.
              </p>

              <div className="field-group">
                <label>Target Adapter Source</label>
                <select
                  value={importAdapterId}
                  onChange={(e) => setImportAdapterId(e.target.value)}
                >
                  {componentImportAdapters.map((a) => (
                    <option key={a.id} value={a.id}>{a.name} ({a.sourceType})</option>
                  ))}
                </select>
              </div>

              <div className="field-group">
                <label>Source URL (Attribution Retained)</label>
                <input
                  type="url"
                  value={importUrl}
                  onChange={(e) => setImportUrl(e.target.value)}
                />
              </div>

              <div className="two-col-fields">
                <div className="field-group">
                  <label>Author / Community Credit</label>
                  <input
                    type="text"
                    value={importAuthor}
                    onChange={(e) => setImportAuthor(e.target.value)}
                  />
                </div>

                <div className="field-group">
                  <label>Original Category</label>
                  <input
                    type="text"
                    value={importCat}
                    onChange={(e) => setImportCat(e.target.value)}
                  />
                </div>
              </div>

              <div className="field-group">
                <label>Component Name</label>
                <input
                  type="text"
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Description & Purpose</label>
                <textarea
                  rows={2}
                  value={importDesc}
                  onChange={(e) => setImportDesc(e.target.value)}
                />
              </div>

              {importSuccessMsg && (
                <div className="success-banner">
                  <CheckCircle2 size={14} /> {importSuccessMsg}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="secondary-button" onClick={() => setShowImportModal(false)}>
                Cancel
              </button>
              <button className="primary-button" onClick={handleRunImport}>
                Adapt & Ingest to Candidates <Sparkles size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
