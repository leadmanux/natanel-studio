import { createEmptyProject } from '../shared/project';
import {
  applyLanguage,
  applyProjectTypeDefaults,
  createProjectWithDefaults,
  directionForLanguage,
  normalizeStudioLanguage,
  PROJECT_TYPE_DEFAULTS,
} from '../shared/projectDefaults';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function run() {
  console.log('--- UX DEFAULTS VALIDATION ---');

  const business = createProjectWithDefaults('business', 'business_website', 'Business', 'English');
  assert(business.projectType === 'business_website', 'Business project type is incorrect.');
  assert(business.brand.ecommerceMode === 'lead_generation', 'Business website did not default to lead generation.');
  assert(business.business.primaryGoal === PROJECT_TYPE_DEFAULTS.business_website.primaryGoal, 'Business goal default is missing.');
  assert(business.strategy.primaryCTA === PROJECT_TYPE_DEFAULTS.business_website.primaryCTA, 'Business CTA default is missing.');
  assert(business.exportConfig.target === 'wordpress', 'Business website did not default to WordPress export.');
  assert(business.business.direction === 'ltr', 'English business website did not default to LTR.');

  const shopify = createProjectWithDefaults('shopify', 'shopify', 'Store', 'Hebrew');
  assert(shopify.projectType === 'shopify', 'Shopify project type is incorrect.');
  assert(shopify.brand.ecommerceMode === 'ecommerce', 'Shopify store did not default to ecommerce.');
  assert(shopify.brand.contentDensity === PROJECT_TYPE_DEFAULTS.shopify.contentDensity, 'Shopify density default is missing.');
  assert(shopify.business.primaryGoal === PROJECT_TYPE_DEFAULTS.shopify.primaryGoal, 'Shopify goal default is missing.');
  assert(shopify.strategy.primaryCTA === PROJECT_TYPE_DEFAULTS.shopify.primaryCTA, 'Shopify CTA default is missing.');
  assert(shopify.exportConfig.target === 'shopify', 'Shopify store did not default to Shopify export.');
  assert(shopify.business.direction === 'rtl', 'Hebrew Shopify store did not default to RTL.');

  const switched = applyProjectTypeDefaults(
    {
      ...createEmptyProject('switch', 'business_website', 'Switch'),
      business: {
        ...createEmptyProject('switch', 'business_website', 'Switch').business,
        primaryGoal: 'Old lead goal',
      },
    },
    'shopify'
  );
  assert(switched.brand.ecommerceMode === 'ecommerce', 'Project type toggle did not switch ecommerce mode.');
  assert(switched.business.primaryGoal === PROJECT_TYPE_DEFAULTS.shopify.primaryGoal, 'Project type toggle did not apply Shopify goal.');
  assert(switched.exportConfig.target === 'shopify', 'Project type toggle did not apply Shopify export target.');

  const hebrew = applyLanguage(business, 'Hebrew');
  assert(hebrew.business.language === 'Hebrew' && hebrew.business.direction === 'rtl', 'Hebrew did not automatically enable RTL.');

  const english = applyLanguage(shopify, 'English');
  assert(english.business.language === 'English' && english.business.direction === 'ltr', 'English did not automatically enable LTR.');

  assert(directionForLanguage('Hebrew') === 'rtl', 'directionForLanguage Hebrew failed.');
  assert(directionForLanguage('English') === 'ltr', 'directionForLanguage English failed.');
  assert(normalizeStudioLanguage('עברית') === 'Hebrew', 'Hebrew normalization failed.');
  assert(normalizeStudioLanguage('English') === 'English', 'English normalization failed.');

  console.log('UX defaults validation PASSED.');
}

try {
  run();
} catch (error) {
  console.error('UX defaults validation FAILED.');
  console.error(error instanceof Error ? error.stack || error.message : error);
  process.exit(1);
}
