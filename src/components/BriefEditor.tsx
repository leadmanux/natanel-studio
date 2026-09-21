import React, { useEffect, useState } from 'react';
import type { Project } from '@shared/project';
import {
  PROJECT_TYPE_DEFAULTS,
  directionForLanguage,
  normalizeStudioLanguage,
  type SupportedStudioLanguage,
} from '@shared/projectDefaults';
import {
  ArrowRight,
  Building,
  Check,
  Globe,
  MonitorSmartphone,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Target,
} from 'lucide-react';

interface BriefEditorProps {
  project: Project;
  onUpdate: (updated: Project) => void;
  onProceedToDesign: () => void;
}

export function BriefEditor({ project, onUpdate, onProceedToDesign }: BriefEditorProps) {
  const defaults = PROJECT_TYPE_DEFAULTS[project.projectType];
  const [businessName, setBusinessName] = useState(project.business.businessName || '');
  const [industry, setIndustry] = useState(project.business.industry || '');
  const [description, setDescription] = useState(project.business.description || '');
  const [targetAudience, setTargetAudience] = useState(project.business.targetAudience || '');
  const [primaryGoal, setPrimaryGoal] = useState(project.business.primaryGoal || defaults.primaryGoal);
  const [language, setLanguage] = useState<SupportedStudioLanguage>(
    normalizeStudioLanguage(project.business.language)
  );
  const [contentDensity, setContentDensity] = useState<'spacious' | 'balanced' | 'compact' | 'editorial'>(
    project.brand.contentDensity || defaults.contentDensity
  );
  const [refUrlInput, setRefUrlInput] = useState('');
  const [referenceSites, setReferenceSites] = useState<string[]>(project.brand.referenceSites || []);
  const [colorsInput, setColorsInput] = useState(
    project.brand.colors.length > 0 ? project.brand.colors.join(', ') : ''
  );
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setBusinessName(project.business.businessName || '');
    setIndustry(project.business.industry || '');
    setDescription(project.business.description || '');
    setTargetAudience(project.business.targetAudience || '');
    setPrimaryGoal(project.business.primaryGoal || defaults.primaryGoal);
    setLanguage(normalizeStudioLanguage(project.business.language));
    setContentDensity(project.brand.contentDensity || defaults.contentDensity);
    setReferenceSites(project.brand.referenceSites || []);
    setColorsInput(project.brand.colors.length > 0 ? project.brand.colors.join(', ') : '');
  }, [project.id, project.projectType]);

  const handleSave = () => {
    const parsedColors = colorsInput
      .split(',')
      .map((color) => color.trim())
      .filter(Boolean);

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
        primaryGoal: primaryGoal || defaults.primaryGoal,
        language,
        direction: directionForLanguage(language),
      },
      brand: {
        ...project.brand,
        ecommerceMode: defaults.ecommerceMode,
        contentDensity,
        colors: parsedColors,
        referenceSites,
      },
      strategy: {
        ...project.strategy,
        primaryCTA: project.strategy.primaryCTA || defaults.primaryCTA,
        secondaryCTA: project.strategy.secondaryCTA || defaults.secondaryCTA,
      },
      exportConfig: {
        ...project.exportConfig,
        target: defaults.exportTarget,
      },
    };

    onUpdate(updated);
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 1800);
  };

  const handleAddRefSite = () => {
    const raw = refUrlInput.trim();
    if (!raw) return;
    const url = raw.startsWith('http') ? raw : `https://${raw}`;
    if (!referenceSites.includes(url)) setReferenceSites([...referenceSites, url]);
    setRefUrlInput('');
  };

  const handleContinue = () => {
    handleSave();
    onProceedToDesign();
  };

  return (
    <div className="brief-editor guided-step">
      <div className="guided-step-header">
        <div>
          <div className="step-kicker">STEP 1 OF 6 · PROJECT SETUP</div>
          <h2>Tell Natanel Studio what you are building.</h2>
          <p>
            Fill in the essentials. Everything technical is preconfigured from your project type and language.
          </p>
        </div>
        <div className="action-row">
          <button className="secondary-button" onClick={handleSave}>
            {isSaved ? <><Check size={14} /> Saved</> : 'Save'}
          </button>
          <button className="primary-button" onClick={handleContinue}>
            Continue to Design <ArrowRight size={15} />
          </button>
        </div>
      </div>

      <div className="setup-summary">
        <div className="setup-summary-icon">
          {project.projectType === 'shopify' ? <ShoppingBag size={20} /> : <MonitorSmartphone size={20} />}
        </div>
        <div>
          <strong>{defaults.label}</strong>
          <span>{defaults.shortDescription}</span>
        </div>
        <div className="setup-summary-meta">
          <span>Goal: {defaults.primaryGoal}</span>
          <span>Export: {defaults.exportTarget === 'shopify' ? 'Shopify Theme' : 'WordPress'}</span>
          <span>{language} · {directionForLanguage(language).toUpperCase()}</span>
        </div>
      </div>

      <div className="simple-form-stack">
        <section className="form-card setup-card">
          <div className="card-header-line">
            <Building size={16} />
            <div>
              <h3>Business Basics</h3>
              <span className="card-help">The information the AI needs before it can design intelligently.</span>
            </div>
          </div>

          <div className="two-col-fields">
            <div className="field-group">
              <label>Business Name</label>
              <input
                type="text"
                placeholder="e.g. KlearSkin, Cohen Kitchens, Nadlan Israel"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Industry</label>
              <input
                type="text"
                placeholder={project.projectType === 'shopify' ? 'e.g. Skincare, Fashion, Home Decor' : 'e.g. Contractor, Clinic, Real Estate'}
                value={industry}
                onChange={(event) => setIndustry(event.target.value)}
              />
            </div>
          </div>

          <div className="field-group">
            <label>What does the business do?</label>
            <textarea
              rows={3}
              placeholder="A simple description is enough. Explain the offer and what makes the business different."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="two-col-fields">
            <div className="field-group">
              <label>Target Customer</label>
              <input
                type="text"
                placeholder="Who should this website convince?"
                value={targetAudience}
                onChange={(event) => setTargetAudience(event.target.value)}
              />
            </div>
            <div className="field-group">
              <label>Main Goal</label>
              <input
                type="text"
                placeholder={defaults.primaryGoal}
                value={primaryGoal}
                onChange={(event) => setPrimaryGoal(event.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="form-card setup-card">
          <div className="card-header-line">
            <Globe size={16} />
            <div>
              <h3>Language</h3>
              <span className="card-help">Direction is automatic. Hebrew = RTL, English = LTR.</span>
            </div>
          </div>

          <div className="language-select-row">
            <div className="field-group">
              <label>Website Language</label>
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value as SupportedStudioLanguage)}
              >
                <option value="English">English</option>
                <option value="Hebrew">Hebrew</option>
              </select>
            </div>
            <div className="auto-setting-box">
              <strong>{directionForLanguage(language).toUpperCase()}</strong>
              <span>{language === 'Hebrew' ? 'RTL is enabled automatically.' : 'LTR is enabled automatically.'}</span>
            </div>
          </div>
        </section>

        <details className="advanced-settings">
          <summary>
            <span><SlidersHorizontal size={15} /> Optional brand references & advanced settings</span>
            <small>You can skip this and let Design Brain decide.</small>
          </summary>
          <div className="advanced-settings-body">
            <div className="field-group">
              <label>Content Density</label>
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

            <div className="field-group">
              <label>Reference Website</label>
              <div className="inline-add-row">
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={refUrlInput}
                  onChange={(event) => setRefUrlInput(event.target.value)}
                  onKeyDown={(event) => event.key === 'Enter' && (event.preventDefault(), handleAddRefSite())}
                />
                <button type="button" className="secondary-button" onClick={handleAddRefSite}>Add</button>
              </div>
              {referenceSites.length > 0 && (
                <div className="tag-list">
                  {referenceSites.map((site) => (
                    <span key={site} className="site-tag">
                      {site}
                      <button type="button" onClick={() => setReferenceSites(referenceSites.filter((item) => item !== site))}>×</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="field-group">
              <label>Brand Colors (optional)</label>
              <input
                type="text"
                value={colorsInput}
                onChange={(event) => setColorsInput(event.target.value)}
                placeholder="#111111, #F5F1EA, #B69A6A"
              />
              {colorsInput.trim() && (
                <div className="palette-preview-strip">
                  {colorsInput
                    .split(',')
                    .map((color) => color.trim())
                    .filter((color) => color.startsWith('#'))
                    .map((hex, index) => (
                      <div key={index} className="palette-swatch-mini" style={{ backgroundColor: hex }} title={hex} />
                    ))}
                </div>
              )}
            </div>
          </div>
        </details>
      </div>

      <div className="guided-bottom-bar">
        <div>
          <Target size={16} />
          <span>Next: Design Brain creates the visual direction and site structure.</span>
        </div>
        <button className="primary-button" onClick={handleContinue}>
          Continue to Design <Sparkles size={15} />
        </button>
      </div>
    </div>
  );
}
