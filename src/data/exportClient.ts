import type { ExportTarget, Project } from '@shared/project';

export interface ExportIssue {
  code: string;
  message: string;
  severity: 'error' | 'warning';
  pageId?: string;
  sectionId?: string;
}

export interface ExportValidationResult {
  valid: boolean;
  target: ExportTarget;
  issues: ExportIssue[];
}

async function readError(response: Response): Promise<never> {
  const payload = await response.json().catch(() => ({}));
  const error = new Error(payload.error || `Export request failed (${response.status}).`);
  (error as Error & { validation?: ExportValidationResult }).validation = payload.validation;
  throw error;
}

export async function validateProjectExport(project: Project, target: ExportTarget): Promise<ExportValidationResult> {
  const response = await fetch('/api/export/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, target }),
  });
  if (!response.ok) return readError(response);
  return response.json();
}

export async function generateProjectExport(project: Project, target: ExportTarget): Promise<{ filename: string; warnings: number }> {
  const response = await fetch('/api/export/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, target }),
  });
  if (!response.ok) return readError(response);

  const disposition = response.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || `natanel-studio-${target}.zip`;
  const warnings = Number(response.headers.get('X-Natanel-Export-Warnings') || 0);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { filename, warnings };
}
