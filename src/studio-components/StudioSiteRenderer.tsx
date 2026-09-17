import React, { useMemo } from 'react';
import type { Project, SitePage, SiteSection } from '@shared/project';
import { demoComponents } from '@shared/componentRegistry';
import { hasComponentImplementation } from '@shared/componentImplementations';
import { resolveSectionAssets } from '@shared/assetBinding';
import { createStudioActionDispatcher } from '@shared/siteActions';
import { getStudioComponent } from './resolver';
import { StudioDiagnosticPlaceholder } from './StudioDiagnosticPlaceholder';
import { compileProjectDesignTokens } from './designTokenCompiler';
import type { StudioComponentProps, StudioMotionPreset } from './types';

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

  // 1. Compile project design tokens with anti-slop rules
  const compiled = useMemo(() => {
    return compileProjectDesignTokens(project.designSystem, {
      industry: project.business.industry,
      themeMode,
      density: project.brand.contentDensity,
      direction: project.business.direction,
    });
  }, [project.designSystem, project.business.industry, project.brand.contentDensity, project.business.direction, themeMode]);

  // 2. Setup shared safe action dispatcher
  const dispatchAction = useMemo(() => {
    return createStudioActionDispatcher({
      isPreview: contentMode === 'production' ? false : true,
      onNavigate: (path) => {
        if (onAction) onAction('navigate', { target: path });
      },
      onToast: (msg) => {
        if (onAction) onAction('toast', { message: msg });
      },
    });
  }, [contentMode, onAction]);

  // 3. Sort sections strictly by order
  const sortedSections = useMemo(() => {
    if (!page || !page.sections) return [];
    return [...page.sections].sort((a, b) => a.order - b.order);
  }, [page]);

  // Map of canonical component definitions for validation
  const componentMap = useMemo(() => {
    return new Map(demoComponents.map((c) => [c.id, c]));
  }, []);

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
      {/* Fallback Token Warning Banner (shown only when design system is incomplete) */}
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
            <strong>Design Tokens Notice:</strong> Using industry baseline tokens ({compiled.fallbackReasons.join(' ')}).
          </span>
          <span style={{ fontSize: '11px', opacity: 0.8 }}>Approve Art Direction in Design Tab to unlock full custom tokens.</span>
        </div>
      )}

      {/* Render Page Sections */}
      {sortedSections.length === 0 ? (
        <div
          style={{
            padding: '80px 24px',
            textAlign: 'center',
            color: 'var(--studio-muted)',
          }}
        >
          <p style={{ fontSize: '18px', fontWeight: 500, margin: '0 0 8px 0' }}>
            No sections in page "{page?.name || 'Untitled'}"
          </p>
          <p style={{ fontSize: '14px', margin: 0 }}>
            Add approved sections in the Page Builder outline to compose this page.
          </p>
        </div>
      ) : (
        sortedSections.map((section) => {
          return (
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
              onSelect={() => onSelectSection && onSelectSection(section.id)}
              onAction={dispatchAction}
            />
          );
        })
      )}
    </div>
  );
}

interface ComposedSectionItemProps {
  project: Project;
  pageId: string;
  section: SiteSection;
  componentDefinition: ReturnType<typeof demoComponents.find>;
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
  const regId = section.componentRegistryId;

  // CANONICAL GOVERNANCE CHECK (Section 3)
  // 1. Must exist in canonical registry
  if (!componentDefinition) {
    return (
      <div className="section-diagnostic-container" style={{ padding: '24px', border: '1px dashed #ef4444' }}>
        <StudioDiagnosticPlaceholder
          componentId={regId}
          errorReason={`Component "${regId}" is not registered in the Studio component registry.`}
          suggestedFix="Select a valid approved component from the registry inspector."
        />
      </div>
    );
  }

  // 2. Status MUST be 'approved'. Candidates and rejected components are forbidden in composed sites.
  if (componentDefinition.status !== 'approved') {
    return (
      <div className="section-diagnostic-container" style={{ padding: '24px', border: '1px dashed #f59e0b' }}>
        <StudioDiagnosticPlaceholder
          componentId={regId}
          errorReason={`Component "${componentDefinition.name}" has status "${componentDefinition.status}". Only canonically approved components can be rendered in composed production sites.`}
          suggestedFix="Open the Component Library to audit or approve this component once implementation is verified."
        />
      </div>
    );
  }

  // 3. Must have verified physical render implementation
  if (!hasComponentImplementation(regId)) {
    return (
      <div className="section-diagnostic-container" style={{ padding: '24px', border: '1px dashed #ef4444' }}>
        <StudioDiagnosticPlaceholder
          componentId={regId}
          errorReason={`No render implementation code exists for component ID "${regId}".`}
          suggestedFix="Provide a verified render implementation in the studio component registry."
        />
      </div>
    );
  }

  // 4. Direction validation: if RTL project, verify component supports RTL
  if (direction === 'rtl' && componentDefinition.rtlReady === false) {
    return (
      <div className="section-diagnostic-container" style={{ padding: '24px', border: '1px dashed #f59e0b' }}>
        <StudioDiagnosticPlaceholder
          componentId={regId}
          errorReason={`Component "${componentDefinition.name}" does not support RTL layouts.`}
          suggestedFix="Select an RTL-verified replacement component for this Hebrew website."
        />
      </div>
    );
  }

  // 5. Project Type validation: ecommerce components require Shopify or ecommerce brand mode
  if (
    componentDefinition.category === 'ecommerce' &&
    project.projectType !== 'shopify' &&
    project.brand.ecommerceMode !== 'ecommerce'
  ) {
    return (
      <div className="section-diagnostic-container" style={{ padding: '24px', border: '1px dashed #3b82f6' }}>
        <StudioDiagnosticPlaceholder
          componentId={regId}
          errorReason={`Component "${componentDefinition.name}" requires an ecommerce or Shopify project configuration.`}
          suggestedFix="Switch project type to Shopify or enable ecommerce mode in the brand settings."
        />
      </div>
    );
  }

  // Deterministically resolve assets for this section
  const assetResolution = resolveSectionAssets(section, componentDefinition, project.assets, pageId);

  // Resolve React component implementation
  const ComponentImpl = getStudioComponent(regId);

  const motionPreset = (section.motionPreset as StudioMotionPreset) || 'fadeSettle';

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
    onAction: (actId, payload) => onAction(actId, payload),
  };

  return (
    <section
      id={section.id}
      data-section-id={section.id}
      data-component-id={regId}
      className={`composed-section-wrapper ${isSelected ? 'is-selected' : ''}`}
      onClick={isBuilderMode ? (e) => { e.stopPropagation(); onSelect(); } : undefined}
      style={{
        position: 'relative',
        outline: isBuilderMode && isSelected ? '2px solid #3b82f6' : 'none',
        outlineOffset: '-2px',
        cursor: isBuilderMode ? 'pointer' : 'default',
        transition: 'outline 0.15s ease',
      }}
    >
      {/* Builder section toolbar hover tag */}
      {isBuilderMode && (
        <div
          className="builder-section-tag"
          style={{
            position: 'absolute',
            top: 4,
            left: direction === 'rtl' ? 'auto' : 8,
            right: direction === 'rtl' ? 8 : 'auto',
            zIndex: 30,
            background: isSelected ? '#1e40af' : 'rgba(18, 18, 20, 0.85)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            border: isSelected ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
            padding: '3px 8px',
            fontSize: '11px',
            fontFamily: 'monospace',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            pointerEvents: 'none',
          }}
        >
          <span style={{ opacity: 0.7 }}>#{String(section.order).padStart(2, '0')}</span>
          <span>{section.name || componentDefinition.name}</span>
          {section.contentStatus === 'needs_input' && (
            <span style={{ color: '#fbbf24', fontWeight: 600 }}>• Needs Input</span>
          )}
          {assetResolution.missingMandatorySlots.length > 0 && (
            <span style={{ color: '#f87171', fontWeight: 600 }}>• Missing Asset</span>
          )}
        </div>
      )}

      {/* Render the verified Studio component */}
      <ComponentImpl {...componentProps} />
    </section>
  );
}
