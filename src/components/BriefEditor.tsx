import React, { useState } from 'react';
import type { Project } from '@shared/project';
import { Globe, ArrowRightLeft, Target, Sparkles, Building, Layers, Check } from 'lucide-react';

interface BriefEditorProps {
  project: Project;
  onUpdate: (updated: Project) => void;
  onProceedToDesign: () => void;
}

export function BriefEditor({ project, onUpdate, onProceedToDesign }: BriefEditorProps) {
  const [businessName, setBusinessName] = useState(project.business.businessName || '');
  const [industry, setIndustry] = useState(project.business.industry || '');
  const [description, setDescription] = useState(project.business.description || '');
  const [targetAudience, setTargetAudience] = useState(project.business.targetAudience || '');
  const [primaryGoal, setPrimaryGoal] = useState(project.business.primaryGoal || '');
  const [language, setLanguage] = useState(project.business.language || 'English');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>(project.business.direction || 'ltr');
  const [contentDensity, setContentDensity] = useState<'spacious' | 'balanced' | 'compact' | 'editorial'>(
    project.brand.contentDensity || 'spacious'
  );
  const [ecommerceMode, setEcommerceMode] = useState<'ecommerce' | 'lead_generation'>(
    project.brand.ecommerceMode || (project.projectType === 'shopify' ? 'ecommerce' : 'lead_generation')
  );
  const [refUrlInput, setRefUrlInput] = useState('');
  const [referenceSites, setReferenceSites] = useState<string[]>(
    project.brand.referenceSites.length > 0
      ? project.brand.referenceSites
      : ['https://linear.app', 'https://kyle.works']
  );
  const [colorsInput, setColorsInput] = useState(
    project.brand.colors.length > 0 ? project.brand.colors.join(', ') : '#0d0d0f, #161619, #e8e6e1, #b3aba0'
  );
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    const parsedColors = colorsInput
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    const updated: Project = {
      ...project,
      name: businessName || project.name,
      updatedAt: new Date().toISOString(),
      business: {
        ...project.business,
        businessName,
        industry,
        description,
        targetAudience,
        primaryGoal,
        language,
        direction,
      },
      brand: {
        ...project.brand,
        colors: parsedColors,
        referenceSites,
        contentDensity,
        ecommerceMode,
      },
    };

    onUpdate(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleAddRefSite = () => {
    if (!refUrlInput.trim()) return;
    const url = refUrlInput.trim().startsWith('http') ? refUrlInput.trim() : `https://${refUrlInput.trim()}`;
    if (!referenceSites.includes(url)) {
      setReferenceSites([...referenceSites, url]);
    }
    setRefUrlInput('');
  };

  const handleRemoveRefSite = (url: string) => {
    setReferenceSites(referenceSites.filter((s) => s !== url));
  };

  return (
    <div className="brief-editor">
      <div className="section-intro">
        <div>
          <span className="eyebrow">STAGE 01 / BRIEF</span>
          <h2>Strategic Foundation & Brand Calibration</h2>
          <p className="section-description">
            Calibrate business parameters, target audience, conversion goals, and language orientation. The Art
            Director and Component Engine will directly synthesize these variables.
          </p>
        </div>
        <div className="action-row">
          <button className="secondary-button" onClick={handleSave}>
            {isSaved ? <><Check size={14} /> Saved</> : 'Save Brief'}
          </button>
          <button className="primary-button" onClick={() => { handleSave(); onProceedToDesign(); }}>
            Proceed to Design Brain <Sparkles size={15} />
          </button>
        </div>
      </div>

      <div className="form-grid">
        {/* Left Column: Business & Market */}
        <div className="form-column">
          <div className="form-card">
            <div className="card-header-line">
              <Building size={16} />
              <h3>Business Profile</h3>
            </div>

            <div className="field-group">
              <label>Business Name</label>
              <input
                type="text"
                placeholder="e.g. Studio Natanel, Kanso Architecture, Atelier Vesper"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Industry / Specialization</label>
              <input
                type="text"
                placeholder="e.g. Architecture, Luxury Interiors, Strategic Advisory, Fine Commerce"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Business Essence & Positioning</label>
              <textarea
                rows={3}
                placeholder="Describe what makes this brand unique, their core philosophy, and standard of craft."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Target Audience</label>
              <input
                type="text"
                placeholder="e.g. Discerning high-net-worth homeowners, enterprise executives, design-conscious buyers"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </div>

          <div className="form-card">
            <div className="card-header-line">
              <Target size={16} />
              <h3>Conversion Intent & Business Model</h3>
            </div>

            <div className="field-group">
              <label>Primary Conversion Goal</label>
              <input
                type="text"
                placeholder="e.g. High-intent qualified consultation intake, Direct portfolio commission, Direct cart checkout"
                value={primaryGoal}
                onChange={(e) => setPrimaryGoal(e.target.value)}
              />
            </div>

            <div className="field-group">
              <label>Transaction Archetype</label>
              <div className="choice-pill-group">
                <button
                  type="button"
                  className={`choice-pill ${ecommerceMode === 'lead_generation' ? 'active' : ''}`}
                  onClick={() => setEcommerceMode('lead_generation')}
                >
                  High-Trust Lead Gen / Consultative
                </button>
                <button
                  type="button"
                  className={`choice-pill ${ecommerceMode === 'ecommerce' ? 'active' : ''}`}
                  onClick={() => setEcommerceMode('ecommerce')}
                >
                  Editorial E-Commerce / Direct Sale
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Direction, Density, References */}
        <div className="form-column">
          <div className="form-card">
            <div className="card-header-line">
              <ArrowRightLeft size={16} />
              <h3>Language & Spatial Orientation</h3>
            </div>

            <div className="two-col-fields">
              <div className="field-group">
                <label>Primary Language</label>
                <input
                  type="text"
                  placeholder="e.g. English, Hebrew, French, German"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Text Direction (First-Class RTL)</label>
                <div className="choice-pill-group">
                  <button
                    type="button"
                    className={`choice-pill ${direction === 'ltr' ? 'active' : ''}`}
                    onClick={() => setDirection('ltr')}
                  >
                    LTR (Left-to-Right)
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${direction === 'rtl' ? 'active' : ''}`}
                    onClick={() => setDirection('rtl')}
                  >
                    RTL (Hebrew / Arabic)
                  </button>
                </div>
              </div>
            </div>

            {direction === 'rtl' && (
              <div className="rtl-alert-box">
                <span className="rtl-badge">RTL ACTIVE</span>
                <p>
                  Components, visual anchors, typography line-heights, and icon mirroring will automatically align
                  for Hebrew reading ergonomics.
                </p>
              </div>
            )}

            <div className="field-group" style={{ marginTop: '16px' }}>
              <label>Content Density Philosophy</label>
              <div className="choice-pill-group">
                {(['spacious', 'balanced', 'compact', 'editorial'] as const).map((density) => (
                  <button
                    key={density}
                    type="button"
                    className={`choice-pill ${contentDensity === density ? 'active' : ''}`}
                    onClick={() => setContentDensity(density)}
                  >
                    {density.charAt(0).toUpperCase() + density.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header-line">
              <Globe size={16} />
              <h3>Brand References & Color Foundation</h3>
            </div>

            <div className="field-group">
              <label>Reference Websites for Design Language Extraction</label>
              <div className="inline-add-row">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={refUrlInput}
                  onChange={(e) => setRefUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddRefSite())}
                />
                <button type="button" className="secondary-button" onClick={handleAddRefSite}>
                  Add URL
                </button>
              </div>

              <div className="tag-list">
                {referenceSites.map((site) => (
                  <span key={site} className="site-tag">
                    {site}
                    <button type="button" onClick={() => handleRemoveRefSite(site)}>×</button>
                  </span>
                ))}
              </div>
            </div>

            <div className="field-group">
              <label>Palette Foundation (Hex values)</label>
              <input
                type="text"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="#0d0d0f, #161619, #e8e6e1, #b3aba0"
              />
              <div className="palette-preview-strip">
                {colorsInput
                  .split(',')
                  .map((c) => c.trim())
                  .filter((c) => c.startsWith('#'))
                  .map((hex, i) => (
                    <div key={i} className="palette-swatch-mini" style={{ backgroundColor: hex }} title={hex} />
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
