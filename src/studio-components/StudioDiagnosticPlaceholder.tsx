import React from 'react';
import type { StudioComponentProps } from './types';
import { AlertTriangle, Wrench } from 'lucide-react';

interface DiagnosticProps extends StudioComponentProps {
  unresolvedId?: string;
  componentId?: string;
  errorReason?: string;
  suggestedFix?: string;
}

export function StudioDiagnosticPlaceholder({
  unresolvedId,
  componentId,
  errorReason,
  suggestedFix,
}: DiagnosticProps) {
  const targetId = componentId || unresolvedId || 'unknown-component-id';
  return (
    <div
      className="studio-diagnostic-placeholder"
      style={{
        border: '1px dashed #e56c6c',
        backgroundColor: 'rgba(229, 108, 108, 0.08)',
        color: '#f4f4f5',
        padding: '36px 24px',
        textAlign: 'center',
        borderRadius: '6px',
        margin: '16px auto',
        maxWidth: '720px',
        fontFamily: 'monospace',
      }}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#e56c6c', marginBottom: '12px' }}>
        <AlertTriangle size={20} />
        <strong style={{ fontSize: '14px', letterSpacing: '0.05em' }}>DIAGNOSTIC COMPONENT RESOLUTION FALLBACK</strong>
      </div>
      <p style={{ fontSize: '13px', margin: '0 0 16px 0', color: '#d4d4d8' }}>
        Component implementation could not be resolved for registry identifier:
      </p>
      <div
        style={{
          display: 'inline-block',
          background: '#18181b',
          border: '1px solid #3f3f46',
          padding: '6px 14px',
          borderRadius: '4px',
          color: '#fbbf24',
          fontSize: '12px',
          marginBottom: '16px',
        }}
      >
        <code>{targetId}</code>
      </div>
      {errorReason && (
        <p style={{ fontSize: '12px', color: '#f87171', margin: '0 0 12px 0' }}>
          {errorReason}
        </p>
      )}
      <div style={{ fontSize: '11.5px', color: '#a1a1aa', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
        <Wrench size={13} />
        {suggestedFix || (
          <span>
            Check <code>src/studio-components/resolver.tsx</code> to ensure this component is mapped in <code>studioComponentCatalog</code>.
          </span>
        )}
      </div>
    </div>
  );
}
