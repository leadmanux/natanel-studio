import type { Project, ReferenceAnalysis, GeneratedAsset } from '@shared/project';
import type { ComponentDefinition } from '@shared/componentRegistry';
import type {
  ArtDirectionProposal,
  ComponentSelectionItem,
  DesignCriticReport,
  ImageGeneratorRequest,
  ImageGeneratorResponse,
} from './contracts';

export async function requestArtDirections(project: Project): Promise<ArtDirectionProposal[]> {
  const res = await fetch('/api/ai/art-directions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to generate design directions' }));
    throw new Error(error.error || 'Failed to generate design directions');
  }
  const data = await res.json();
  return data.directions;
}

export async function requestReferenceAnalysis(url: string, project?: Project): Promise<ReferenceAnalysis> {
  const res = await fetch('/api/ai/analyze-reference', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, project }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to analyze reference URL' }));
    throw new Error(error.error || 'Failed to analyze reference URL');
  }
  const data = await res.json();
  return data.analysis;
}

export async function requestComponentSelection(
  project: Project,
  candidates?: ComponentDefinition[]
): Promise<ComponentSelectionItem[]> {
  const res = await fetch('/api/ai/select-components', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, candidates }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to select components' }));
    throw new Error(error.error || 'Failed to select components');
  }
  const data = await res.json();
  return data.selections;
}

export async function requestAssetPlan(project: Project): Promise<GeneratedAsset[]> {
  const res = await fetch('/api/ai/plan-assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to plan assets' }));
    throw new Error(error.error || 'Failed to plan assets');
  }
  const data = await res.json();
  return data.assets;
}

export async function requestDesignCritic(project: Project, screenshots?: string[]): Promise<DesignCriticReport> {
  const res = await fetch('/api/ai/critic', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project, screenshots }),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to critique design' }));
    throw new Error(error.error || 'Failed to critique design');
  }
  const data = await res.json();
  return data.report;
}

export async function requestImageGeneration(req: ImageGeneratorRequest): Promise<ImageGeneratorResponse> {
  const res = await fetch('/api/assets/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Failed to generate image' }));
    throw new Error(error.error || 'Failed to generate image');
  }
  return res.json();
}
