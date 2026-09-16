import React, { useState } from 'react';
import type { Project, ReferenceAnalysis, SiteSection, SitePage } from '@shared/project';
import { demoComponents } from '@shared/componentRegistry';
import type { ArtDirectionProposal, ComponentSelectionItem, DesignCriticReport } from '../ai/contracts';
import {
  requestArtDirections,
  requestReferenceAnalysis,
  requestComponentSelection,
  requestDesignCritic,
} from '../ai/client';
import {
  Sparkles,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Eye,
  Check,
} from 'lucide-react';

interface DesignWorkspaceProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
  onNavigateToAssets: () => void;
}

type DesignSubStep = 'references' | 'art_director' | 'site_plan' | 'critic';

export function DesignWorkspace({ project, onUpdateProject, onNavigateToAssets }: DesignWorkspaceProps) {
  const [activeSubStep, setActiveSubStep] = useState<DesignSubStep>('art_director');

  // Reference analysis state
  const [referenceUrl, setReferenceUrl] = useState(project.brand.referenceSites?.[0] || 'https://linear.app');
  const [isAnalyzingRef, setIsAnalyzingRef] = useState(false);
  const [refError, setRefError] = useState<string | null>(null);

  // Art Director proposals state
  const [proposals, setProposals] = useState<ArtDirectionProposal[]>([]);
  const [isGeneratingDirections, setIsGeneratingDirections] = useState(false);
  const [artDirectorError, setArtDirectorError] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);

  // Component selection state
  const [componentSelections, setComponentSelections] = useState<ComponentSelectionItem[]>([]);
  const [isSelectingComponents, setIsSelectingComponents] = useState(false);
  const [selectionError, setSelectionError] = useState<string | null>(null);

  // Design Critic state
  const [criticReport, setCriticReport] = useState<DesignCriticReport | null>(null);
  const [isRunningCritic, setIsRunningCritic] = useState(false);
  const [criticError, setCriticError] = useState<string | null>(null);

  // 1. Analyze Reference
  const handleAnalyzeReference = async () => {
    if (!referenceUrl) return;
    setIsAnalyzingRef(true);
    setRefError(null);
    try {
      const analysis = await requestReferenceAnalysis(referenceUrl, project);
      const existingAnalyses = project.brand.referenceAnalyses || [];
      const updated: Project = {
        ...project,
        brand: {
          ...project.brand,
          referenceAnalyses: [analysis, ...existingAnalyses.filter((a) => a.url !== referenceUrl)],
        },
      };
      onUpdateProject(updated);
    } catch (err: any) {
      setRefError(err.message || 'Failed to analyze reference URL.');
    } finally {
      setIsAnalyzingRef(false);
    }
  };

  // 2. Generate 3 Design Directions
  const handleGenerateDirections = async () => {
    setIsGeneratingDirections(true);
    setArtDirectorError(null);
    try {
      const directions = await requestArtDirections(project);
      setProposals(directions);
      if (directions.length > 0) {
        setSelectedProposalId(directions[0].id);
      }
    } catch (err: any) {
      setArtDirectorError(err.message || 'Failed to generate design directions.');
    } finally {
      setIsGeneratingDirections(false);
    }
  };

  // 3. Approve Direction -> updates project.designSystem
  const handleApproveDirection = (proposal: ArtDirectionProposal) => {
    const updated: Project = {
      ...project,
      status: 'designing',
      designSystem: {
        artDirection: proposal.name,
        creativeConcept: proposal.creativeConcept,
        visualMood: proposal.visualMood,
        typography: proposal.typographyDirection,
        typographyDirection: proposal.typographyDirection,
        colors: proposal.palette,
        colorDirection: proposal.colorDirection,
        spacing: proposal.spacingPhilosophy,
        spacingPhilosophy: proposal.spacingPhilosophy,
        borderRadius: proposal.name.includes('Swiss') ? '0px' : '2px',
        imageStyle: proposal.imageDirection,
        photographyDirection: proposal.photographyDirection,
        imageGenerationStrategy: proposal.imageGenerationStrategy,
        motionStyle: proposal.motionDirection,
        motionPhilosophy: proposal.motionPhilosophy,
        layoutPhilosophy: proposal.layoutPhilosophy,
        layoutRules: proposal.layoutPrinciples,
        avoidRules: proposal.avoid,
        CROApproach: proposal.CROApproach,
        recommendedComponentStyles: proposal.recommendedComponentStyles,
        density: proposal.density || 'spacious',
        visualPersonality: proposal.visualPersonality,
        approvedAt: new Date().toISOString(),
      },
    };
    onUpdateProject(updated);
    setSelectedProposalId(proposal.id);
  };

  // 4. Select Components
  const handleSelectComponents = async () => {
    setIsSelectingComponents(true);
    setSelectionError(null);
    try {
      const approvedCandidates = demoComponents.filter((c) => c.status === 'approved');
      const selections = await requestComponentSelection(project, approvedCandidates);
      setComponentSelections(selections);

      // Structure sections into project pages
      const pagesMap = new Map<string, SiteSection[]>();
      selections.forEach((sel, idx) => {
        const pageName = sel.page || 'Home';
        if (!pagesMap.has(pageName)) pagesMap.set(pageName, []);
        pagesMap.get(pageName)!.push({
          id: `sec-${idx + 1}-${sel.componentRegistryId}`,
          name: sel.sectionPurpose,
          componentRegistryId: sel.componentRegistryId,
          purpose: sel.sectionPurpose,
          content: {},
          assetIds: [],
          order: idx + 1,
          reason: sel.reason,
          contentRequirements: sel.contentRequirements,
          imageRequirements: sel.imageRequirements,
          motionPreset: sel.motionPreset,
        });
      });

      const updatedPages: SitePage[] = Array.from(pagesMap.entries()).map(([name, sections]) => ({
        id: `page-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        slug: name === 'Home' ? '/' : `/${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        purpose: `${name} experience for ${project.business.businessName || 'the studio'}`,
        sections,
      }));

      const updated: Project = {
        ...project,
        pages: updatedPages,
      };
      onUpdateProject(updated);
    } catch (err: any) {
      setSelectionError(err.message || 'Failed to select components.');
    } finally {
      setIsSelectingComponents(false);
    }
  };

  // 5. Run Design Critic
  const handleRunCritic = async () => {
    setIsRunningCritic(true);
    setCriticError(null);
    try {
      const report = await requestDesignCritic(project);
      setCriticReport(report);
    } catch (err: any) {
      setCriticError(err.message || 'Failed to run Design Critic.');
    } finally {
      setIsRunningCritic(false);
    }
  };

  const currentApproved = project.designSystem.artDirection;
  const referenceAnalyses = project.brand.referenceAnalyses || [];

  return (
    <div className="design-workspace">
      {/* Sub-step navigation ribbon */}
      <div className="design-subnav">
        <button
          className={`subnav-item ${activeSubStep === 'references' ? 'active' : ''}`}
          onClick={() => setActiveSubStep('references')}
        >
          <span className="step-num">01</span>
          <span>Reference Analysis</span>
          {referenceAnalyses.length > 0 && <span className="pill-count">{referenceAnalyses.length}</span>}
        </button>

        <button
          className={`subnav-item ${activeSubStep === 'art_director' ? 'active' : ''}`}
          onClick={() => setActiveSubStep('art_director')}
        >
          <span className="step-num">02</span>
          <span>3 Design Directions</span>
          {currentApproved ? <CheckCircle2 size={14} className="success-icon" /> : <span className="pill-pulse">Action</span>}
        </button>

        <button
          className={`subnav-item ${activeSubStep === 'site_plan' ? 'active' : ''}`}
          onClick={() => setActiveSubStep('site_plan')}
        >
          <span className="step-num">03</span>
          <span>Component Selection</span>
          {project.pages.length > 0 && <span className="pill-count">{project.pages.reduce((a, p) => a + p.sections.length, 0)}</span>}
        </button>

        <button
          className={`subnav-item ${activeSubStep === 'critic' ? 'active' : ''}`}
          onClick={() => setActiveSubStep('critic')}
        >
          <span className="step-num">04</span>
          <span>Design Quality Critic</span>
          {criticReport && <span className="pill-count">12/12</span>}
        </button>
      </div>

      {/* SUB-STEP 1: REFERENCE ANALYSIS */}
      {activeSubStep === 'references' && (
        <div className="design-step-container">
          <div className="section-intro">
            <div>
              <span className="eyebrow">STAGE 02.1 / INGESTION</span>
              <h2>Reference Website Architecture Analysis</h2>
              <p className="section-description">
                Extract reusable design characteristics without copying literally. Ingests layout structure,
                typographic tension, negative space cadence, hero framing, and conversion techniques into our internal design language.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={isAnalyzingRef}
              onClick={handleAnalyzeReference}
            >
              {isAnalyzingRef ? (
                <><RefreshCw size={14} className="spin" /> Analyzing Reference...</>
              ) : (
                <><Compass size={15} /> Analyze URL</>
              )}
            </button>
          </div>

          <div className="reference-input-card">
            <div className="field-group">
              <label>Reference URL</label>
              <div className="inline-add-row">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={referenceUrl}
                  onChange={(e) => setReferenceUrl(e.target.value)}
                />
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isAnalyzingRef}
                  onClick={handleAnalyzeReference}
                >
                  Analyze
                </button>
              </div>
            </div>
            {refError && <div className="error-banner">{refError}</div>}
          </div>

          {referenceAnalyses.length === 0 ? (
            <div className="empty-state-box">
              <Compass size={28} strokeWidth={1.3} />
              <h3>No reference analyses yet</h3>
              <p>Add a reference URL above to decompose layout, typography, whitespace, and conversion techniques.</p>
            </div>
          ) : (
            <div className="analyses-list">
              {referenceAnalyses.map((analysis) => (
                <article key={analysis.id} className="analysis-card">
                  <div className="analysis-header">
                    <div>
                      <div className="analysis-url">
                        <ExternalLink size={13} /> {analysis.url}
                      </div>
                      <h3 className="analysis-summary">{analysis.summary}</h3>
                    </div>
                    <span className="timestamp">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                  </div>

                  <div className="characteristics-grid">
                    <div className="char-cell">
                      <span className="char-label">Layout Architecture</span>
                      <p>{analysis.layout}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Typography & Contrast</span>
                      <p>{analysis.typography}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Whitespace Cadence</span>
                      <p>{analysis.whitespace}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Hero & Media Framing</span>
                      <p>{analysis.heroComposition}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Image Treatment & Light</span>
                      <p>{analysis.imageTreatment}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Section Transitions</span>
                      <p>{analysis.sectionTransitions}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Interaction & Motion</span>
                      <p>{analysis.motion}</p>
                    </div>
                    <div className="char-cell">
                      <span className="char-label">Conversion Techniques</span>
                      <p>{analysis.conversionTechniques}</p>
                    </div>
                  </div>

                  <div className="principles-box">
                    <span className="principles-title">Extracted Studio Principles:</span>
                    <ul>
                      {analysis.extractedDesignPrinciples.map((principle, idx) => (
                        <li key={idx}>{principle}</li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          )}

          <div className="next-step-footer">
            <button className="primary-button" onClick={() => setActiveSubStep('art_director')}>
              Continue to 3 Design Directions <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* SUB-STEP 2: ART DIRECTOR 3 DESIGN DIRECTIONS */}
      {activeSubStep === 'art_director' && (
        <div className="design-step-container">
          <div className="section-intro">
            <div>
              <span className="eyebrow">STAGE 02.2 / ART DIRECTION</span>
              <h2>Three Distinct Design Concepts</h2>
              <p className="section-description">
                The Art Director synthesizes business profile, target audience, conversion goals, RTL/LTR, references,
                and content density to forge three genuinely distinct design directions. Select and approve one to lock
                into the project design system.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={isGeneratingDirections}
              onClick={handleGenerateDirections}
            >
              {isGeneratingDirections ? (
                <><RefreshCw size={14} className="spin" /> Generating Concepts...</>
              ) : (
                <><Sparkles size={15} /> {proposals.length > 0 ? 'Regenerate Directions' : 'Generate 3 Directions'}</>
              )}
            </button>
          </div>

          {currentApproved && (
            <div className="approved-direction-banner">
              <div className="approved-left">
                <CheckCircle2 size={20} className="success-icon" />
                <div>
                  <span className="approved-eyebrow">LOCKED DESIGN SYSTEM</span>
                  <strong>{currentApproved}</strong>
                  <p className="approved-desc">{project.designSystem.creativeConcept}</p>
                </div>
              </div>
              <div className="approved-actions">
                <button className="secondary-button" onClick={() => setActiveSubStep('site_plan')}>
                  Proceed to Component Selection <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}

          {artDirectorError && <div className="error-banner">{artDirectorError}</div>}

          {proposals.length === 0 && !isGeneratingDirections && (
            <div className="empty-state-box">
              <Sparkles size={32} strokeWidth={1.2} />
              <h3>No design directions generated yet</h3>
              <p>Click "Generate 3 Directions" above. The Art Director will construct three genuinely different architectural concepts.</p>
              <button className="primary-button" onClick={handleGenerateDirections} style={{ marginTop: '16px' }}>
                Generate 3 Directions
              </button>
            </div>
          )}

          {proposals.length > 0 && (
            <div className="directions-grid">
              {proposals.map((proposal) => {
                const isApproved = currentApproved === proposal.name || currentApproved === proposal.artDirectionName;
                const isSelected = selectedProposalId === proposal.id;

                return (
                  <article
                    key={proposal.id}
                    className={`direction-card ${isApproved ? 'is-approved' : ''} ${isSelected ? 'is-selected' : ''}`}
                    onClick={() => setSelectedProposalId(proposal.id)}
                  >
                    <div className="direction-header">
                      <div className="direction-title-block">
                        <span className="direction-personality-pill">
                          {proposal.visualPersonality || proposal.name.split(':')[0]}
                        </span>
                        <h3>{proposal.artDirectionName || proposal.name}</h3>
                      </div>
                      {isApproved && (
                        <span className="approved-badge">
                          <Check size={12} /> APPROVED
                        </span>
                      )}
                    </div>

                    <p className="concept-statement">{proposal.creativeConcept}</p>

                    <div className="direction-palette-row">
                      {proposal.palette.map((hex, idx) => (
                        <div key={idx} className="palette-chip" style={{ backgroundColor: hex }} title={hex}>
                          <span className="hex-text">{hex}</span>
                        </div>
                      ))}
                    </div>

                    <div className="direction-details">
                      <div className="detail-item">
                        <span className="detail-label">Typography Direction</span>
                        <p>{proposal.typographyDirection}</p>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Layout & Spacing Philosophy</span>
                        <p>{proposal.layoutPhilosophy}</p>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Photography & Image Treatment</span>
                        <p>{proposal.photographyDirection || proposal.imageDirection}</p>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">Motion & Easing</span>
                        <p>{proposal.motionPhilosophy || proposal.motionDirection}</p>
                      </div>

                      <div className="detail-item">
                        <span className="detail-label">CRO & Conversion Strategy</span>
                        <p>{proposal.CROApproach}</p>
                      </div>

                      <div className="avoid-rules-block">
                        <span className="avoid-label">Explicit Avoid Rules (Anti-Slop):</span>
                        <ul>
                          {proposal.avoid.map((rule, rIdx) => (
                            <li key={rIdx}>{rule}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="direction-card-footer">
                      <button
                        className={isApproved ? 'approved-button' : 'primary-button'}
                        disabled={isApproved}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleApproveDirection(proposal);
                        }}
                      >
                        {isApproved ? (
                          <><Check size={14} /> Approved & Active</>
                        ) : (
                          <><CheckCircle2 size={14} /> Approve Direction</>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="next-step-footer">
            <button
              className="primary-button"
              disabled={!currentApproved}
              onClick={() => setActiveSubStep('site_plan')}
            >
              Continue to Component Selection <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* SUB-STEP 3: SITE PLAN & COMPONENT SELECTION */}
      {activeSubStep === 'site_plan' && (
        <div className="design-step-container">
          <div className="section-intro">
            <div>
              <span className="eyebrow">STAGE 02.3 / ARCHITECTURE</span>
              <h2>Approved Component Selection Engine</h2>
              <p className="section-description">
                Maps the approved Art Direction and conversion goals to approved components in our registry.
                The engine strictly selects only vetted, approved components and never freely invents arbitrary section markup.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={isSelectingComponents}
              onClick={handleSelectComponents}
            >
              {isSelectingComponents ? (
                <><RefreshCw size={14} className="spin" /> Selecting Approved Components...</>
              ) : (
                <><Layers size={15} /> {project.pages.length > 0 ? 'Re-run Component Selection' : 'Select Approved Components'}</>
              )}
            </button>
          </div>

          {selectionError && <div className="error-banner">{selectionError}</div>}

          {project.pages.length === 0 && !isSelectingComponents && (
            <div className="empty-state-box">
              <Layers size={32} strokeWidth={1.2} />
              <h3>No components selected yet</h3>
              <p>Click "Select Approved Components" to assign registry components to each required page section.</p>
              <button className="primary-button" onClick={handleSelectComponents} style={{ marginTop: '16px' }}>
                Run Component Selector
              </button>
            </div>
          )}

          {project.pages.length > 0 && (
            <div className="site-plan-flow">
              {project.pages.map((page) => (
                <div key={page.id} className="page-blueprint-card">
                  <div className="page-blueprint-header">
                    <div>
                      <span className="eyebrow">PAGE ARCHITECTURE</span>
                      <h3>{page.name}</h3>
                      <span className="page-slug">{page.slug}</span>
                    </div>
                    <span className="section-count-badge">{page.sections.length} Sections Planned</span>
                  </div>

                  <div className="sections-pipeline">
                    {page.sections.map((section, sIdx) => {
                      const regDef = demoComponents.find((c) => c.id === section.componentRegistryId);

                      return (
                        <div key={section.id} className="section-blueprint-row">
                          <div className="section-order-col">
                            <span className="order-number">{String(sIdx + 1).padStart(2, '0')}</span>
                            <div className="order-line" />
                          </div>

                          <div className="section-detail-card">
                            <div className="section-top-row">
                              <div>
                                <h4 className="section-purpose-title">{section.purpose}</h4>
                                <div className="section-component-id">
                                  <strong>{regDef?.name || section.componentRegistryId}</strong>
                                  <span className="reg-id-mono">({section.componentRegistryId})</span>
                                </div>
                              </div>

                              <div className="badges-group">
                                <span className="category-pill">{regDef?.category || 'section'}</span>
                                <span className="source-pill">{regDef?.source || 'internal'}</span>
                                {regDef?.rtlReady && <span className="rtl-pill">RTL READY</span>}
                                {regDef?.mobileQuality && (
                                  <span className="quality-pill">★ {regDef.mobileQuality}.0</span>
                                )}
                              </div>
                            </div>

                            <p className="selection-reason">{section.reason}</p>

                            <div className="requirements-grid">
                              {section.contentRequirements && section.contentRequirements.length > 0 && (
                                <div className="req-box">
                                  <span className="req-label">Content Requirements:</span>
                                  <ul>
                                    {section.contentRequirements.map((req, rIdx) => (
                                      <li key={rIdx}>{req}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {section.imageRequirements && section.imageRequirements.length > 0 && (
                                <div className="req-box">
                                  <span className="req-label">Image Requirements:</span>
                                  <ul>
                                    {section.imageRequirements.map((img, iIdx) => (
                                      <li key={iIdx}>{img}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="next-step-footer">
            <button className="primary-button" onClick={() => setActiveSubStep('critic')}>
              Proceed to Design Quality Critic <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* SUB-STEP 4: DESIGN QUALITY CRITIC */}
      {activeSubStep === 'critic' && (
        <div className="design-step-container">
          <div className="section-intro">
            <div>
              <span className="eyebrow">STAGE 02.4 / QUALITY CONTROL</span>
              <h2>Design Quality Critic & Slop Inspector</h2>
              <p className="section-description">
                Evaluates hierarchy, typography contrast, spacing cadence, visual repetition, card proliferation,
                image quality, brand consistency, and detects any residual generic AI clichés.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={isRunningCritic}
              onClick={handleRunCritic}
            >
              {isRunningCritic ? (
                <><RefreshCw size={14} className="spin" /> Evaluating Architecture...</>
              ) : (
                <><ShieldCheck size={15} /> {criticReport ? 'Re-run Critic' : 'Run Design Critic'}</>
              )}
            </button>
          </div>

          {criticError && <div className="error-banner">{criticError}</div>}

          {!criticReport && !isRunningCritic && (
            <div className="empty-state-box">
              <ShieldCheck size={32} strokeWidth={1.2} />
              <h3>Design Quality Critic not yet executed</h3>
              <p>Run the Critic to perform a comprehensive 12-category inspection of hierarchy, typography, and anti-slop rules.</p>
              <button className="primary-button" onClick={handleRunCritic} style={{ marginTop: '16px' }}>
                Run Quality Inspection
              </button>
            </div>
          )}

          {criticReport && (
            <div className="critic-report-container">
              <div className="critic-summary-card">
                <div className="critic-summary-header">
                  <ShieldCheck size={24} className="success-icon" />
                  <div>
                    <span className="eyebrow">EXECUTIVE DESIGN CRITIQUE</span>
                    <h3>Architectural Assessment</h3>
                  </div>
                </div>
                <p className="summary-text">{criticReport.summary}</p>
              </div>

              <div className="critic-categories-grid">
                {criticReport.categories.map((cat, idx) => (
                  <article key={idx} className={`category-critique-card status-${cat.status}`}>
                    <div className="category-header">
                      <div className="cat-title-group">
                        <span className={`status-indicator status-${cat.status}`} />
                        <h4 className="cat-title">{cat.category.toUpperCase()}</h4>
                      </div>
                      <span className="cat-score">{cat.score}/100</span>
                    </div>

                    <div className="findings-section">
                      <span className="section-tag">Key Observations:</span>
                      <ul>
                        {cat.findings.map((finding, fIdx) => (
                          <li key={fIdx}>{finding}</li>
                        ))}
                      </ul>
                    </div>

                    {cat.actionableCorrections && cat.actionableCorrections.length > 0 && (
                      <div className="corrections-section">
                        <span className="section-tag">Actionable Corrections:</span>
                        <ul>
                          {cat.actionableCorrections.map((corr, cIdx) => (
                            <li key={cIdx}>{corr}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                ))}
              </div>

              {criticReport.findings && criticReport.findings.length > 0 && (
                <div className="detailed-findings-card">
                  <h3>Specific Technical & CRO Flags</h3>
                  <div className="findings-list">
                    {criticReport.findings.map((f, idx) => (
                      <div key={idx} className="finding-row">
                        <span className={`severity-badge severity-${f.severity}`}>{f.severity.toUpperCase()}</span>
                        <div className="finding-content">
                          <strong>[{f.category.toUpperCase()}] {f.message}</strong>
                          <p className="suggested-fix">Fix: {f.suggestedFix}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="next-step-footer">
                <button className="primary-button" onClick={onNavigateToAssets}>
                  Proceed to Asset Manifest Planner <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
