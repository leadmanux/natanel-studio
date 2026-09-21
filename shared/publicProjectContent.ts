import type { Project } from './project';

/**
 * Returns text that is explicitly safe to expose in metadata/exported public data.
 * project.business.description is treated as an internal AI brief by the guided Setup UI.
 */
export function getPublicProjectDescription(project: Project): string {
  if (project.projectType === 'shopify') {
    return project.facts.products[0]?.description?.trim() || project.strategy.positioning?.trim() || '';
  }
  return project.strategy.positioning?.trim() || '';
}
