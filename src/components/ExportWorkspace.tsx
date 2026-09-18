import React, { useCallback, useEffect, useState } from 'react';
import type { Project } from '../../shared/project';
import type { ExportResult, ExportTarget, ExportValidation } from '../../shared/exportTypes';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  Download,
  Layers,
  RefreshCw,
  Store,
  XCircle,
} from 'lucide-react';

export interface ExportWorkspaceProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBuilder?: (pageId?: string, sectionId?: string) => void;
}

export function ExportWorkspace({ project, onNavigateToBuilder }: ExportWorkspaceProps) {
  const [selectedTarget, setSelectedTarget] = useState<Extract<ExportTarget, 'wordpress' | 'react' | 'shopify'>>(
    project.projectType === 'shopify' ? 'shopify' : 'wordpress'
  );
  const [validation, setValidation] = useState<ExportValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runValidation = useCallback(async (target = selectedTarget) => {
    setIsValidating(true);
    setError(null);
    try {
      const response = await fetch('/api/export/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project, target }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || `Validation request failed (${response.status}).`);
      }
      const payload = await response.json();
      setValidation(payload.validation);
    } catch (validationError) {
      setValidation(null);
      setError(
        validationError instanceof Error
          ? `Canonical server validation is unavailable: ${validationError.message}`
          : 'Canonical server validation is unavailable.'
      );
    } finally {
      setIsValidating(false);
    }
  }, [project, selectedTarget]);

  useEffect(() => {
    const preferredTarget: Extract<ExportTarget, 'wordpress' | 'react' | 'shopify'> =
      project.projectType === 'shopify' ? 'shopify' : 'wordpress';
    if (
      (project.projectType === 'shopify' && selectedTarget !== 'shopify') ||
      (project.projectType === 'business_website' && selectedTarget === 'shopify')
    ) {
      setSelectedTarget(preferredTarget);
      setValidation(null);
      setExportResult(null);
      return;
    }
    runValidation(selectedTarget);
  }, [project.id, project.projectType, runValidation, selectedTarget]);

  const handleExport = async () => {
    if (!validation?.valid) return;
    setIsExporting(true);
    setError(null);
    setExportResult(null);
    try {
      const response = await fetch(`/api/export/${selectedTarget}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });
      const payload: ExportResult = await response.json();
      if (!response.ok || !payload.success) {
        if (payload.validation) setValidation(payload.validation);
        throw new Error(payload.message || `Export failed (${response.status}).`);
      }
      setExportResult(payload);
      setValidation(payload.validation);
      if (payload.downloadUrl) {
        const anchor = document.createElement('a');
        anchor.href = payload.downloadUrl;
        anchor.download = payload.filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
      }
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'Export failed.');
    } finally {
      setIsExporting(false);
    }
  };

  const blockingIssues = validation?.issues.filter((issue) => issue.severity === 'error') || [];
  const warnings = validation?.issues.filter((issue) => issue.severity === 'warning') || [];
  const exportDisabled = !validation?.valid || isValidating || isExporting;

  return (
    <div className="workspace-card" style={{ padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'flex-start', marginBottom: 26 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: '.08em', color: '#71717a', fontWeight: 700 }}>HANDOFF</div>
          <h2 style={{ margin: '6px 0 6px', fontSize: 24 }}>Export Engine V1</h2>
          <p style={{ margin: 0, color: '#8b8b93', maxWidth: 720, lineHeight: 1.55, fontSize: 13 }}>
            Production exports are validated against the server-canonical component registry before a ZIP can be generated.
          </p>
        </div>
        <button
          onClick={() => runValidation(selectedTarget)}
          disabled={isValidating}
          className="secondary-button"
          style={{ display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <RefreshCw size={14} /> {isValidating ? 'Validating…' : 'Validate'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14, marginBottom: 24 }}>
        <TargetCard
          selected={selectedTarget === 'wordpress'}
          title="WordPress Block Theme"
          description="Recommended business-site handoff. Site Editor compatible, no Elementor required."
          icon={<Layers size={21} />}
          badge="Business"
          disabled={project.projectType !== 'business_website'}
          onClick={() => setSelectedTarget('wordpress')}
        />
        <TargetCard
          selected={selectedTarget === 'react'}
          title="React Source"
          description="Standalone Vite/React source with localized assets and no Studio runtime APIs."
          icon={<Code2 size={21} />}
          badge="Developer"
          disabled={project.projectType !== 'business_website'}
          onClick={() => setSelectedTarget('react')}
        />
        <TargetCard
          selected={selectedTarget === 'shopify'}
          title="Shopify Theme"
          description="Online Store 2.0 ZIP with native product, collection, cart and theme-editor sections."
          icon={<Store size={21} />}
          badge="Commerce"
          disabled={project.projectType !== 'shopify'}
          onClick={() => setSelectedTarget('shopify')}
        />
      </div>

      {error && (
        <div style={{ marginBottom: 18, border: '1px solid #5c2525', background: '#221313', color: '#f0aaaa', borderRadius: 6, padding: 12, fontSize: 12 }}>
          {error}
        </div>
      )}

      <div style={{ border: '1px solid #27272c', background: '#121216', borderRadius: 7, padding: 20, marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: blockingIssues.length || warnings.length ? 14 : 0 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {validation?.valid ? <CheckCircle2 size={18} color="#4ade80" /> : <XCircle size={18} color="#f87171" />}
            <strong style={{ fontSize: 13 }}>
              {isValidating ? 'Validating…' : validation ? (validation.valid ? 'Ready to export' : `${blockingIssues.length} blocking issue${blockingIssues.length === 1 ? '' : 's'}`) : 'Waiting for canonical validation'}
            </strong>
          </div>
          {validation && <span style={{ fontSize: 11, color: '#777780' }}>{warnings.length} warning{warnings.length === 1 ? '' : 's'}</span>}
        </div>

        {!!blockingIssues.length && (
          <div style={{ display: 'grid', gap: 8 }}>
            {blockingIssues.map((issue, index) => (
              <div key={`${issue.code}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', borderTop: '1px solid #24242a', paddingTop: 9 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#f3c1c1', fontSize: 12 }}><XCircle size={14} style={{ marginTop: 1, flexShrink: 0 }} />{issue.message}</div>
                {(issue.pageId || issue.sectionId) && onNavigateToBuilder && (
                  <button onClick={() => onNavigateToBuilder(issue.pageId, issue.sectionId)} className="secondary-button" style={{ whiteSpace: 'nowrap', fontSize: 10 }}>Open in Builder</button>
                )}
              </div>
            ))}
          </div>
        )}

        {!!warnings.length && (
          <div style={{ display: 'grid', gap: 7, marginTop: blockingIssues.length ? 14 : 0 }}>
            {warnings.map((issue, index) => (
              <div key={`${issue.code}-warning-${index}`} style={{ display: 'flex', gap: 8, color: '#d8bd83', fontSize: 11 }}><AlertTriangle size={13} />{issue.message}</div>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, alignItems: 'center', borderTop: '1px solid #24242a', paddingTop: 20 }}>
        <div style={{ fontSize: 11, color: '#777780' }}>
          {exportResult?.success ? `Generated ${exportResult.filename}` : 'ZIP generation happens server-side only after validation passes.'}
        </div>
        <button
          onClick={handleExport}
          disabled={exportDisabled}
          style={{ border: 0, borderRadius: 5, padding: '10px 15px', background: exportDisabled ? '#2a2a2f' : '#2563eb', color: exportDisabled ? '#66666d' : '#fff', cursor: exportDisabled ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 7 }}
        >
          <Download size={14} /> {isExporting ? 'Generating…' : `Export ${selectedTarget === 'wordpress' ? 'WordPress' : selectedTarget === 'react' ? 'React' : 'Shopify'} ZIP`}
        </button>
      </div>
    </div>
  );
}

function TargetCard({ selected, title, description, icon, badge, onClick, disabled = false }: { selected: boolean; title: string; description: string; icon: React.ReactNode; badge: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ textAlign: 'left', color: '#e4e4e7', border: selected ? '2px solid #4f7de0' : '1px solid #29292f', background: selected ? '#151a25' : '#121216', borderRadius: 7, padding: 20, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? .45 : 1 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 13 }}><span style={{ color: '#7da6ff' }}>{icon}</span><span style={{ fontSize: 10, color: selected ? '#9dbaff' : '#777780' }}>{badge.toUpperCase()}</span></div>
      <strong style={{ display: 'block', fontSize: 14 }}>{title}</strong>
      <span style={{ display: 'block', marginTop: 6, color: '#8a8a92', fontSize: 12, lineHeight: 1.45 }}>{description}</span>
    </button>
  );
}
