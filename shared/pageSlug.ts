const HEBREW_TRANSLITERATION: Record<string, string> = {
  א: 'a', ב: 'b', ג: 'g', ד: 'd', ה: 'h', ו: 'v', ז: 'z', ח: 'h', ט: 't', י: 'y',
  כ: 'k', ך: 'k', ל: 'l', מ: 'm', ם: 'm', נ: 'n', ן: 'n', ס: 's', ע: 'a', פ: 'p', ף: 'p',
  צ: 'ts', ץ: 'ts', ק: 'k', ר: 'r', ש: 'sh', ת: 't',
};

export function createStablePageSlug(pageName: string, index: number, used: Set<string>): string {
  const normalizedName = pageName.trim();
  if (index === 0 || normalizedName.toLowerCase() === 'home' || normalizedName === 'ראשי') {
    if (!used.has('/')) {
      used.add('/');
      return '/';
    }
  }

  const transliterated = Array.from(normalizedName)
    .map((char) => HEBREW_TRANSLITERATION[char] ?? char)
    .join('');

  let base = transliterated
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!base) base = `page-${index + 1}`;

  let candidate = `/${base}`;
  let suffix = 2;
  while (used.has(candidate)) candidate = `/${base}-${suffix++}`;
  used.add(candidate);
  return candidate;
}

export function normalizeManualSlug(value: string): string {
  const raw = value.trim();
  if (!raw || raw === '/') return '/';
  const cleaned = raw
    .replace(/^\/+/, '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
  return cleaned ? `/${cleaned}` : '/';
}
