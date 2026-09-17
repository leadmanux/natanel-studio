import React, { useState, useMemo, useEffect } from 'react';
import {
  type ComponentDefinition,
  type ComponentCategory,
} from '@shared/componentRegistry';
import { hasComponentImplementation } from '@shared/componentImplementations';
import {
  componentImportAdapters,
  type ExternalComponentPayload,
} from '@shared/importAdapters';
import { componentRegistryRepository } from '../data/componentRegistryRepository';
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
  MonitorSmartphone,
  Info,
} from 'lucide-react';
import { ComponentSandboxView } from './ComponentSandboxView';

interface ComponentLibraryViewProps {
  onSelectComponent?: (comp: ComponentDefinition) => void;
}

export function ComponentLibraryView({ onSelectComponent }: ComponentLibraryViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'registry'>('sandbox');
  const [components, setComponents] = useState<ComponentDefinition[]>(() =>
    componentRegistryRepository.getSynchronous()
  );

  useEffect(() => {
    const unsubscribe = componentRegistryRepository.subscribe((latest) => {
      setComponents(latest);
    });
    return unsubscribe;
  }, []);

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

  // Register External Candidate form state
  const [importAdapterId, setImportAdapterId] = useState('adapter-magic-ui');
  const [importUrl, setImportUrl] = useState('https://magicui.design/docs/components/marquee');
  const [importAuthor, setImportAuthor] = useState('Magic UI Community');
  const [importName, setImportName] = useState('Editorial Logo Marquee');
  const [importCat, setImportCat] = useState('cro');
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

  const handleUpdateStatus = async (
    compId: string,
    newStatus: 'candidate' | 'approved' | 'rejected'
  ) => {
    if (newStatus === 'approved' && !hasComponentImplementation(compId)) {
      alert(
        'A component may not transition to approved unless a real render implementation exists. Metadata-only external candidates must remain Candidate until implementation exists.'
      );
      return;
    }

    try {
      await componentRegistryRepository.updateStatus(compId, newStatus);
    } catch (err: any) {
      console.error('Failed to update status:', err);
      alert(err.message || 'Failed to update component status.');
    }
  };

  const handleRegisterCandidate = async () => {
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
      rawCode: '// Candidate specification awaiting manual code implementation.\nexport default function CandidateComponent() { return null; }',
      dependencies: ['lucide-react'],
      tags: ['external-candidate', adapter.sourceType],
    };

    const result = await adapter.adapt(payload);
    const candidateDef: ComponentDefinition = {
      ...result.internalTransformedVersion,
      status: 'candidate', // Candidate by default
      mobileVerificationStatus: 'untested',
      rtlVerificationStatus: 'untested',
      transformationNotes: 'Candidate specification registered. Code implementation pending.',
    };

    await componentRegistryRepository.registerCandidate(candidateDef);
    setImportSuccessMsg(`Registered external candidate "${candidateDef.name}". Status is Candidate (ineligible for AI selection until approved).`);
    setTimeout(() => {
      setImportSuccessMsg(null);
      setShowImportModal(false);
    }, 2200);
  };

  const approvedCount = components.filter((c) => c.status === 'approved').length;

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
            id="subtab-sandbox"
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
            <MonitorSmartphone size={15} /> Interactive Sandbox ({approvedCount} Live Patterns)
          </button>
          <button
            id="subtab-registry"
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
          <button
            id="btn-register-candidate"
            className="primary-button"
            onClick={() => setShowImportModal(true)}
          >
            <Plus size={15} /> Register External Candidate
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
              <h2>Canonical Component Registry & Governance</h2>
              <p className="section-description">
                Vetted architectural blocks with real persistent approval state. <strong>Only Approved components</strong> may be
                automatically chosen by the website-generation agent. Candidates remain ineligible until reviewed, while
                Rejected items are immediately barred across both UI and server AI services.
              </p>
            </div>
          </div>

          {/* FILTER CONTROLS TOOLBAR */}
          <div className="filter-toolbar-card">
            <div className="search-bar-row">
              <div className="search-input-wrapper">
                <Search size={15} className="search-icon" />
                <input
                  id="registry-search-input"
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
                  <option value="5">★ 5.0</option>
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
                <article key={comp.id} id={`registry-card-${comp.id}`} className={`comp-registry-card status-${comp.status}`}>
                  <div className="comp-card-topbar">
                    <div className="comp-tags-left">
                      <span className="category-pill">{comp.category.toUpperCase()}</span>
                      <span className="source-pill">{comp.source}</span>
                      <span className="license-pill">{comp.license}</span>
                    </div>

                    <div className="status-selector-group">
                      <select
                        id={`status-select-${comp.id}`}
                        className={`status-select status-${comp.status}`}
                        value={comp.status}
                        onChange={(e) =>
                          handleUpdateStatus(comp.id, e.target.value as any)
                        }
                      >
                        <option
                          value="approved"
                          disabled={!hasComponentImplementation(comp.id)}
                          title={!hasComponentImplementation(comp.id) ? 'Requires real render implementation before approval' : undefined}
                        >
                          {hasComponentImplementation(comp.id) ? 'Approved (Eligible)' : 'Approved (Missing Code)'}
                        </option>
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
                        <><Clock size={13} /> Candidate: Ineligible for AI selection until approved</>
                      ) : (
                        <><XCircle size={13} /> Rejected: Barred from auto-selection</>
                      )}
                    </div>

                    {/* Technical Specs with Verification Transparency */}
                    <div className="comp-technical-specs">
                      <div className="spec-row">
                        <span className="spec-title"><Smartphone size={13} /> Mobile Quality:</span>
                        <span className="spec-value">
                          ★ {comp.mobileQuality}.0{' '}
                          <small style={{ color: comp.mobileVerificationStatus && comp.mobileVerificationStatus !== 'untested' ? '#4ade80' : '#888892' }}>
                            {comp.mobileVerificationStatus && comp.mobileVerificationStatus !== 'untested' ? '(verified)' : '(unverified)'}
                          </small>
                        </span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-title"><ArrowRightLeft size={13} /> RTL Native:</span>
                        <span className="spec-value">
                          {comp.rtlReady
                            ? comp.rtlVerificationStatus && comp.rtlVerificationStatus !== 'untested'
                              ? 'Yes (Verified)'
                              : 'Supported (Untested)'
                            : 'No'}
                        </span>
                      </div>
                      <div className="spec-row">
                        <span className="spec-title"><Activity size={13} /> Motion Level:</span>
                        <span className="spec-value">{comp.motionLevel || 'subtle'}</span>
                      </div>
                    </div>

                    {/* Provenance Details */}
                    <div style={{ padding: '8px 10px', backgroundColor: '#18181c', borderRadius: '4px', fontSize: '11px', margin: '8px 0', border: '1px solid #28282e' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#9d9da5' }}>
                        <span>Author: <strong style={{ color: '#f3f3f1' }}>{comp.sourceAuthor || 'Natanel Studio'}</strong></span>
                        <span>v{comp.version || '1.0.0'}</span>
                      </div>
                      {comp.sourceUrl && (
                        <div style={{ marginTop: '4px' }}>
                          <a
                            href={comp.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{ color: '#d6a84f', textDecoration: 'underline' }}
                          >
                            Source Link ↗
                          </a>
                        </div>
                      )}
                      {comp.transformationNotes && (
                        <div style={{ marginTop: '4px', color: '#8e8e98', fontStyle: 'italic' }}>
                          {comp.transformationNotes}
                        </div>
                      )}
                    </div>

                    {comp.imageRequirements && comp.imageRequirements.length > 0 && (
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

          {/* REGISTER EXTERNAL CANDIDATE MODAL */}
          {showImportModal && (
            <div className="modal-backdrop" onClick={() => setShowImportModal(false)}>
              <div className="modal-window" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Register External Candidate</h3>
                  <button className="close-button" onClick={() => setShowImportModal(false)}>×</button>
                </div>

                <div className="modal-body">
                  <div style={{ padding: '10px 12px', backgroundColor: '#1c1b18', border: '1px solid #78350f', borderRadius: '6px', marginBottom: '14px', fontSize: '12px', color: '#fde047' }}>
                    <Info size={14} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '6px' }} />
                    Registers an external pattern specification into the canonical candidate queue. Registered candidates remain in <strong>Candidate</strong> status and are <strong>ineligible for automatic AI selection</strong> until code is authored, audited, and approved.
                  </div>

                  <div className="field-group">
                    <label>Target Pattern Source</label>
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
                    <label>Source URL (Provenance Link)</label>
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
                      <label>Target Category</label>
                      <input
                        type="text"
                        value={importCat}
                        onChange={(e) => setImportCat(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="field-group">
                    <label>Candidate Component Name</label>
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
                  <button className="primary-button" onClick={handleRegisterCandidate}>
                    Register Candidate Specification <Sparkles size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
