import JSZip from 'jszip';

/** Shopify requires layout/, sections/, templates/, assets/ and config/ at the ZIP root. */
export async function normalizeShopifyThemeZip(buffer: Buffer): Promise<Buffer> {
  const source = await JSZip.loadAsync(buffer);
  const files = Object.keys(source.files).filter((name) => !source.files[name].dir);
  if (files.some((name) => name === 'layout/theme.liquid')) return buffer;

  const themeEntry = files.find((name) => name.endsWith('/layout/theme.liquid'));
  if (!themeEntry) throw new Error('Generated Shopify artifact does not contain layout/theme.liquid.');
  const prefix = themeEntry.slice(0, -'layout/theme.liquid'.length);
  const normalized = new JSZip();

  for (const name of files) {
    if (!name.startsWith(prefix)) continue;
    const relative = name.slice(prefix.length);
    if (!relative) continue;
    const content = await source.files[name].async('nodebuffer');
    normalized.file(relative, content);
  }

  return normalized.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
