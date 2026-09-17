import type { Project, TextDirection } from './project';

export type ExportTarget = 'wordpress' | 'react' | 'shopify' | 'managed';

export interface ExportValidationIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  pageId?: string;
  sectionId?: string;
}

export interface ExportValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
  issues: ExportValidationIssue[];
}

export interface ExportManifestPage {
  id: string;
  name: string;
  slug: string;
  sectionCount: number;
  sections: Array<{
    id: string;
    name: string;
    componentRegistryId: string;
  }>;
}

export interface ExportManifest {
  studioVersion: string;
  generatedAt: string;
  projectId: string;
  projectName: string;
  businessName: string;
  target: ExportTarget;
  direction: TextDirection;
  language: string;
  pages: ExportManifestPage[];
  componentIdsUsed: string[];
  assetIdsUsed: string[];
  designTokenSummary: {
    themeMode: string;
    primaryColor: string;
    fontDisplay: string;
    fontBody: string;
    density?: string;
  };
}

export interface ExportResult {
  success: boolean;
  target: ExportTarget;
  filename: string;
  mimeType: string;
  downloadUrl?: string;
  downloadId?: string;
  generatedAt: string;
  validation: ExportValidation;
  manifest: ExportManifest;
  message?: string;
}

export interface SiteExporter {
  id: string;
  name: string;
  canExport(project: Project): boolean;
  validate(project: Project): Promise<ExportValidation>;
  export(project: Project): Promise<ExportResult>;
}
