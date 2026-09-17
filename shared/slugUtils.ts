/**
 * Utilities for generating stable, clean ASCII slugs for pages,
 * including robust transliteration and semantic dictionary translation for Hebrew.
 */

const HEBREW_SEMANTIC_SLUG_MAP: Record<string, string> = {
  ראשי: 'home',
  בית: 'home',
  'דף הבית': 'home',
  'עמוד ראשי': 'home',
  אודות: 'about',
  'אודותינו': 'about',
  'מי אנחנו': 'about',
  'על הסטודיו': 'about',
  'הסטודיו': 'studio',
  סיפור: 'story',
  שירותים: 'services',
  'השירותים שלנו': 'services',
  'תחומי פעילות': 'services',
  התמחויות: 'disciplines',
  פרויקטים: 'projects',
  'פרויקטים נבחרים': 'portfolio',
  עבודות: 'portfolio',
  תיק: 'portfolio',
  'תיק עבודות': 'portfolio',
  גלריה: 'gallery',
  קטלוג: 'catalog',
  מוצרים: 'products',
  חנות: 'shop',
  מוצר: 'product',
  'צור קשר': 'contact',
  'יצירת קשר': 'contact',
  קשר: 'contact',
  פנייה: 'inquire',
  ייעוץ: 'consultation',
  'פגישת ייעוץ': 'consultation',
  'שאלות ותשובות': 'faq',
  שאלות: 'faq',
  בלוג: 'journal',
  מאמרים: 'articles',
  חדשות: 'news',
  'תנאי שימוש': 'terms',
  'מדיניות פרטיות': 'privacy',
  נגישות: 'accessibility',
  הצהרת: 'statement',
  הצהרה: 'statement',
  סל: 'cart',
  'סל קניות': 'cart',
  תשלום: 'checkout',
  'קופה': 'checkout',
};

const HEBREW_TRANSLITERATION_MAP: Record<string, string> = {
  א: 'a',
  ב: 'b',
  ג: 'g',
  ד: 'd',
  ה: 'h',
  ו: 'v',
  ז: 'z',
  ח: 'ch',
  ט: 't',
  י: 'y',
  כ: 'k',
  ך: 'k',
  ל: 'l',
  מ: 'm',
  ם: 'm',
  נ: 'n',
  ן: 'n',
  ס: 's',
  ע: 'a',
  פ: 'p',
  ף: 'p',
  צ: 'tz',
  ץ: 'tz',
  ק: 'k',
  ר: 'r',
  ש: 'sh',
  ת: 't',
};

/**
 * Generates a stable, lowercase, ASCII URL slug from any page name,
 * with first-class handling for Hebrew names.
 *
 * Examples:
 * - "Home" -> "/"
 * - "ראשי" -> "/"
 * - "אודות הסטודיו" -> "/about-studio"
 * - "שירותים" -> "/services"
 * - "צור קשר" -> "/contact"
 * - "וילת שונית" -> "/vilat-shunit"
 */
export function generatePageSlug(name: string, isHome = false): string {
  const trimmed = (name || '').trim();
  if (!trimmed || isHome || trimmed.toLowerCase() === 'home') {
    return '/';
  }

  const lowerName = trimmed.toLowerCase();

  // 1. Direct semantic dictionary match
  if (HEBREW_SEMANTIC_SLUG_MAP[lowerName]) {
    return `/${HEBREW_SEMANTIC_SLUG_MAP[lowerName]}`;
  }

  // 2. Check compound phrases in dictionary
  for (const [hebrewKey, englishSlug] of Object.entries(HEBREW_SEMANTIC_SLUG_MAP)) {
    if (lowerName === hebrewKey) {
      return `/${englishSlug}`;
    }
  }

  // 3. If mostly Latin characters, standardize using standard ASCII kebab-case
  const hasHebrew = /[\u0590-\u05FF]/.test(trimmed);
  if (!hasHebrew) {
    const ascii = lowerName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return ascii ? `/${ascii}` : '/page';
  }

  // 4. Hebrew transliteration & token mapping
  const words = trimmed.split(/\s+/);
  const translatedTokens: string[] = [];

  for (const word of words) {
    const cleanWord = word.replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '').toLowerCase();
    if (!cleanWord) continue;

    if (HEBREW_SEMANTIC_SLUG_MAP[cleanWord]) {
      translatedTokens.push(HEBREW_SEMANTIC_SLUG_MAP[cleanWord]);
      continue;
    }

    // Transliterate letter by letter
    let transliterated = '';
    for (const char of cleanWord) {
      if (HEBREW_TRANSLITERATION_MAP[char]) {
        transliterated += HEBREW_TRANSLITERATION_MAP[char];
      } else if (/[a-z0-9]/.test(char)) {
        transliterated += char;
      }
    }

    if (transliterated) {
      translatedTokens.push(transliterated);
    }
  }

  const combined = translatedTokens.join('-').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return combined ? `/${combined}` : '/page';
}

/**
 * Ensures a slug is strictly unique among existing page slugs by appending an index if needed.
 */
export function ensureUniqueSlug(desiredSlug: string, existingSlugs: string[]): string {
  const existingSet = new Set(existingSlugs.map((s) => s.toLowerCase()));
  if (!existingSet.has(desiredSlug.toLowerCase())) {
    return desiredSlug;
  }

  // If '/' is already taken and desired is '/', return '/' (home is canonical)
  if (desiredSlug === '/') {
    return '/';
  }

  let counter = 2;
  let candidate = `${desiredSlug}-${counter}`;
  while (existingSet.has(candidate.toLowerCase())) {
    counter++;
    candidate = `${desiredSlug}-${counter}`;
  }
  return candidate;
}
