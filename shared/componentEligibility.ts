import type { ComponentDefinition } from './componentRegistry';
import type { Project } from './project';
import { hasComponentImplementation } from './componentImplementations';
import { getContentContract } from './contentContracts';

export interface ComponentEligibilityResult {
  eligible: boolean;
  reasons: string[];
}

/**
 * Canonical platform-neutral eligibility check used by planning, composition,
 * Builder replacement controls, Preview, and exporters.
 */
export function evaluateComponentEligibility(
  component: ComponentDefinition,
  project: Project
): ComponentEligibilityResult {
  const reasons: string[] = [];

  if (component.status !== 'approved') reasons.push(`status is ${component.status}`);
  if (!hasComponentImplementation(component.id)) reasons.push('render implementation missing');
  if (!getContentContract(component.id)) reasons.push('content contract missing');

  const supportedProjectTypes = component.supportedProjectTypes?.length
    ? component.supportedProjectTypes
    : ['both'];
  if (!supportedProjectTypes.includes('both') && !supportedProjectTypes.includes(project.projectType)) {
    reasons.push(`project type ${project.projectType} is not supported`);
  }

  const supportedDirections = component.supportedDirections?.length
    ? component.supportedDirections
    : component.rtlReady
      ? ['ltr', 'rtl']
      : ['ltr'];

  if (!supportedDirections.includes(project.business.direction)) {
    reasons.push(`direction ${project.business.direction} is not supported`);
  }

  if (project.business.direction === 'rtl' && component.rtlReady === false) {
    reasons.push('component is not RTL-ready');
  }

  if (
    component.category === 'ecommerce' &&
    project.projectType !== 'shopify' &&
    project.brand.ecommerceMode !== 'ecommerce'
  ) {
    reasons.push('ecommerce component requires Shopify/ecommerce mode');
  }

  return { eligible: reasons.length === 0, reasons };
}

export function getEligibleComponents(
  components: ComponentDefinition[],
  project: Project
): ComponentDefinition[] {
  return components.filter((component) => evaluateComponentEligibility(component, project).eligible);
}
