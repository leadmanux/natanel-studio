import type { Project } from './project';
import { validateProjectForExport } from './exportValidation';
import type {
  ExportTarget,
  ExportValidationIssue,
  ExportValidation,
  ExportManifest,
  ExportResult,
  SiteExporter,
} from './exportTypes';

export * from './exportTypes';
export { validateProjectForExport } from './exportValidation';

export abstract class BaseExporter implements SiteExporter {
  abstract id: ExportTarget;
  abstract name: string;
  abstract canExport(project: Project): boolean;

  async validate(project: Project): Promise<ExportValidation> {
    return validateProjectForExport(project, this.id);
  }

  abstract export(project: Project): Promise<ExportResult>;
}

export class WordPressExporter extends BaseExporter {
  id: ExportTarget = 'wordpress';
  name = 'WordPress Block Theme';

  canExport(project: Project) {
    return project.projectType === 'business_website';
  }

  async export(project: Project): Promise<ExportResult> {
    const validation = await this.validate(project);
    const generatedAt = new Date().toISOString();
    const safeSlug = (project.business.businessName || project.name || 'natanel-studio-site')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'website';
    const filename = `${safeSlug}-wordpress-theme.zip`;

    const manifest: ExportManifest = {
      studioVersion: '1.0.0',
      generatedAt,
      projectId: project.id,
      projectName: project.name,
      businessName: project.business.businessName,
      target: 'wordpress',
      direction: project.business.direction,
      language: project.business.language || 'English',
      pages: (project.pages || []).map((page) => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        sectionCount: (page.sections || []).length,
        sections: (page.sections || []).map((s) => ({
          id: s.id,
          name: s.name,
          componentRegistryId: s.componentRegistryId,
        })),
      })),
      componentIdsUsed: Array.from(
        new Set(project.pages.flatMap((p) => p.sections.map((s) => s.componentRegistryId)))
      ),
      assetIdsUsed: Array.from(
        new Set(project.pages.flatMap((p) => p.sections.flatMap((s) => s.assetIds || [])))
      ),
      designTokenSummary: {
        themeMode: 'dark',
        primaryColor: project.designSystem?.colors?.[0] || '#111113',
        fontDisplay: project.designSystem?.typography || 'Editorial Serif',
        fontBody: 'Inter',
      },
    };

    if (!validation.valid) {
      return {
        target: 'wordpress',
        success: false,
        filename,
        mimeType: 'application/zip',
        generatedAt,
        validation,
        manifest,
        message: `Validation failed with ${validation.errors.length} error(s).`,
      };
    }

    return {
      target: 'wordpress',
      success: true,
      filename,
      mimeType: 'application/zip',
      downloadUrl: `/api/export/download/${project.id}-wordpress`,
      generatedAt,
      validation,
      manifest,
      message: 'WordPress block theme exported successfully.',
    };
  }
}

export class ReactExporter extends BaseExporter {
  id: ExportTarget = 'react';
  name = 'React Source (Vite)';

  canExport(project: Project) {
    return project.projectType === 'business_website';
  }

  async export(project: Project): Promise<ExportResult> {
    const validation = await this.validate(project);
    const generatedAt = new Date().toISOString();
    const safeSlug = (project.business.businessName || project.name || 'natanel-studio-site')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'website';
    const filename = `${safeSlug}-react-source.zip`;

    const manifest: ExportManifest = {
      studioVersion: '1.0.0',
      generatedAt,
      projectId: project.id,
      projectName: project.name,
      businessName: project.business.businessName,
      target: 'react',
      direction: project.business.direction,
      language: project.business.language || 'English',
      pages: (project.pages || []).map((page) => ({
        id: page.id,
        name: page.name,
        slug: page.slug,
        sectionCount: (page.sections || []).length,
        sections: (page.sections || []).map((s) => ({
          id: s.id,
          name: s.name,
          componentRegistryId: s.componentRegistryId,
        })),
      })),
      componentIdsUsed: Array.from(
        new Set(project.pages.flatMap((p) => p.sections.map((s) => s.componentRegistryId)))
      ),
      assetIdsUsed: Array.from(
        new Set(project.pages.flatMap((p) => p.sections.flatMap((s) => s.assetIds || [])))
      ),
      designTokenSummary: {
        themeMode: 'dark',
        primaryColor: project.designSystem?.colors?.[0] || '#111113',
        fontDisplay: project.designSystem?.typography || 'Editorial Serif',
        fontBody: 'Inter',
      },
    };

    if (!validation.valid) {
      return {
        target: 'react',
        success: false,
        filename,
        mimeType: 'application/zip',
        generatedAt,
        validation,
        manifest,
        message: `Validation failed with ${validation.errors.length} error(s).`,
      };
    }

    return {
      target: 'react',
      success: true,
      filename,
      mimeType: 'application/zip',
      downloadUrl: `/api/export/download/${project.id}-react`,
      generatedAt,
      validation,
      manifest,
      message: 'React source ZIP exported successfully.',
    };
  }
}

export class ManagedDeploymentExporter extends BaseExporter {
  id: ExportTarget = 'managed';
  name = 'Managed Deployment';

  canExport(project: Project) {
    return project.projectType === 'business_website';
  }

  async export(project: Project): Promise<ExportResult> {
    const validation = await this.validate(project);
    return {
      target: 'managed',
      success: false,
      filename: 'managed-export.json',
      mimeType: 'application/json',
      generatedAt: new Date().toISOString(),
      validation,
      manifest: {
        studioVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,
        businessName: project.business.businessName,
        target: 'managed',
        direction: project.business.direction,
        language: project.business.language,
        pages: [],
        componentIdsUsed: [],
        assetIdsUsed: [],
        designTokenSummary: {
          themeMode: 'dark',
          primaryColor: '#111113',
          fontDisplay: 'Inter',
          fontBody: 'Inter',
        },
      },
      message: 'Managed deployment is planned for a later milestone.',
    };
  }
}

export class ShopifyExporter extends BaseExporter {
  id: ExportTarget = 'shopify';
  name = 'Shopify Theme ZIP';

  canExport(project: Project) {
    return project.projectType === 'shopify';
  }

  async export(project: Project): Promise<ExportResult> {
    const validation = await this.validate(project);
    return {
      target: 'shopify',
      success: false,
      filename: 'shopify-theme.zip',
      mimeType: 'application/zip',
      generatedAt: new Date().toISOString(),
      validation,
      manifest: {
        studioVersion: '1.0.0',
        generatedAt: new Date().toISOString(),
        projectId: project.id,
        projectName: project.name,
        businessName: project.business.businessName,
        target: 'shopify',
        direction: project.business.direction,
        language: project.business.language,
        pages: [],
        componentIdsUsed: [],
        assetIdsUsed: [],
        designTokenSummary: {
          themeMode: 'dark',
          primaryColor: '#111113',
          fontDisplay: 'Inter',
          fontBody: 'Inter',
        },
      },
      message: 'Shopify exporter is scheduled for V2.',
    };
  }
}

export const exporters: SiteExporter[] = [
  new WordPressExporter(),
  new ReactExporter(),
  new ManagedDeploymentExporter(),
  new ShopifyExporter(),
];
