import type { Project, ExportTarget } from './project';

export interface ExportValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ExportValidation {
  valid: boolean;
  issues: ExportValidationIssue[];
}

export interface ExportResult {
  target: ExportTarget;
  success: boolean;
  artifactName?: string;
  artifactUrl?: string;
  repositoryUrl?: string;
  deploymentUrl?: string;
  message: string;
}

export interface SiteExporter {
  id: string;
  name: string;
  canExport(project: Project): boolean;
  validate(project: Project): Promise<ExportValidation>;
  export(project: Project): Promise<ExportResult>;
}

abstract class BaseExporter implements SiteExporter {
  abstract id: string;
  abstract name: string;
  abstract canExport(project: Project): boolean;

  async validate(project: Project): Promise<ExportValidation> {
    const issues: ExportValidationIssue[] = [];
    if (!project.business.businessName) {
      issues.push({ code: 'business_name_missing', message: 'Business name is required before export.', severity: 'error' });
    }
    if (project.pages.length === 0) {
      issues.push({ code: 'pages_missing', message: 'At least one page is required before export.', severity: 'error' });
    }
    return { valid: !issues.some((issue) => issue.severity === 'error'), issues };
  }

  abstract export(project: Project): Promise<ExportResult>;
}

export class WordPressExporter extends BaseExporter {
  id = 'wordpress';
  name = 'WordPress Theme ZIP';
  canExport(project: Project) {
    return project.projectType === 'business_website';
  }
  async export(_project: Project): Promise<ExportResult> {
    return { target: 'wordpress', success: false, message: 'WordPress exporter is scaffolded but not implemented yet.' };
  }
}

export class ReactExporter extends BaseExporter {
  id = 'react';
  name = 'GitHub / React';
  canExport(project: Project) {
    return project.projectType === 'business_website';
  }
  async export(_project: Project): Promise<ExportResult> {
    return { target: 'react', success: false, message: 'React exporter is scaffolded but not implemented yet.' };
  }
}

export class ManagedDeploymentExporter extends BaseExporter {
  id = 'managed';
  name = 'Managed Deployment';
  canExport(project: Project) {
    return project.projectType === 'business_website';
  }
  async export(_project: Project): Promise<ExportResult> {
    return { target: 'managed', success: false, message: 'Managed deployment is planned for a later milestone.' };
  }
}

export class ShopifyExporter extends BaseExporter {
  id = 'shopify';
  name = 'Shopify Theme ZIP';
  canExport(project: Project) {
    return project.projectType === 'shopify';
  }
  async export(_project: Project): Promise<ExportResult> {
    return { target: 'shopify', success: false, message: 'Shopify exporter is scaffolded but not implemented yet.' };
  }
}

export const exporters: SiteExporter[] = [
  new WordPressExporter(),
  new ReactExporter(),
  new ManagedDeploymentExporter(),
  new ShopifyExporter(),
];
