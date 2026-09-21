import React, { useState } from 'react';
import type { Project, ProjectType } from '@shared/project';
import {
  createProjectWithDefaults,
  directionForLanguage,
  PROJECT_TYPE_DEFAULTS,
  type SupportedStudioLanguage,
} from '@shared/projectDefaults';
import { MonitorSmartphone, ShoppingBag, X } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (project: Project) => void;
}

export function NewProjectModal({ isOpen, onClose, onCreate }: NewProjectModalProps) {
  const [projectType, setProjectType] = useState<ProjectType>('business_website');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [language, setLanguage] = useState<SupportedStudioLanguage>('English');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `proj-${Date.now()}`;
    const fallbackName = projectType === 'shopify' ? 'New Shopify Store' : 'New Business Website';
    const newProj = createProjectWithDefaults(id, projectType, name || fallbackName, language);
    newProj.business.businessName = name || fallbackName;
    newProj.business.industry = industry.trim();
    onCreate(newProj);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div><div className="eyebrow">STEP 1 / PROJECT SETUP</div><h3>Create a New Project</h3></div>
          <button className="close-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p className="modal-subtitle">Choose what you are building. Natanel Studio will preload the right conversion and export defaults.</p>

            <div className="field-group">
              <label>What are you building?</label>
              <div className="project-type-grid">
                <button
                  type="button"
                  className={`project-type-card ${projectType === 'business_website' ? 'active' : ''}`}
                  onClick={() => setProjectType('business_website')}
                >
                  <MonitorSmartphone size={20} />
                  <strong>Business Website</strong>
                  <span>Services, lead generation, portfolio or company site.</span>
                  <small>Default export: WordPress</small>
                </button>
                <button
                  type="button"
                  className={`project-type-card ${projectType === 'shopify' ? 'active' : ''}`}
                  onClick={() => setProjectType('shopify')}
                >
                  <ShoppingBag size={20} />
                  <strong>Shopify Store</strong>
                  <span>Products, collections, cart and native Shopify checkout.</span>
                  <small>Default export: Shopify Theme</small>
                </button>
              </div>
              <div className="default-summary">
                <strong>Preloaded:</strong> {PROJECT_TYPE_DEFAULTS[projectType].primaryGoal} · {PROJECT_TYPE_DEFAULTS[projectType].contentDensity} layout · {PROJECT_TYPE_DEFAULTS[projectType].primaryCTA}
              </div>
            </div>

            <div className="field-group">
              <label>Project / Business Name</label>
              <input
                type="text"
                placeholder="e.g. Kanso Architecture, Atelier Vesper"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="field-group">
              <label>Industry</label>
              <input
                type="text"
                placeholder="e.g. Luxury Real Estate, Interior Architecture, Legal Advisory"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </div>

            <div className="two-col-fields">
              <div className="field-group">
                <label>Website Language</label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as SupportedStudioLanguage)}
                >
                  <option value="English">English</option>
                  <option value="Hebrew">Hebrew</option>
                </select>
              </div>

              <div className="field-group">
                <label>Layout Direction</label>
                <div className="auto-setting-box">
                  <strong>{directionForLanguage(language).toUpperCase()}</strong>
                  <span>{language === 'Hebrew' ? 'Hebrew automatically enables RTL.' : 'English automatically uses LTR.'}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
