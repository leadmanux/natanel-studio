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
  AlertCircle,
  Layers,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sliders,
  Eye,
  Check,
  Upload,
  X,
  Image as ImageIcon,
  Monitor,
  Smartphone,
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
  const [referenceUrl, setReferenceUrl] = useState(project.brand.referenceSites?.[0] || '');
  const [refScreenshots, setRefScreenshots] = useState<string[]>([]);
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
  const [criticDesktopScreenshot, setCriticDesktopScreenshot] = useState<string | null>(null);
  const [criticMobileScreenshot, setCriticMobileScreenshot] = useState<string | null>(null);
  const [isRunningCritic, setIsRunningCritic] = useState(false);
  const [criticError, setCriticError] = useState<string | null>(null);

  // Screenshot upload handlers
  const handleAddRefScreenshots = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          setRefScreenshots((prev) => [...prev, reader.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleUploadCriticShot = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: string | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setter(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 1. Analyze Reference
  const handleAnalyzeReference = async () => {
    if (!referenceUrl && refScreenshots.length === 0) {
      setRefError('Please provide a reference URL or upload reference screenshots.');
      return;
    }
    setIsAnalyzingRef(true);
    setRefError(null);
    try {
      const analysis = await requestReferenceAnalysis(
        referenceUrl || 'Visual Screenshot Reference',
        project,
        refScreenshots.length > 0 ? refScreenshots : undefined
      );
      const existingAnalyses = project.brand.referenceAnalyses || [];
      const updated: Project = {
        ...project,
        brand: {
          ...project.brand,
          referenceAnalyses: [
            analysis,
            ...existingAnalyses.filter((a) => a.url !== (referenceUrl || analysis.url)),
          ],
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
      const shots: string[] = [];
      if (criticDesktopScreenshot) shots.push(criticDesktopScreenshot);
      if (criticMobileScreenshot) shots.push(criticMobileScreenshot);

      const report = await requestDesignCritic(project, shots.length > 0 ? shots : undefined);
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
              <span className="eyebrow">STAGE 02.1 / INGESTION & GROUNDING</span>
              <h2>Reference Website Architecture Analysis</h2>
              <p className="section-description">
                Grounded live URL retrieval via Gemini URL Context. Ingests layout structure,
                typographic tension, whitespace cadence, and conversion techniques without hallucination.
                If live retrieval is blocked, upload screenshots for direct visual layout inspection.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={isAnalyzingRef}
              onClick={handleAnalyzeReference}
            >
              {isAnalyzingRef ? (
                <><RefreshCw size={14} className="spin" /> Inspecting Reference...</>
              ) : (
                <><Compass size={15} /> Analyze Reference</>
              )}
            </button>
          </div>

          <div className="reference-input-card">
            <div className="field-group">
              <label>Reference URL</label>
              <div className="inline-add-row">
                <input
                  type="url"
                  placeholder="https://example.com/reference-site"
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

            {/* Optional Reference Screenshots */}
            <div className="screenshot-upload-zone">
              <div className="upload-label-row">
                <label>Optional Reference Screenshots (Direct Visual Layout Analysis)</label>
                <label className="file-upload-btn">
                  <Upload size={13} /> Upload Screenshots
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleAddRefScreenshots}
                  />
                </label>
              </div>
              <p className="muted" style={{ margin: 0 }}>
                If bot protection, paywalls, or offline hosts prevent automated URL retrieval, uploaded screenshots allow direct visual layout inspection without hallucination.
              </p>
              {refScreenshots.length > 0 && (
                <div className="screenshot-previews">
                  {refScreenshots.map((shot, idx) => (
                    <div key={idx} className="screenshot-thumb-card">
                      <img src={shot} alt={`Reference Screenshot ${idx + 1}`} />
                      <button
                        type="button"
                        className="remove-shot-btn"
                        onClick={() => setRefScreenshots((prev) => prev.filter((_, i) => i !== idx))}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {refError && <div className="error-banner">{refError}</div>}
          </div>

          {referenceAnalyses.length === 0 ? (
            <div className="empty-state-box">
              <Compass size={28} strokeWidth={1.3} />
              <h3>No reference analyses yet</h3>
              <p>Add a reference URL or upload screenshots above to decompose layout, typography, whitespace, and conversion techniques.</p>
            </div>
          ) : (
            <div className="analyses-list">
              {referenceAnalyses.map((analysis) => {
                const isSuccess = analysis.retrievalStatus === 'success';
                const isLimited = analysis.retrievalStatus === 'limited';
                const isFailed = analysis.retrievalStatus === 'failed';

                return (
                  <article key={analysis.id} className="analysis-card">
                    <div className="analysis-header">
                      <div>
                        <div className="analysis-url" style={{ gap: '10px' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ExternalLink size={13} /> {analysis.url}
                          </span>
                          {isSuccess && (
                            <span className="retrieval-status-badge retrieval-success">
                              <CheckCircle2 size={11} /> URL Retrieval Success
                            </span>
                          )}
                          {isLimited && (
                            <span className="retrieval-status-badge retrieval-limited">
                              <AlertTriangle size={11} /> Limited / Screenshot Grounded
                            </span>
                          )}
                          {isFailed && (
                            <span className="retrieval-status-badge retrieval-failed">
                              <AlertCircle size={11} /> URL Retrieval Failed
                            </span>
                          )}
                          <span className="status-pill">
                            {analysis.source === 'ai' ? 'AI Grounded' : 'Zero Hallucination'}
                          </span>
                        </div>
                        <h3 className="analysis-summary">{analysis.summary}</h3>
                      </div>
                      <span className="timestamp">{new Date(analysis.analyzedAt).toLocaleDateString()}</span>
                    </div>

                    {analysis.retrievalNotes && (
                      <div className="retrieval-notes-banner">
                        <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span><strong>Retrieval Notice:</strong> {analysis.retrievalNotes}</span>
                      </div>
                    )}

                    {isFailed ? (
                      <div className="error-banner" style={{ background: '#191111', borderColor: '#4a2525' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px' }}>
                          <strong>No fabricated analysis generated:</strong> Gemini URL Context could not access this website directly. Natanel Studio enforces strict truthfulness and will not invent layout data.
                        </p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#cca5a5' }}>
                          Please upload reference screenshots using the upload box above and click "Analyze Reference" to perform visual decomposition on the actual design.
                        </p>
                      </div>
                    ) : (
                      <>
                        {(() => {
                          const shotsList: string[] = Array.isArray(analysis.screenshots)
                            ? analysis.screenshots
                            : analysis.screenshots
                              ? ([analysis.screenshots.desktop, analysis.screenshots.mobile].filter(Boolean) as string[])
                              : [];
                          if (shotsList.length === 0) return null;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span className="char-label">Analyzed Reference Screenshots ({shotsList.length})</span>
                              <div className="screenshot-previews">
                                {shotsList.map((shot, sIdx) => (
                                  <div key={sIdx} className="screenshot-thumb-card">
                                    <img src={shot} alt={`Screenshot ${sIdx + 1}`} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })()}

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

                        {analysis.extractedDesignPrinciples && analysis.extractedDesignPrinciples.length > 0 && (
                          <div className="principles-box">
                            <span className="principles-title">Extracted Studio Principles:</span>
                            <ul>
                              {analysis.extractedDesignPrinciples.map((principle, idx) => (
                                <li key={idx}>{principle}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
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
              <h2>Design Quality Critic & Visual Slop Inspector</h2>
              <p className="section-description">
                Inspects rendered hierarchy, typography tension, spacing cadence, mobile touch targets, and rejects generic AI slop.
                Upload rendered desktop and mobile screenshots for visual evidence verification.
              </p>
            </div>
            <button
              className="primary-button"
              disabled={isRunningCritic}
              onClick={handleRunCritic}
            >
              {isRunningCritic ? (
                <><RefreshCw size={14} className="spin" /> Inspecting Visual Craft...</>
              ) : (
                <><ShieldCheck size={15} /> {criticReport ? 'Re-run Critic' : 'Run Design Critic'}</>
              )}
            </button>
          </div>

          {/* Screenshot Upload for Real Visual Inspection */}
          <div className="critic-upload-row">
            <div className="screenshot-upload-zone">
              <div className="upload-label-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Monitor size={14} /> Desktop View Screenshot
                </label>
                <label className="file-upload-btn">
                  <Upload size={12} /> {criticDesktopScreenshot ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadCriticShot(e, setCriticDesktopScreenshot)}
                  />
                </label>
              </div>
              {criticDesktopScreenshot ? (
                <div className="screenshot-thumb-card" style={{ width: '120px', height: '75px' }}>
                  <img src={criticDesktopScreenshot} alt="Desktop Preview" />
                  <button
                    type="button"
                    className="remove-shot-btn"
                    onClick={() => setCriticDesktopScreenshot(null)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <p className="muted" style={{ margin: 0, fontSize: '11.5px' }}>
                  Upload desktop viewport screenshot for visual hierarchy and typographic tension review.
                </p>
              )}
            </div>

            <div className="screenshot-upload-zone">
              <div className="upload-label-row">
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Smartphone size={14} /> Mobile View Screenshot
                </label>
                <label className="file-upload-btn">
                  <Upload size={12} /> {criticMobileScreenshot ? 'Replace' : 'Upload'}
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleUploadCriticShot(e, setCriticMobileScreenshot)}
                  />
                </label>
              </div>
              {criticMobileScreenshot ? (
                <div className="screenshot-thumb-card" style={{ width: '60px', height: '90px' }}>
                  <img src={criticMobileScreenshot} alt="Mobile Preview" />
                  <button
                    type="button"
                    className="remove-shot-btn"
                    onClick={() => setCriticMobileScreenshot(null)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <p className="muted" style={{ margin: 0, fontSize: '11.5px' }}>
                  Upload mobile viewport screenshot to visually verify touch targets and single-column reflow.
                </p>
              )}
            </div>
          </div>

          {criticError && <div className="error-banner">{criticError}</div>}

          {!criticReport && !isRunningCritic && (
            <div className="empty-state-box">
              <ShieldCheck size={32} strokeWidth={1.2} />
              <h3>Design Quality Critic not yet executed</h3>
              <p>Upload screenshots and run the Critic to perform a comprehensive 12-category inspection of visual hierarchy, typography, and anti-slop rules.</p>
              <button className="primary-button" onClick={handleRunCritic} style={{ marginTop: '16px' }}>
                Run Quality Inspection
              </button>
            </div>
          )}

          {criticReport && (
            <div className="critic-report-container">
              {/* Inspection Bar */}
              <div className="critic-inspection-bar">
                <span><strong>Inspection Evidence Mode:</strong></span>
                <span className={`inspection-tag ${criticReport.inspectedScreenshots?.desktop ? 'active' : 'inactive'}`}>
                  <Monitor size={14} /> Desktop Screenshot: {criticReport.inspectedScreenshots?.desktop ? 'Inspected' : 'None'}
                </span>
                <span className={`inspection-tag ${criticReport.inspectedScreenshots?.mobile ? 'active' : 'inactive'}`}>
                  <Smartphone size={14} /> Mobile Screenshot: {criticReport.inspectedScreenshots?.mobile ? 'Inspected' : 'None'}
                </span>
                <span className="status-pill" style={{ marginLeft: 'auto' }}>
                  {(criticReport.inspectedScreenshots?.desktop || criticReport.inspectedScreenshots?.mobile)
                    ? `Visually Grounded (${(criticReport.inspectedScreenshots.desktop ? 1 : 0) + (criticReport.inspectedScreenshots.mobile ? 1 : 0)} shots)`
                    : 'Architectural Spec Review'}
                </span>
              </div>

              <div className="critic-summary-card">
                <div className="critic-summary-header">
                  <ShieldCheck size={24} className="success-icon" />
                  <div>
                    <span className="eyebrow">EXECUTIVE DESIGN CRITIQUE</span>
                    <h3>Architectural & Visual Assessment</h3>
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {cat.evidenceLevel === 'visually_verified' && (
                          <span className="evidence-badge evidence-verified">Visually Verified</span>
                        )}
                        {cat.evidenceLevel === 'architecture_inference' && (
                          <span className="evidence-badge evidence-inference">Architecture Inferred</span>
                        )}
                        {cat.evidenceLevel === 'insufficient_evidence' && (
                          <span className="evidence-badge evidence-insufficient">Insufficient Evidence</span>
                        )}
                        <span className="cat-score">
                          {cat.score !== null && cat.score !== undefined ? `${cat.score}/100` : 'Unevaluated'}
                        </span>
                      </div>
                    </div>

                    {cat.visualObservations && cat.visualObservations.length > 0 && (
                      <div className="visual-obs-section">
                        <span className="section-tag">Visual Observations (from Screenshots):</span>
                        <ul>
                          {cat.visualObservations.map((obs, oIdx) => (
                            <li key={oIdx}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}

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
