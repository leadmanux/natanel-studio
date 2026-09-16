import { demoComponents } from '../shared/componentRegistry';
import { hasStudioComponentImplementation, aliases } from '../src/studio-components/resolver';
import { validateComponentRegistryIntegrity } from '../shared/componentIntegrityValidator';

console.log('--- RUNNING COMPONENT REGISTRY INTEGRITY VALIDATION ---');

const report = validateComponentRegistryIntegrity(
  demoComponents,
  hasStudioComponentImplementation,
  aliases,
  {
    checkFilesOnDisk: true,
    basePath: process.cwd(),
  }
);

console.log(`Total components: ${report.totalComponents}`);
console.log(`Approved: ${report.approvedCount}`);
console.log(`Candidate: ${report.candidateCount}`);
console.log(`Rejected: ${report.rejectedCount}`);

if (report.warnings.length > 0) {
  console.warn('\nWarnings:');
  report.warnings.forEach((w) => console.warn(`  [WARN] ${w}`));
}

if (!report.valid) {
  console.error('\nIntegrity Validation FAILED with errors:');
  report.errors.forEach((e) => console.error(`  [ERROR] ${e}`));
  process.exit(1);
} else {
  console.log('\nIntegrity Validation PASSED: 100% of approved components have verified render implementations and disk paths.');
}
