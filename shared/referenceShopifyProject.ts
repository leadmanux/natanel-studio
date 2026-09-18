import { createEmptyProject, type Project, type SiteSection, type TextDirection } from './project';

const HERO_ASSET =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjEyMDAiIHZpZXdCb3g9IjAgMCAxMjAwIDEyMDAiPgo8ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwIiB5MT0iMCIgeDI9IjEiIHkyPSIxIj48c3RvcCBzdG9wLWNvbG9yPSIjZjFlZWU2Ii8+PHN0b3Agb2Zmc2V0PSIxIiBzdG9wLWNvbG9yPSIjYzdiNTlhIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+CjxyZWN0IHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjEyMDAiIGZpbGw9InVybCgjZykiLz4KPGNpcmNsZSBjeD0iNjAwIiBjeT0iNDMwIiByPSIyMzAiIGZpbGw9IiNlOWUwZDEiLz4KPHJlY3QgeD0iNDY1IiB5PSIyODAiIHdpZHRoPSIyNzAiIGhlaWdodD0iNTAwIiByeD0iMTIwIiBmaWxsPSIjZjhmN2YzIiBzdHJva2U9IiNiODhmNjIiIHN0cm9rZS13aWR0aD0iMTgiLz4KPGNpcmNsZSBjeD0iNjAwIiBjeT0iMzYwIiByPSIxMDUiIGZpbGw9IiMxNzE3MTkiLz4KPGcgZmlsbD0iI2I4OGY2MiI+PGNpcmNsZSBjeD0iNjAwIiBjeT0iMzA1IiByPSIxNSIvPjxjaXJjbGUgY3g9IjY1MCIgY3k9IjMzNSIgcj0iMTUiLz48Y2lyY2xlIGN4PSI2NTAiIGN5PSIzOTAiIHI9IjE1Ii8+PGNpcmNsZSBjeD0iNjAwIiBjeT0iNDE1IiByPSIxNSIvPjxjaXJjbGUgY3g9IjU1MCIgY3k9IjM5MCIgcj0iMTUiLz48Y2lyY2xlIGN4PSI1NTAiIGN5PSIzMzUiIHI9IjE1Ii8+PC9nPgo8cmVjdCB4PSI1NTAiIHk9IjUwMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIyNiIgcng9IjEzIiBmaWxsPSIjYjg4ZjYyIi8+CjxyZWN0IHg9IjU1MCIgeT0iNTQ4IiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjI2IiByeD0iMTMiIGZpbGw9IiNiODhmNjIiLz4KPHJlY3QgeD0iNTUwIiB5PSI1OTYiIHdpZHRoPSIxMDAiIGhlaWdodD0iMjYiIHJ4PSIxMyIgZmlsbD0iI2I4OGY2MiIvPgo8cmVjdCB4PSI1NTAiIHk9IjY0NCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIyNiIgcng9IjEzIiBmaWxsPSIjYjg4ZjYyIi8+Cjx0ZXh0IHg9IjYwMCIgeT0iOTYwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iNDIiIGZpbGw9IiMzNDMwMmEiPlJFRkVSRU5DRSBQUk9EVUNUIFNDRU5FPC90ZXh0Pgo8L3N2Zz4=';

const SECONDARY_ASSET =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMjAwIiBoZWlnaHQ9IjEyMDAiIHZpZXdCb3g9IjAgMCAxMjAwIDEyMDAiPgo8cmVjdCB3aWR0aD0iMTIwMCIgaGVpZ2h0PSIxMjAwIiBmaWxsPSIjZWNlOWUxIi8+CjxyZWN0IHg9IjE0MCIgeT0iMTgwIiB3aWR0aD0iOTIwIiBoZWlnaHQ9Ijc2MCIgcng9IjQwIiBmaWxsPSIjZDdjZWMxIi8+CjxlbGxpcHNlIGN4PSI2MDAiIGN5PSI4MTUiIHJ4PSIzMzAiIHJ5PSI3MCIgZmlsbD0iI2I5YWQ5ZCIvPgo8cmVjdCB4PSI0ODUiIHk9IjI3MCIgd2lkdGg9IjIzMCIgaGVpZ2h0PSI0NzAiIHJ4PSIxMTAiIGZpbGw9IiNmYWY5ZjUiIHN0cm9rZT0iI2E4ODY2MiIgc3Ryb2tlLXdpZHRoPSIxNSIvPgo8Y2lyY2xlIGN4PSI2MDAiIGN5PSIzNTAiIHI9IjkwIiBmaWxsPSIjMjAyMDIzIi8+Cjx0ZXh0IHg9IjYwMCIgeT0iMTA0MCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjM4IiBmaWxsPSIjM2MzNzMyIj5TRUNPTkRBUlkgUUEgQU5HTEU8L3RleHQ+Cjwvc3ZnPg==';

const SOCIAL_ASSET =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNjAwIiBoZWlnaHQ9IjkwMCIgdmlld0JveD0iMCAwIDE2MDAgOTAwIj4KPHJlY3Qgd2lkdGg9IjE2MDAiIGhlaWdodD0iOTAwIiBmaWxsPSIjMTExMjE0Ii8+CjxyZWN0IHg9IjEwMCIgeT0iMTAwIiB3aWR0aD0iMTQwMCIgaGVpZ2h0PSI3MDAiIHJ4PSIzMCIgZmlsbD0iIzFjMWQyMCIgc3Ryb2tlPSIjYjg5YTY4IiBzdHJva2Utd2lkdGg9IjMiLz4KPHRleHQgeD0iODAwIiB5PSIzOTAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSI4NiIgZmlsbD0iI2YyZWZlOCI+Tk9SVEggRk9STTwvdGV4dD4KPHRleHQgeD0iODAwIiB5PSI0ODAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIzNCIgZmlsbD0iI2I4OWE2OCI+UkVGRVJFTkNFIENPTU1FUkNFIFNUT1JFPC90ZXh0Pgo8L3N2Zz4=';

function readySection(
  partial: Omit<
    SiteSection,
    'contentStatus' | 'contentApproved' | 'missingFactualFields' | 'missingAssetRequirements'
  >
): SiteSection {
  return {
    ...partial,
    contentStatus: 'ready',
    contentApproved: true,
    missingFactualFields: [],
    missingAssetRequirements: [],
  };
}

/**
 * Internal QA fixture used to exercise the real Natanel Studio Shopify pipeline.
 * It is intentionally labelled as reference content and is never a default client project.
 */
export function createShopifyReferenceProject(direction: TextDirection = 'rtl'): Project {
  const rtl = direction === 'rtl';
  const project = createEmptyProject(
    `qa-shopify-reference-${direction}`,
    'shopify',
    rtl ? 'NORTH FORM — חנות בדיקה' : 'NORTH FORM — QA Store'
  );

  project.status = 'approved';
  project.business = {
    ...project.business,
    businessName: rtl ? 'נורת׳ פורם' : 'North Form',
    industry: 'Beauty & Personal Care Ecommerce',
    description: rtl
      ? 'חנות רפרנס פנימית לבדיקת עיצוב, RTL, מסחר וייצוא Shopify מקצה לקצה.'
      : 'Internal reference store for end-to-end design, commerce and Shopify export QA.',
    targetAudience: rtl ? 'לקוחות אונליין שמחפשים חוויית קנייה נקייה ומקצועית.' : 'Online customers who value a clean, premium buying experience.',
    primaryGoal: rtl ? 'רכישה באתר' : 'Online purchase',
    secondaryGoals: [rtl ? 'בניית אמון' : 'Build trust', rtl ? 'הצגת מוצר ברורה' : 'Clear product education'],
    language: rtl ? 'Hebrew' : 'English',
    direction,
    email: 'qa@example.com',
    socialLinks: [],
  };

  project.brand = {
    ...project.brand,
    colors: ['#111214', '#f2efe8', '#b89a68', '#d8d0c4'],
    existingFonts: ['Inter', 'Georgia'],
    brandNotes: 'QA fixture only. Quiet premium commerce; restrained radius; editorial whitespace.',
    visualPreferences: ['Editorial product photography', 'High contrast typography', 'Minimal chrome'],
    contentDensity: 'editorial',
    ecommerceMode: 'ecommerce',
  };

  project.strategy = {
    positioning: rtl
      ? 'מותג טיפוח ביתי פרימיום עם מסלול קנייה ברור ורגוע.'
      : 'Premium at-home beauty product with a calm, explicit purchase path.',
    primaryCTA: rtl ? 'הוספה לסל' : 'Add to cart',
    secondaryCTA: rtl ? 'לפרטי המוצר' : 'View product details',
    requiredPages: [rtl ? 'בית' : 'Home', rtl ? 'חנות' : 'Shop', rtl ? 'מוצר' : 'Product', rtl ? 'אודות' : 'About'],
    requiredSections: ['Navigation', 'Product Hero', 'Product Grid', 'Product Details', 'FAQ', 'Footer'],
    CRORequirements: ['Clear product CTA', 'Variant-safe cart flow', 'Responsive product grid', 'FAQ near conversion'],
    contentNotes: 'Reference content only. No customer-review or certification claims.',
  };

  project.designSystem = {
    ...project.designSystem,
    artDirection: 'Quiet editorial beauty commerce',
    creativeConcept: 'Clinical precision softened by warm editorial materials',
    visualMood: 'Premium, calm, credible, tactile',
    typography: 'Editorial serif display with modern sans-serif body',
    typographyDirection: 'Large display type, compact utility labels, strong mobile hierarchy',
    colors: ['#111214', '#f2efe8', '#b89a68', '#d8d0c4'],
    colorDirection: 'Near-black, warm ivory, restrained bronze',
    spacing: 'Generous section rhythm with compact commerce controls',
    spacingPhilosophy: 'Whitespace establishes hierarchy; commerce controls remain dense and obvious',
    borderRadius: '4px subtle',
    imageStyle: 'Clean premium vanity/product still life',
    photographyDirection: 'Soft natural light, tactile surfaces, accurate product proportions',
    imageGenerationStrategy: 'Reference-bound product imagery with no invented device details',
    motionStyle: 'Subtle reveal only',
    motionPhilosophy: 'Motion supports hierarchy and never delays purchase controls',
    layoutPhilosophy: 'Editorial asymmetry around a conventional ecommerce conversion path',
    layoutRules: ['Mobile-first product CTA', 'One dominant action per section', 'Keep product copy scannable'],
    avoidRules: ['Purple gradients', 'Generic SaaS cards', 'Excessive pills', 'Decorative motion', 'Fake review claims'],
    CROApproach: 'Reduce ambiguity between product education, selection and add-to-cart',
    recommendedComponentStyles: ['editorial', 'commerce', 'minimal'],
    density: 'editorial',
    visualPersonality: 'Quiet luxury with clinical credibility',
    approvedAt: new Date().toISOString(),
  };

  project.assets = [
    {
      id: 'qa-product-primary',
      type: 'image',
      purpose: 'Primary product photography',
      prompt: 'Internal deterministic QA reference asset',
      aspectRatio: '1:1',
      resolution: '1K',
      referenceAssets: [],
      model: 'qa-fixture',
      source: 'deterministic_fallback',
      status: 'approved',
      outputUrl: HERO_ASSET,
    },
    {
      id: 'qa-product-secondary',
      type: 'image',
      purpose: 'Secondary product photography',
      prompt: 'Internal deterministic QA reference asset',
      aspectRatio: '1:1',
      resolution: '1K',
      referenceAssets: [],
      model: 'qa-fixture',
      source: 'deterministic_fallback',
      status: 'approved',
      outputUrl: SECONDARY_ASSET,
    },
    {
      id: 'qa-social',
      type: 'image',
      purpose: 'Social sharing image',
      prompt: 'Internal deterministic QA reference asset',
      aspectRatio: '16:9',
      resolution: '1K',
      referenceAssets: [],
      model: 'qa-fixture',
      source: 'deterministic_fallback',
      status: 'approved',
      outputUrl: SOCIAL_ASSET,
    },
  ];

  project.facts.products = [
    {
      id: 'nf-one',
      name: rtl ? 'NORTH FORM One' : 'NORTH FORM One',
      price: rtl ? '₪749' : '$199',
      originalPrice: rtl ? '₪949' : '$249',
      category: rtl ? 'טיפוח ביתי' : 'At-home skincare',
      description: rtl
        ? 'מכשיר רפרנס לבדיקת זרימת מוצר, וריאנטים, מחיר וקריאה לפעולה.'
        : 'Reference product used to test product, variant, price and conversion flows.',
      shippingNote: rtl ? 'עלות וזמן המשלוח מחושבים בקופה.' : 'Shipping cost and timing are calculated at checkout.',
      inStock: true,
      provenance: { source: 'imported', sourceLabel: 'Natanel Studio QA fixture' },
    },
    {
      id: 'nf-gel',
      name: rtl ? 'ג׳ל מוליך NORTH FORM' : 'NORTH FORM Conductive Gel',
      price: rtl ? '₪89' : '$24',
      category: rtl ? 'אביזרים' : 'Accessories',
      description: rtl ? 'אביזר רפרנס לבדיקת גריד מוצרים.' : 'Reference accessory for collection-grid QA.',
      inStock: true,
      provenance: { source: 'imported', sourceLabel: 'Natanel Studio QA fixture' },
    },
  ];
  project.facts.shipping = {
    note: rtl ? 'עלות וזמן המשלוח מחושבים בקופה.' : 'Shipping cost and timing are calculated at checkout.',
    provenance: { source: 'imported', sourceLabel: 'Natanel Studio QA fixture' },
  };

  const nav = readySection({
    id: 'qa-nav',
    name: rtl ? 'ניווט ראשי' : 'Main Navigation',
    componentRegistryId: 'nav-centered-luxury-01',
    purpose: 'Global store navigation',
    order: 0,
    motionPreset: 'none',
    content: {
      brandName: project.business.businessName,
      monogram: 'NF',
      links: [
        { label: rtl ? 'חנות' : 'Shop', href: '/shop' },
        { label: rtl ? 'אודות' : 'About', href: '/about' },
      ],
      ctaLabel: rtl ? 'למוצר' : 'View product',
      ctaHref: '/product',
    },
    assetIds: [],
  });

  const footer = readySection({
    id: 'qa-footer',
    name: rtl ? 'פוטר' : 'Footer',
    componentRegistryId: 'footer-minimal-legal-01',
    purpose: 'Global legal footer',
    order: 99,
    motionPreset: 'none',
    content: {
      brandName: project.business.businessName,
      copyrightYear: '2026',
      legalLinks: [],
    },
    assetIds: [],
  });

  const productHero = (id: string, order: number) =>
    readySection({
      id,
      name: rtl ? 'גיבור מוצר' : 'Product Hero',
      componentRegistryId: 'hero-product-commerce-01',
      purpose: 'Primary product conversion',
      order,
      motionPreset: 'fadeReveal',
      content: {
        tagline: rtl ? 'טיפוח ביתי, בלי רעש מיותר' : 'At-home care, without the noise',
        productName: 'NORTH FORM One',
        description: rtl
          ? 'מוצר רפרנס פנימי לבדיקת היררכיה, מחיר, תמונה ופעולת הוספה לסל.'
          : 'Internal reference product for hierarchy, pricing, imagery and add-to-cart QA.',
        price: rtl ? '₪749' : '$199',
        originalPrice: rtl ? '₪949' : '$249',
        ctaText: rtl ? 'הוספה לסל' : 'Add to cart',
        shippingNote: project.facts.shipping?.note || '',
      },
      assetIds: ['qa-product-primary'],
      assetBindings: { product: 'qa-product-primary' },
    });

  const productGrid = readySection({
    id: 'qa-product-grid',
    name: rtl ? 'גריד מוצרים' : 'Product Grid',
    componentRegistryId: 'ecommerce-product-grid-01',
    purpose: 'Collection browsing',
    order: 1,
    motionPreset: 'fadeReveal',
    content: {
      eyebrow: rtl ? 'החנות' : 'Shop',
      headline: rtl ? 'המוצרים שלנו' : 'The collection',
      subtitle: rtl ? 'מסלול קנייה נקי ומדויק.' : 'A clean, deliberate purchase path.',
      products: project.facts.products.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price || '',
        originalPrice: product.originalPrice,
        category: product.category,
        inStock: product.inStock,
      })),
    },
    assetIds: ['qa-product-primary', 'qa-product-secondary'],
    assetBindings: {
      prod_0: 'qa-product-primary',
      prod_1: 'qa-product-secondary',
    },
  });

  const details = readySection({
    id: 'qa-product-details',
    name: rtl ? 'פרטי מוצר' : 'Product Details',
    componentRegistryId: 'ecommerce-detail-accordion-01',
    purpose: 'Product education',
    order: 2,
    motionPreset: 'none',
    content: {
      productName: 'NORTH FORM One',
      price: rtl ? '₪749' : '$199',
      description: rtl ? 'פרטי QA שנועדו לבדוק את חוויית האקורדיון והמוצר.' : 'QA details used to verify the product accordion experience.',
      accordionItems: [
        {
          title: rtl ? 'מה בודקים כאן?' : 'What is tested here?',
          content: rtl
            ? 'מבנה עמוד מוצר, תוכן מאושר, רספונסיביות ועריכת Theme Editor.'
            : 'Product-page structure, approved content, responsiveness and Theme Editor behavior.',
        },
        {
          title: rtl ? 'משלוח' : 'Shipping',
          content: project.facts.shipping?.note || '',
        },
      ],
    },
    assetIds: [],
  });

  const faq = readySection({
    id: 'qa-faq',
    name: rtl ? 'שאלות נפוצות' : 'FAQ',
    componentRegistryId: 'forms-faq-accordion-01',
    purpose: 'Purchase clarity',
    order: 4,
    motionPreset: 'fadeSettle',
    content: {
      eyebrow: rtl ? 'לפני שמזמינים' : 'Before ordering',
      headline: rtl ? 'שאלות קצרות, תשובות ברורות' : 'Short questions, clear answers',
      items: [
        {
          question: rtl ? 'האם זה מוצר אמיתי?' : 'Is this a real product?',
          answer: rtl
            ? 'לא. זהו פרויקט QA פנימי שמיועד לבדיקה של Natanel Studio בלבד.'
            : 'No. This is an internal QA reference project used only to test Natanel Studio.',
        },
        {
          question: rtl ? 'האם התשלום אמיתי?' : 'Is checkout real?',
          answer: rtl
            ? 'הייצוא משתמש בזרימת Shopify אמיתית; בחנות בדיקה אין לבצע עסקה אמיתית.'
            : 'The export uses native Shopify commerce flows; the reference store is not intended for real transactions.',
        },
      ],
    },
    assetIds: [],
  });

  const about = readySection({
    id: 'qa-about',
    name: rtl ? 'אודות הרפרנס' : 'About the Reference',
    componentRegistryId: 'hero-minimal-luxury-01',
    purpose: 'Explain the QA fixture',
    order: 1,
    motionPreset: 'clipReveal',
    content: {
      kicker: rtl ? 'QA / REFERENCE' : 'QA / REFERENCE',
      headline: rtl ? 'חנות אחת שבודקת את כל המערכת.' : 'One store that tests the whole system.',
      description: rtl
        ? 'הפרויקט הזה נשמר במכוון פשוט ושקוף: הוא בודק עיצוב, RTL, תוכן, נכסים וייצוא Shopify בלי להתחזות למותג אמיתי.'
        : 'This project stays deliberately transparent: it tests design, content, assets and Shopify export without pretending to be a real brand.',
      primaryCtaLabel: rtl ? 'חזרה לחנות' : 'Back to shop',
      primaryCtaHref: '/shop',
    },
    assetIds: [],
  });

  project.pages = [
    {
      id: 'qa-home',
      name: rtl ? 'בית' : 'Home',
      slug: '/',
      purpose: 'Reference storefront home',
      sections: [nav, productHero('qa-home-product', 1), faq, footer],
    },
    {
      id: 'qa-shop',
      name: rtl ? 'חנות' : 'Shop',
      slug: '/shop',
      purpose: 'Reference collection catalog',
      sections: [productGrid],
    },
    {
      id: 'qa-product',
      name: rtl ? 'מוצר' : 'Product',
      slug: '/product',
      purpose: 'Reference product template',
      sections: [productHero('qa-product-hero', 1), details],
    },
    {
      id: 'qa-about-page',
      name: rtl ? 'אודות' : 'About',
      slug: '/about',
      purpose: 'Reference project explanation',
      sections: [about],
    },
  ];

  project.exportConfig = {
    target: 'shopify',
    settings: {},
    status: 'ready',
  };

  return project;
}
