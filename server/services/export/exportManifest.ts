import type { Project } from '../../../shared/project';
import type { ExportManifest, ExportTarget } from '../../../shared/exportTypes';
import type { StudioDesignTokens } from '../../../src/studio-components/types';

export function createExportManifest(
  project: Project,
  target: ExportTarget,
  generatedAt: string,
  exportedAssetIds: string[],
  tokens: StudioDesignTokens,
  themeMode: 'dark' | 'light' = 'dark'
): ExportManifest {
  return {
    studioVersion: '1.0.0',
    generatedAt,
    projectId: project.id,
    projectName: project.name,
    businessName: project.business.businessName,
    target,
    direction: project.business.direction,
    language: project.business.language || 'English',
    pages: project.pages.map((page) => ({
      id: page.id,
      name: page.name,
      slug: page.slug,
      sectionCount: page.sections.length,
      sections: page.sections.map((section) => ({
        id: section.id,
        name: section.name,
        componentRegistryId: section.componentRegistryId,
      })),
    })),
    componentIdsUsed: Array.from(
      new Set(project.pages.flatMap((page) => page.sections.map((section) => section.componentRegistryId)))
    ),
    assetIdsUsed: Array.from(new Set(exportedAssetIds)),
    designTokenSummary: {
      themeMode,
      primaryColor: tokens.accent,
      fontDisplay: tokens.fontDisplay,
      fontBody: tokens.fontBody,
      density: project.brand.contentDensity || project.designSystem.density || 'editorial',
    },
  };
}
