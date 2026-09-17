import React, { useEffect, useMemo, useState } from 'react';
import type { Project, SitePage, SiteSection } from '@shared/project';
import type { ComponentDefinition } from '@shared/componentRegistry';
import { hasComponentImplementation } from '@shared/componentImplementations';
import { resolveSectionAssets } from '@shared/assetBinding';
import { createStudioActionDispatcher } from '@shared/siteActions';
import { normalizeStudioMotionPreset } from '@shared/studioMotion';
import { componentRegistryRepository } from '../data/componentRegistryRepository';
import { getStudioComponent } from './resolver';
import { StudioDiagnosticPlaceholder } from './StudioDiagnosticPlaceholder';
import { StudioMotionWrapper } from './StudioMotionWrapper';
import { compileProjectDesignTokens } from './designTokenCompiler';
import type { StudioComponentProps } from './types';

export interface StudioSiteRendererProps {
  project: Project;
  page: SitePage;
  contentMode?: 'production' | 'preview';
  previewMode?: 'desktop' | 'tablet' | 'mobile';
  themeMode?: 'dark' | 'light' | 'auto';
  onAction?: (actionId: string, payload?: Record<string, unknown>) => void;
  isBuilderMode?: boolean;
  selectedSectionId?: string;
  onSelectSection?: (sectionId: string) => void;
}

export function StudioSiteRenderer({
  project,
  page,
  contentMode = 'production',
  previewMode = 'desktop',
  themeMode = 'dark',
  onAction,
  isBuilderMode = false,
  selectedSectionId,
  onSelectSection,
}: StudioSiteRendererProps) {
  const isRtl = project.business.direction === 'rtl';
  const [registry, setRegistry] = useState<ComponentDefinition[]>(() =>
    componentRegistryRepository.getSynchronous()
  );

  useEffect(() => {
    const unsubscribe = componentRegistryRepository.subscribe(setRegistry);
    componentRegistryRepository.syncWithServer().then(setRegistry).catch(() => {
      // Offline cache remains usable; repository already exposes that state.
    });
    return unsubscribe;
  }, []);

  const compiled = useMemo(() => {
    return compileProjectDesignTokens(project.designSystem, {
      industry: project.business.industry,
      themeMode,
      density: project.brand.contentDensity,
      direction: project.business.direction,
    });
  }, [
    project.designSystem,
    project.business.industry,
    project.brand.contentDensity,
    project.business.direction,
    themeMode,
  ]);

  const dispatchAction = useMemo(() => {
    // Everything rendered inside Natanel Studio is a safe preview/runtime simulation.
    return createStudioActionDispatcher({
      isPreview: true,
      onNavigate: (path) => onAction?.('navigate', { target: path }),
      onToast: (message) => onAction?.('toast', { message }),
    });
  }, [onAction]);

  const sortedSections = useMemo(() => {
    return [...(page.sections || [])].sort((a, b) => a.order - b.order);
  }, [page.sections]);

  const componentMap = useMemo(() => {
    return new Map(registry.map((component) => [component.id, component]));
  }, [registry]);

  return (
    <div
      className="studio-composed-site-root"
      dir={project.business.direction}
      lang={isRtl ? 'he' : 'en'}
      data-preview-mode={previewMode}
      data-project-type={project.projectType}
      data-has-fallback-tokens={compiled.isFallback ? 'true' : 'false'}
      style={{
        ...compiled.cssVariables,
        backgroundColor: 'var(--studio-bg)',
        color: 'var(--studio-text)',
        fontFamily: 'var(--studio-font-body)',
        minHeight: '100%',
        width: '100%',
        position: 'relative',
        direction: project.business.direction,
      }}
    >
      {compiled.isFallback && isBuilderMode && (
        <div
          style={{
            backgroundColor: '#27200e',
            color: '#f59e0b',
            borderBottom: '1px solid #78350f',
            padding: '8px 16px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 100,
          }}
        >
          <span>
            <strong>Design Tokens Notice:</strong> Using fallback tokens ({compiled.fallbackReasons.join(' ')})
          </span>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>
            Approve the project art direction to use project-specific tokens.
          </span>
        </div>
      )}

      {sortedSections.length === 0 ? (
        <div style={{ padding: '80px 24px', textAlign: 'center', color: 'var(--studio-muted)' }}>
          <p style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 8px 0' }}>
            No sections in page "{page.name || 'Untitled'}"
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Add canonically approved sections in the Build workspace.
          </p>
        </div>
      ) : (
        sortedSections.map((section) => (
          <ComposedSectionItem
            key={section.id}
            project={project}
            pageId={page.id}
            section={section}
            componentDefinition={componentMap.get(section.componentRegistryId)}
            designTokens={compiled.tokens}
            direction={project.business.direction}
            previewMode={previewMode}
            contentMode={contentMode}
            themeMode={themeMode}
            isBuilderMode={isBuilderMode}
            isSelected={selectedSectionId === section.id}
            onSelect={() => onSelectSection?.(section.id)}
            onAction={dispatchAction}
          />
        ))
      )}
    </div>
  );
}

interface ComposedSectionItemProps {
  project: Project;
  pageId: string;
  section: SiteSection;
  componentDefinition?: ComponentDefinition;
  designTokens: any;
  direction: 'ltr' | 'rtl';
  previewMode: 'desktop' | 'tablet' | 'mobile';
  contentMode: 'production' | 'preview';
  themeMode: 'dark' | 'light' | 'auto';
  isBuilderMode: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (actionId: string, payload?: Record<string, unknown>) => void;
}

function Diagnostic({
  componentId,
  reason,
  suggestedFix,
  tone = '#ef4444',
}: {
  componentId: string;
  reason: string;
  suggestedFix: string;
  tone?: string;
}) {
  return (
    <div className="section-diagnostic-container" style={{ padding: '24px', border: `1px dashed ${tone}` }}>
      <StudioDiagnosticPlaceholder
        componentId={componentId}
        errorReason={reason}
        suggestedFix={suggestedFix}
      />
    </div>
  );
}

function ComposedSectionItem({
  project,
  pageId,
  section,
  componentDefinition,
  designTokens,
  direction,
  previewMode,
  contentMode,
  themeMode,
  isBuilderMode,
  isSelected,
  onSelect,
  onAction,
}: ComposedSectionItemProps) {
  const registryId = section.componentRegistryId;

  if (!componentDefinition) {
    return (
      <Diagnostic
        componentId={registryId}
        reason={`Component "${registryId}" is not present in the current canonical registry snapshot.`}
        suggestedFix="Sync the component registry or choose another approved component."
      />
    );
  }

  if (componentDefinition.status !== 'approved') {
    return (
      <Diagnostic
        componentId={registryId}
        reason={`Component "${componentDefinition.name}" is currently ${componentDefinition.status}. It cannot render in a production site.`}
        suggestedFix="Replace it with a canonically approved component."
        tone="#f59e0b"
      />
    );
  }

  if (!hasComponentImplementation(registryId)) {
    return (
      <Diagnostic
        componentId={registryId}
        reason={`No verified React implementation exists for "${registryId}".`}
        suggestedFix="Provide a verified implementation before using this component."
      />
    );
  }

  const supportedTypes = componentDefinition.supportedProjectTypes?.length
    ? componentDefinition.supportedProjectTypes
    : ['both'];
  if (!supportedTypes.includes('both') && !supportedTypes.includes(project.projectType)) {
    return (
      <Diagnostic
        componentId={registryId}
        reason={`Component "${componentDefinition.name}" does not support project type ${project.projectType}.`}
        suggestedFix="Choose a component compatible with this project type."
        tone="#3b82f6"
      />
    );
  }

  const supportedDirections = componentDefinition.supportedDirections?.length
    ? componentDefinition.supportedDirections
    : componentDefinition.rtlReady
      ? ['ltr', 'rtl']
      : ['ltr'];
  if (!supportedDirections.includes(direction) || (direction === 'rtl' && componentDefinition.rtlReady === false)) {
    return (
      <Diagnostic
        componentId={registryId}
        reason={`Component "${componentDefinition.name}" is not eligible for ${direction.toUpperCase()} rendering.`}
        suggestedFix="Choose a direction-compatible approved component."
        tone="#f59e0b"
      />
    );
  }

  const assetResolution = resolveSectionAssets(section, componentDefinition, project.assets, pageId);

  if (contentMode === 'production') {
    if (section.contentStatus !== 'ready') {
      const missingFacts = section.missingFactualFields?.join(', ');
      const missingAssets = section.missingAssetRequirements?.join(', ');
      const details = [
        missingFacts ? `factual input: ${missingFacts}` : '',
        missingAssets ? `assets: ${missingAssets}` : '',
        ...(section.contentDiagnostics || []),
      ].filter(Boolean).join(' | ');

      return (
        <Diagnostic
          componentId={registryId}
          reason={`Section is not production-ready${details ? `: ${details}` : '.'}`}
          suggestedFix="Complete the missing verified content/assets in the Build workspace and recompose the section."
          tone="#f59e0b"
        />
      );
    }

    if (assetResolution.missingMandatorySlots.length > 0) {
      return (
        <Diagnostic
          componentId={registryId}
          reason={`Required production asset slots are missing: ${assetResolution.missingMandatorySlots.map((slot) => slot.slot).join(', ')}.`}
          suggestedFix="Generate or assign approved assets before previewing this section."
          tone="#f59e0b"
        />
      );
    }
  }

  const ComponentImpl = getStudioComponent(registryId);
  const motionPreset = normalizeStudioMotionPreset(section.motionPreset);

  const componentProps: StudioComponentProps = {
    content: section.content || {},
    contentMode,
    assets: assetResolution.assets,
    designTokens,
    direction,
    previewMode,
    themeMode,
    motionPreset,
    motionEnabled: motionPreset !== 'none',
    industryPreset: project.business.industry,
    onAction: (actionId, payload) => onAction(actionId, payload),
  };

  return (
    <section
      id={section.id}
      data-section-id={section.id}
      data-component-id={registryId}
      className={`composed-section-wrapper ${isSelected ? 'is-selected' : ''}`}
      onClick={isBuilderMode ? (event) => { event.stopPropagation(); onSelect(); } : undefined}
      style={{
        position: 'relative',
        outline: isBuilderMode && isSelected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '-2px',
        cursor: isBuilderMode ? 'pointer' : 'default',
      }}
    >
      {isBuilderMode && (
        <div
          className="builder-section-tag"
          style={{
            position: 'absolute',
            top: 4,
            left: direction === 'rtl' ? 'auto' : 8,
            right: direction === 'rtl' ? 8 : 'auto',
            zIndex: 30,
            background: isSelected ? '#1e40af' : 'rgba(18,18,20,.86)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,.12)',
            padding: '3px 8px',
            fontSize: '11px',
            display: 'flex',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <span style={{ opacity: 0.7 }}>#{String(section.order).padStart(2, '0')}</span>
          <span>{section.name || componentDefinition.name}</span>
          {section.contentStatus !== 'ready' && <span style={{ color: '#fbbf24' }}>• Needs Input</span>}
        </div>
      )}

      <StudioMotionWrapper preset={motionPreset} enabled={motionPreset !== 'none'} direction={direction}>
        <ComponentImpl {...componentProps} />
      </StudioMotionWrapper>
    </section>
  );
}
