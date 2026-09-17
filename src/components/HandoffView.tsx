import React, { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, PackageOpen, ShoppingBag, Box, RefreshCw } from 'lucide-react';
import type { ExportTarget, Project } from '@shared/project';
import { generateProjectExport, validateProjectExport, type ExportValidationResult } from '../data/exportClient';

export interface HandoffViewProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
}

type SupportedExportTarget = 'wordpress' | 'react' | 'shopify';

const EXPORT_INFO: Record<SupportedExportTarget, { name: string; description: string; icon: React.ComponentType<{ size?: number }> }> = {
  wordpress: {
    name: 'WordPress Block Theme ZIP',
    description: 'Installable WordPress theme with generated page templates, design tokens and production-safe section markup.',
    icon: PackageOpen,
  },
  react: {
    name: 'React Source ZIP',
    description: 'Standalone Vite + React + TypeScript source package using the same Natanel Studio renderer and project data.',
    icon: Box,
  },
  shopify: {
    name: 'Shopify Theme ZIP',
    description: 'Online Store 2.0 theme with project sections plus native product, collection and cart templates.',
    icon: ShoppingBag,
  },
};

export function HandoffView({ project, onUpdateProject }: HandoffViewProps) {
  const targets = useMemo<SupportedExportTarget[]>(() =>
    project.projectType === 'shopify' ? ['shopify'] : ['wordpress', 'react'],
  [project.projectType]);

  const [validationByTarget, setValidationByTarget] = useState<Partial<Record<SupportedExportTarget, ExportValidationResult>>>({});
  const [workingTarget, setWorkingTarget] = useState<SupportedExportTarget | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const validate = async (target: SupportedExportTarget) => {
    setWorkingTarget(target);
    setMessage(null);
    try {
      const result = await validateProjectExport(project, target as ExportTarget);
      setValidationByTarget((current) => ({ ...current, [target]: result }));
      setMessage(result.valid ? `${EXPORT_INFO[target].name} is export-ready.` : `Resolve ${result.issues.filter((issue) => issue.severity === 'error').length} blocking issue(s) before export.`);
      return result;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Export validation failed.');
      return null;
    } finally {
      setWorkingTarget(null);
    }
  };

  const exportArtifact = async (target: SupportedExportTarget) => {
    setWorkingTarget(target);
    setMessage(null);
    try {
      const validation = await validateProjectExport(project, target as ExportTarget);
      setValidationByTarget((current) => ({ ...current, [target]: validation }));
      if (!validation.valid) {
        setMessage('Export blocked until the red validation issues are fixed.');
        return;
      }
      const result = await generateProjectExport(project, target as ExportTarget);
      onUpdateProject({
        ...project,
        status: 'exported',
        exportConfig: {
          target: target as ExportTarget,
          status: 'complete',
          settings: {
            ...project.exportConfig.settings,
            lastArtifactName: result.filename,
            lastExportedAt: new Date().toISOString(),
            warnings: result.warnings,
          },
        },
        updatedAt: new Date().toISOString(),
      });
      setMessage(`${result.filename} generated and downloaded${result.warnings ? ` with ${result.warnings} warning(s)` : ''}.`);
    } catch (error) {
      const typed = error as Error & { validation?: ExportValidationResult };
      if (typed.validation) setValidationByTarget((current) => ({ ...current, [target]: typed.validation }));
      setMessage(typed.message || 'Export generation failed.');
    } finally {
      setWorkingTarget(null);
    }
  };

  return (
    <div className="handoff-view">
      <div className="section-intro">
        <div>
          <span className="eyebrow">STAGE 07 / EXPORT</span>
          <h2>Validated client delivery.</h2>
          <p className="section-description">
            Natanel Studio checks canonical components, truthful content, missing assets and project compatibility before generating a deliverable ZIP.
          </p>
        </div>
      </div>

      {message && <div style={{ marginBottom: 18, padding: '10px 12px', border: '1px solid #2b3a55', background: '#111a2b', color: '#c7d7ff', fontSize: 12 }}>{message}</div>}

      <div className="handoff-grid">
        {targets.map((target) => {
          const info = EXPORT_INFO[target];
          const validation = validationByTarget[target];
          const errors = validation?.issues.filter((issue) => issue.severity === 'error') || [];
          const warnings = validation?.issues.filter((issue) => issue.severity === 'warning') || [];
          const Icon = info.icon;
          const busy = workingTarget === target;

          return (
            <article className="handoff-card" key={target} style={{ alignItems: 'flex-start', gap: 14 }}>
              <div className="handoff-icon"><Icon size={20} /></div>
              <div style={{ flex: 1 }}>
                <h3>{info.name}</h3>
                <p>{info.description}</p>

                {validation && (
                  <div style={{ marginTop: 10, display: 'grid', gap: 6 }}>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11 }}>
                      <span style={{ color: errors.length ? '#f87171' : '#4ade80' }}>{errors.length ? `${errors.length} blocking` : 'No blockers'}</span>
                      <span style={{ color: warnings.length ? '#fbbf24' : '#71717a' }}>{warnings.length} warning(s)</span>
                    </div>
                    {validation.issues.slice(0, 6).map((issue, index) => (
                      <div key={`${issue.code}-${index}`} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 10.5, color: issue.severity === 'error' ? '#fca5a5' : '#fcd34d' }}>
                        {issue.severity === 'error' ? <AlertTriangle size={12} /> : <CheckCircle2 size={12} />}
                        <span>{issue.message}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  <button className="secondary-button" disabled={busy} onClick={() => validate(target)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    {busy ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={12} />} Validate
                  </button>
                  <button className="primary-button" disabled={busy || Boolean(validation && !validation.valid)} onClick={() => exportArtifact(target)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
                    <Download size={12} /> Generate ZIP
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      <div style={{ marginTop: 22, padding: 14, border: '1px solid #24242a', background: '#111114', fontSize: 11, color: '#8f8f97' }}>
        Managed deployment is intentionally not shown until a hosting provider is connected. Exported projects never include Gemini API keys or server secrets.
      </div>
    </div>
  );
}
