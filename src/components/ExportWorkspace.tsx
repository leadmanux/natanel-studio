import React, { useState, useEffect, useCallback } from 'react';
import type { Project } from '../../shared/project';
import type {
  ExportTarget,
  ExportValidation,
  ExportResult,
} from '../../shared/exportTypes';
import { validateProjectForExport } from '../../shared/exportValidation';
import {
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  Layers,
  Code2,
  Store,
  RefreshCw,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export interface ExportWorkspaceProps {
  project: Project;
  onUpdateProject?: (project: Project) => void;
  onNavigateToBuilder?: (pageId?: string, sectionId?: string) => void;
}

export function ExportWorkspace({
  project,
  onNavigateToBuilder,
}: ExportWorkspaceProps) {
  const [selectedTarget, setSelectedTarget] = useState<ExportTarget>('wordpress');
  const [validation, setValidation] = useState<ExportValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const runValidation = useCallback(
    async (target: ExportTarget = selectedTarget) => {
      setIsValidating(true);
      setExportError(null);
      try {
        // Try server validation endpoint first
        const res = await fetch('/api/export/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project, target }),
        });
        if (res.ok) {
          const data = await res.json();
          setValidation(data.validation);
        } else {
          // Fallback to client-side canonical validator
          setValidation(validateProjectForExport(project, target));
        }
      } catch {
        setValidation(validateProjectForExport(project, target));
      } finally {
        setIsValidating(false);
      }
    },
    [project, selectedTarget]
  );

  useEffect(() => {
    runValidation(selectedTarget);
  }, [selectedTarget, runValidation]);

  const handleExport = async () => {
    if (selectedTarget === 'shopify' || selectedTarget === 'managed') return;
    setIsExporting(true);
    setExportError(null);
    setExportResult(null);

    try {
      const endpoint =
        selectedTarget === 'wordpress' ? '/api/export/wordpress' : '/api/export/react';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project }),
      });

      const data: ExportResult = await res.json();

      if (!res.ok || !data.success) {
        setExportError(data.message || 'Export process failed. Review validation errors below.');
        if (data.validation) {
          setValidation(data.validation);
        }
      } else {
        setExportResult(data);
        if (data.validation) {
          setValidation(data.validation);
        }

        // Trigger browser download if downloadUrl is provided
        if (data.downloadUrl) {
          const link = document.createElement('a');
          link.href = data.downloadUrl;
          link.download = data.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Network error during export.');
    } finally {
      setIsExporting(false);
    }
  };

  const isExportDisabled =
    selectedTarget === 'shopify' ||
    selectedTarget === 'managed' ||
    isValidating ||
    isExporting ||
    (validation !== null && !validation.valid);

  return (
    <div className="workspace-card" style={{ padding: '32px' }}>
      {/* Workspace Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', borderBottom: '1px solid #242427', paddingBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Export Engine V1</h2>
            <span className="status-pill status-approved">Business Website</span>
            <span style={{ fontSize: '12px', color: '#888890', background: '#1c1c20', padding: '2px 8px', borderRadius: '4px' }}>
              {project.business.direction === 'rtl' ? 'Hebrew (RTL)' : 'English (LTR)'}
            </span>
          </div>
          <p style={{ margin: 0, color: '#888890', fontSize: '14px', maxWidth: '650px' }}>
            Transform your completed Natanel Studio site into a production deliverable. Output includes pure semantic code, design tokens, and local assets with zero runtime studio dependencies.
          </p>
        </div>

        <button
          onClick={() => runValidation(selectedTarget)}
          disabled={isValidating}
          className="secondary-button"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={14} className={isValidating ? 'spin' : ''} />
          <span>{isValidating ? 'Validating...' : 'Validate Project'}</span>
        </button>
      </div>

      {/* Target Selector Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '36px' }}>
        {/* WordPress Card */}
        <div
          onClick={() => setSelectedTarget('wordpress')}
          style={{
            border: selectedTarget === 'wordpress' ? '2px solid #5b8bf7' : '1px solid #27272b',
            background: selectedTarget === 'wordpress' ? '#141722' : '#121215',
            padding: '24px',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(91, 139, 247, 0.12)', display: 'grid', placeItems: 'center', color: '#5b8bf7' }}>
              <Layers size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#7bca8a', background: 'rgba(123, 202, 138, 0.1)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Primary / Recommended
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>WordPress Block Theme</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#909096', lineHeight: 1.5 }}>
            Editable WordPress block theme. No Elementor required.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#777780', background: '#1c1c20', padding: '2px 6px', borderRadius: '3px' }}>Full Site Editor</span>
            <span style={{ fontSize: '11px', color: '#777780', background: '#1c1c20', padding: '2px 6px', borderRadius: '3px' }}>theme.json tokens</span>
            <span style={{ fontSize: '11px', color: '#777780', background: '#1c1c20', padding: '2px 6px', borderRadius: '3px' }}>rtl.css included</span>
          </div>
        </div>

        {/* React Source Card */}
        <div
          onClick={() => setSelectedTarget('react')}
          style={{
            border: selectedTarget === 'react' ? '2px solid #5b8bf7' : '1px solid #27272b',
            background: selectedTarget === 'react' ? '#141722' : '#121215',
            padding: '24px',
            borderRadius: '8px',
            cursor: 'pointer',
            position: 'relative',
            transition: 'border-color 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(91, 139, 247, 0.12)', display: 'grid', placeItems: 'center', color: '#5b8bf7' }}>
              <Code2 size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#8d8d94', background: 'rgba(255, 255, 255, 0.05)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Developer Handoff
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600 }}>React Source (Vite)</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#909096', lineHeight: 1.5 }}>
            Standalone developer-ready React/Vite source.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#777780', background: '#1c1c20', padding: '2px 6px', borderRadius: '3px' }}>Vite + React 19</span>
            <span style={{ fontSize: '11px', color: '#777780', background: '#1c1c20', padding: '2px 6px', borderRadius: '3px' }}>TypeScript</span>
            <span style={{ fontSize: '11px', color: '#777780', background: '#1c1c20', padding: '2px 6px', borderRadius: '3px' }}>Zero studio APIs</span>
          </div>
        </div>

        {/* Shopify Card (Disabled / Coming next) */}
        <div
          style={{
            border: '1px solid #1f1f23',
            background: '#0d0d0f',
            padding: '24px',
            borderRadius: '8px',
            opacity: 0.6,
            cursor: 'not-allowed',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#18181c', display: 'grid', placeItems: 'center', color: '#686870' }}>
              <Store size={22} />
            </div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#e5b95c', background: 'rgba(229, 185, 92, 0.08)', padding: '3px 8px', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Coming next
            </span>
          </div>
          <h3 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 600, color: '#9999a0' }}>Shopify Theme</h3>
          <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#686870', lineHeight: 1.5 }}>
            Liquid templates and section schemas for Online Store 2.0.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            <span style={{ fontSize: '11px', color: '#55555c', background: '#161618', padding: '2px 6px', borderRadius: '3px' }}>Scheduled for V2</span>
          </div>
        </div>
      </div>

      {/* Validation Status & Issues Banner */}
      <div style={{ background: '#141417', border: '1px solid #26262a', borderRadius: '8px', padding: '24px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {validation?.valid ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#7bca8a' }}>
                <CheckCircle2 size={18} />
                <span style={{ fontWeight: 600, fontSize: '15px' }}>Pre-Export Validation Passed</span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#e56c6c' }}>
                <XCircle size={18} />
                <span style={{ fontWeight: 600, fontSize: '15px' }}>
                  {validation ? `${validation.errors.length} Issue(s) Blocking Export` : 'Validating project...'}
                </span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', fontSize: '12px' }}>
            <span style={{ color: validation?.errors.length ? '#e56c6c' : '#7bca8a' }}>
              Errors: <strong>{validation?.errors.length || 0}</strong>
            </span>
            <span style={{ color: validation?.warnings.length ? '#e5b95c' : '#8d8d94' }}>
              Warnings: <strong>{validation?.warnings.length || 0}</strong>
            </span>
          </div>
        </div>

        {/* Blocking Errors */}
        {validation?.issues && validation.issues.filter((i) => i.severity === 'error').length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e56c6c', marginBottom: '10px' }}>
              Blocking Requirements
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {validation.issues
                .filter((i) => i.severity === 'error')
                .map((issue, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(229, 108, 108, 0.05)',
                      border: '1px solid rgba(229, 108, 108, 0.15)',
                      padding: '10px 14px',
                      borderRadius: '6px',
                      gap: '16px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <XCircle size={15} style={{ color: '#e56c6c', flexShrink: 0 }} />
                      <span style={{ fontSize: '13px', color: '#f1d0d0' }}>{issue.message}</span>
                    </div>

                    {(issue.pageId || issue.sectionId) && onNavigateToBuilder && (
                      <button
                        onClick={() => onNavigateToBuilder(issue.pageId, issue.sectionId)}
                        className="secondary-button"
                        style={{ padding: '4px 10px', fontSize: '11.5px', whiteSpace: 'nowrap', flexShrink: 0 }}
                      >
                        <span>Open problem in Builder</span>
                        <ArrowRight size={12} />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Non-Blocking Warnings */}
        {validation?.warnings && validation.warnings.length > 0 && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#e5b95c', marginBottom: '10px' }}>
              Recommended Notices (Non-Blocking)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {validation.warnings.map((warning, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(229, 185, 92, 0.04)',
                    border: '1px solid rgba(229, 185, 92, 0.1)',
                    padding: '8px 12px',
                    borderRadius: '6px',
                  }}
                >
                  <AlertTriangle size={14} style={{ color: '#e5b95c', flexShrink: 0 }} />
                  <span style={{ fontSize: '12.5px', color: '#dcd4c0' }}>{warning}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Green */}
        {validation?.valid && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#8a8a92', fontSize: '13px' }}>
            <ShieldCheck size={18} style={{ color: '#7bca8a' }} />
            <span>
              All pages, canonical components, approved content, design tokens, and local assets have passed pre-export validation.
            </span>
          </div>
        )}
      </div>

      {/* Action / Export Trigger */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' }}>
        <div>
          <button
            onClick={handleExport}
            disabled={isExportDisabled}
            className="primary-button"
            style={{ padding: '12px 28px', fontSize: '14px' }}
          >
            {isExporting ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Generating {selectedTarget === 'wordpress' ? 'WordPress Theme' : 'React Project'} ZIP...</span>
              </>
            ) : (
              <>
                <Download size={16} />
                <span>Export {selectedTarget === 'wordpress' ? 'WordPress Block Theme ZIP' : 'React Source ZIP'}</span>
              </>
            )}
          </button>
        </div>

        {exportError && (
          <div style={{ color: '#e56c6c', fontSize: '13px' }}>
            {exportError}
          </div>
        )}
      </div>

      {/* Export Result Details Card */}
      {exportResult && exportResult.success && (
        <div
          style={{
            marginTop: '32px',
            padding: '24px',
            background: 'rgba(123, 202, 138, 0.06)',
            border: '1px solid rgba(123, 202, 138, 0.2)',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck size={20} style={{ color: '#7bca8a' }} />
              <div>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#f2f2ee' }}>
                  Deliverable Package Ready
                </h4>
                <div style={{ fontSize: '12px', color: '#8a8a92', marginTop: '2px' }}>
                  Generated at {new Date(exportResult.generatedAt).toLocaleTimeString()} &bull; File: <strong>{exportResult.filename}</strong>
                </div>
              </div>
            </div>

            {exportResult.downloadUrl && (
              <a
                href={exportResult.downloadUrl}
                download={exportResult.filename}
                className="primary-button"
                style={{ fontSize: '12.5px', padding: '8px 16px' }}
              >
                <Download size={14} />
                <span>Download Again</span>
              </a>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', background: '#0e0e11', padding: '16px', borderRadius: '6px', fontSize: '12px' }}>
            <div>
              <div style={{ color: '#777780' }}>Pages Packaged</div>
              <div style={{ fontWeight: 600, color: '#e2e2de', marginTop: '3px' }}>{exportResult.manifest.pages.length} Pages</div>
            </div>
            <div>
              <div style={{ color: '#777780' }}>Components Used</div>
              <div style={{ fontWeight: 600, color: '#e2e2de', marginTop: '3px' }}>{exportResult.manifest.componentIdsUsed.length} Components</div>
            </div>
            <div>
              <div style={{ color: '#777780' }}>Assets Localized</div>
              <div style={{ fontWeight: 600, color: '#e2e2de', marginTop: '3px' }}>{exportResult.manifest.assetIdsUsed.length} Assets</div>
            </div>
            <div>
              <div style={{ color: '#777780' }}>Typography</div>
              <div style={{ fontWeight: 600, color: '#e2e2de', marginTop: '3px' }}>
                {exportResult.manifest.designTokenSummary.fontDisplay} / {exportResult.manifest.designTokenSummary.fontBody}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
