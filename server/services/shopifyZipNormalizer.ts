import JSZip from 'jszip';

function decodeDataImage(value: string): { extension: string; buffer: Buffer } | null {
  const match = value.match(/^data:image\/([^;]+);base64,(.+)$/s);
  if (!match) return null;
  const rawType = match[1].toLowerCase();
  const extension = rawType === 'jpeg' ? 'jpg' : rawType === 'svg+xml' ? 'svg' : rawType.replace(/[^a-z0-9]/g, '') || 'png';
  return { extension, buffer: Buffer.from(match[2], 'base64') };
}

/**
 * Shopify requires layout/, sections/, templates/, assets/ and config/ at the ZIP root.
 * This normalizer also converts Nano Banana data-URL images into packaged theme assets so
 * template JSON stays compact and the exported theme is self-contained.
 */
export async function normalizeShopifyThemeZip(buffer: Buffer): Promise<Buffer> {
  const source = await JSZip.loadAsync(buffer);
  const files = Object.keys(source.files).filter((name) => !source.files[name].dir);
  const themeEntry = files.find((name) => name === 'layout/theme.liquid' || name.endsWith('/layout/theme.liquid'));
  if (!themeEntry) throw new Error('Generated Shopify artifact does not contain layout/theme.liquid.');
  const prefix = themeEntry === 'layout/theme.liquid' ? '' : themeEntry.slice(0, -'layout/theme.liquid'.length);
  const normalized = new JSZip();
  let assetCounter = 0;

  for (const name of files) {
    if (!name.startsWith(prefix)) continue;
    const relative = name.slice(prefix.length);
    if (!relative) continue;

    if (relative.startsWith('templates/') && relative.endsWith('.json')) {
      const raw = await source.files[name].async('string');
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        normalized.file(relative, raw);
        continue;
      }

      const sections = parsed?.sections && typeof parsed.sections === 'object' ? parsed.sections : {};
      for (const section of Object.values(sections) as any[]) {
        const settings = section?.settings;
        if (!settings || typeof settings !== 'object' || typeof settings.image_url !== 'string') continue;
        const decoded = decodeDataImage(settings.image_url);
        if (!decoded) continue;
        assetCounter += 1;
        const filename = `natanel-generated-${assetCounter}.${decoded.extension}`;
        normalized.file(`assets/${filename}`, decoded.buffer);
        settings.image_asset = filename;
        settings.image_url = '';
      }
      normalized.file(relative, JSON.stringify(parsed, null, 2));
      continue;
    }

    if (relative === 'sections/natanel-studio-section.liquid') {
      let liquid = await source.files[name].async('string');
      liquid = liquid.replace(
        `{% if section.settings.image_url != blank %}<figure class="ns-media"><img src="{{ section.settings.image_url | escape }}" alt="{{ section.settings.heading | escape }}" loading="lazy"></figure>{% endif %}`,
        `{% assign ns_image = section.settings.image_url %}{% if section.settings.image_asset != blank %}{% assign ns_image = section.settings.image_asset | asset_url %}{% endif %}{% if ns_image != blank %}<figure class="ns-media"><img src="{{ ns_image | escape }}" alt="{{ section.settings.heading | escape }}" loading="lazy"></figure>{% endif %}`
      );
      liquid = liquid.replace(
        `{ "type": "text", "id": "image_url", "label": "Generated image URL" }`,
        `{ "type": "text", "id": "image_url", "label": "Generated image URL" },\n    { "type": "text", "id": "image_asset", "label": "Packaged image asset" }`
      );
      normalized.file(relative, liquid);
      continue;
    }

    normalized.file(relative, await source.files[name].async('nodebuffer'));
  }

  return normalized.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
