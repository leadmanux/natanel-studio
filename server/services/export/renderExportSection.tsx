import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Project, SitePage, SiteSection } from '../../../shared/project';
import type { ComponentDefinition } from '../../../shared/componentRegistry';
import { resolveSectionAssets } from '../../../shared/assetBinding';
import { adaptContentForStudioImplementation } from '../../../shared/implementationContent';
import { normalizeStudioMotionPreset } from '../../../shared/studioMotion';
import {
  getStudioComponent,
  hasStudioComponentImplementation,
} from '../../../src/studio-components/resolver';
import { compileProjectDesignTokens } from '../../../src/studio-components/designTokenCompiler';

export class ExportSectionRenderError extends Error {
  constructor(
    public pageId: string,
    public sectionId: string,
    public componentRegistryId: string,
    message: string
  ) {
    super(message);
    this.name = 'ExportSectionRenderError';
  }
}

export interface RenderedExportSection {
  html: string;
  assetIds: string[];
  motionPreset: ReturnType<typeof normalizeStudioMotionPreset>;
}

/**
 * Server-renders the exact production Studio component implementation used by Preview.
 * Exporters may localize asset URLs differently, but they never substitute a generic
 * component design or diagnostic placeholder.
 */
export function renderExactExportSection(
  section: SiteSection,
  page: SitePage,
  project: Project,
  canonicalComponents: ComponentDefinition[],
  assetPathForSource: (sourceUrl: string) => string
): RenderedExportSection {
  const component = canonicalComponents.find((candidate) => candidate.id === section.componentRegistryId);
  if (!component) {
    throw new ExportSectionRenderError(
      page.id,
      section.id,
      section.componentRegistryId,
      `Canonical component "${section.componentRegistryId}" was not found during export render.`
    );
  }
  if (!hasStudioComponentImplementation(component.id)) {
    throw new ExportSectionRenderError(
      page.id,
      section.id,
      section.componentRegistryId,
      `Canonical component "${section.componentRegistryId}" has no render implementation.`
    );
  }

  const resolution = resolveSectionAssets(section, component, project.assets, page.id);
  if (resolution.missingMandatorySlots.length) {
    throw new ExportSectionRenderError(
      page.id,
      section.id,
      section.componentRegistryId,
      `Mandatory asset slots are missing: ${resolution.missingMandatorySlots.map((item) => item.slot).join(', ')}.`
    );
  }

  const localizedAssets = Object.fromEntries(
    Object.entries(resolution.assets).map(([slot, asset]) => [
      slot,
      {
        ...asset,
        url: assetPathForSource(asset.url),
      },
    ])
  );

  const compiledTokens = compileProjectDesignTokens(project.designSystem, {
    industry: project.business.industry,
    themeMode: 'dark',
    density: project.brand.contentDensity || project.designSystem.density,
    direction: project.business.direction,
  });
  const Component = getStudioComponent(component.id);
  const motionPreset = normalizeStudioMotionPreset(section.motionPreset);
  const renderContent = adaptContentForStudioImplementation(
    section.componentRegistryId,
    section.content || {},
    project
  );

  try {
    const html = renderToStaticMarkup(
      React.createElement(Component, {
        content: renderContent,
        contentMode: 'production',
        assets: localizedAssets,
        designTokens: compiledTokens.tokens,
        direction: project.business.direction,
        motionPreset,
        motionEnabled: false,
        previewMode: 'desktop',
        themeMode: 'dark',
        industryPreset: project.business.industry,
      })
    );

    if (!html.trim()) {
      throw new Error('Component rendered empty markup.');
    }

    const unsafeDemoMarkers = [
      'images.unsplash.com',
      'studio@natanel.design',
      'atelier@natanel.design',
      '03-555-0199',
      '03-555-1234',
      '1-800-555-0199',
      '054-456-7890',
      '+972-54-456-7890',
      'SUMMER MMXXVI',
      'Villa 04 Sovereign',
      'Basalt Pavilion',
    ];
    const leakedMarker = unsafeDemoMarkers.find((marker) => html.includes(marker));
    if (leakedMarker) {
      throw new Error(
        `Production render contains Studio demo content ("${leakedMarker}"). Supply approved project content/assets or use a production-safe component.`
      );
    }

    return {
      html,
      assetIds: resolution.boundAssetIds,
      motionPreset,
    };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new ExportSectionRenderError(
      page.id,
      section.id,
      section.componentRegistryId,
      `Failed rendering ${section.componentRegistryId}: ${reason}`
    );
  }
}
