import React, { useMemo, useState } from 'react';
import type { Project, ProjectFacts } from '@shared/project';

interface ProjectFactsEditorProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onClose: () => void;
}

type FactKey = keyof ProjectFacts;

const FACT_LABELS: Array<{ key: FactKey; label: string; hint: string }> = [
  { key: 'services', label: 'Services', hint: 'Only services the business actually offers.' },
  { key: 'products', label: 'Products', hint: 'Real product names, prices, specs and shipping notes.' },
  { key: 'portfolioProjects', label: 'Portfolio Projects', hint: 'Real projects/case studies only.' },
  { key: 'testimonials', label: 'Testimonials / Reviews', hint: 'Verified customer quotes and identities only.' },
  { key: 'metrics', label: 'Metrics / Results', hint: 'Quantified claims that can be substantiated.' },
  { key: 'certifications', label: 'Certifications', hint: 'Certifications, issuers and codes.' },
  { key: 'licenses', label: 'Licenses', hint: 'Professional or business license details.' },
  { key: 'guarantees', label: 'Guarantees', hint: 'Warranty/guarantee terms approved by the business.' },
  { key: 'process', label: 'Process', hint: 'Real delivery/service process steps.' },
  { key: 'reviewSummary', label: 'Review Summary', hint: 'Aggregate score/count/source only if verified.' },
  { key: 'shipping', label: 'Shipping', hint: 'Verified delivery time, shipping note and thresholds.' },
];

function formatValue(value: unknown): string {
  return JSON.stringify(value ?? null, null, 2);
}

export function ProjectFactsEditor({ project, onUpdateProject, onClose }: ProjectFactsEditorProps) {
  const [selectedKey, setSelectedKey] = useState<FactKey>('services');
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const item of FACT_LABELS) next[item.key] = formatValue(project.facts[item.key]);
    return next;
  });
  const [error, setError] = useState<string | null>(null);

  const selectedMeta = useMemo(
    () => FACT_LABELS.find((item) => item.key === selectedKey) || FACT_LABELS[0],
    [selectedKey]
  );

  const saveCurrent = () => {
    try {
      const parsed = JSON.parse(drafts[selectedKey]);
      const expectsArray = !['reviewSummary', 'shipping'].includes(selectedKey);
      if (expectsArray && !Array.isArray(parsed)) {
        throw new Error(`${selectedMeta.label} must be a JSON array.`);
      }
      if (!expectsArray && parsed !== null && (typeof parsed !== 'object' || Array.isArray(parsed))) {
        throw new Error(`${selectedMeta.label} must be a JSON object or null.`);
      }

      const facts: ProjectFacts = { ...project.facts, [selectedKey]: parsed } as ProjectFacts;
      onUpdateProject({ ...project, facts, updatedAt: new Date().toISOString() });
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,.76)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ width: 'min(980px, 96vw)', height: 'min(760px, 90vh)', background: '#111114', border: '1px solid #2b2b31', borderRadius: 8, display: 'grid', gridTemplateColumns: '240px 1fr', overflow: 'hidden' }}>
        <aside style={{ borderRight: '1px solid #242429', padding: 16, overflowY: 'auto' }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: '.08em', color: '#71717a', fontWeight: 700 }}>VERIFIED PROJECT FACTS</div>
            <p style={{ margin: '7px 0 0', fontSize: 11, lineHeight: 1.5, color: '#8b8b94' }}>
              These values are factual inputs. The Composer may use them but may never invent replacements.
            </p>
          </div>
          {FACT_LABELS.map((item) => (
            <button
              key={item.key}
              onClick={() => { setSelectedKey(item.key); setError(null); }}
              style={{ width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 4, borderRadius: 4, border: '1px solid transparent', background: selectedKey === item.key ? '#20232a' : 'transparent', color: selectedKey === item.key ? '#fff' : '#b6b6bd', cursor: 'pointer', fontSize: 12 }}
            >
              {item.label}
            </button>
          ))}
        </aside>

        <main style={{ padding: 20, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, color: '#f4f4f5', fontSize: 16 }}>{selectedMeta.label}</h3>
              <p style={{ margin: '5px 0 0', color: '#8b8b94', fontSize: 12 }}>{selectedMeta.hint}</p>
            </div>
            <button onClick={onClose} style={{ background: 'transparent', color: '#aaaab2', border: '1px solid #303036', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}>Close</button>
          </div>

          {error && <div style={{ background: '#311616', color: '#fca5a5', border: '1px solid #7f1d1d', padding: '8px 10px', borderRadius: 4, fontSize: 12, marginBottom: 10 }}>{error}</div>}

          <textarea
            value={drafts[selectedKey]}
            onChange={(event) => setDrafts((prev) => ({ ...prev, [selectedKey]: event.target.value }))}
            spellCheck={false}
            style={{ flex: 1, width: '100%', resize: 'none', boxSizing: 'border-box', background: '#0b0b0e', color: '#e4e4e7', border: '1px solid #2b2b31', borderRadius: 5, padding: 14, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: 12, lineHeight: 1.55 }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 12, alignItems: 'center' }}>
            <span style={{ color: '#6f6f78', fontSize: 11 }}>Use provenance.source where possible: user_input, connected_store, imported, verified_external.</span>
            <button onClick={saveCurrent} style={{ background: '#2563eb', border: 'none', color: '#fff', padding: '8px 14px', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}>Save verified facts</button>
          </div>
        </main>
      </div>
    </div>
  );
}
