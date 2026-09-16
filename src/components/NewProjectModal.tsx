import React, { useState } from 'react';
import { createEmptyProject, type Project, type ProjectType } from '@shared/project';
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
  const [language, setLanguage] = useState('English');
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = `proj-${Date.now()}`;
    const newProj = createEmptyProject(id, projectType, name || 'Bespoke Atelier Project');
    newProj.business.businessName = name || 'Bespoke Atelier';
    newProj.business.industry = industry || 'Architecture & Design';
    newProj.business.language = language;
    newProj.business.direction = direction;
    onCreate(newProj);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-window" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Create New Studio Project</h3>
          <button className="close-button" onClick={onClose}><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="field-group">
              <label>Project Architecture</label>
              <div className="choice-pill-group">
                <button
                  type="button"
                  className={`choice-pill ${projectType === 'business_website' ? 'active' : ''}`}
                  onClick={() => setProjectType('business_website')}
                >
                  <MonitorSmartphone size={14} /> Bespoke Business Website
                </button>
                <button
                  type="button"
                  className={`choice-pill ${projectType === 'shopify' ? 'active' : ''}`}
                  onClick={() => setProjectType('shopify')}
                >
                  <ShoppingBag size={14} /> Shopify Store (Liquid OS 2.0)
                </button>
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
                <label>Language</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />
              </div>

              <div className="field-group">
                <label>Text Direction</label>
                <div className="choice-pill-group">
                  <button
                    type="button"
                    className={`choice-pill ${direction === 'ltr' ? 'active' : ''}`}
                    onClick={() => setDirection('ltr')}
                  >
                    LTR
                  </button>
                  <button
                    type="button"
                    className={`choice-pill ${direction === 'rtl' ? 'active' : ''}`}
                    onClick={() => setDirection('rtl')}
                  >
                    RTL (Hebrew)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="secondary-button" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="primary-button">
              Initialize Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
