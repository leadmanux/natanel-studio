import fs from 'fs/promises';
import path from 'path';
import JSZip from 'jszip';

/** Adds the Studio's global responsive/layout CSS to the generated standalone React package. */
export async function normalizeReactSourceZip(buffer: Buffer): Promise<Buffer> {
  const source = await JSZip.loadAsync(buffer);
  const files = Object.keys(source.files).filter((name) => !source.files[name].dir);
  const appEntry = files.find((name) => name.endsWith('/src/App.tsx'));
  if (!appEntry) throw new Error('Generated React artifact does not contain src/App.tsx.');
  const prefix = appEntry.slice(0, -'src/App.tsx'.length);
  const cssPath = `${prefix}src/site.css`;
  const existingCss = source.files[cssPath]
    ? await source.files[cssPath].async('string')
    : '';
  let studioCss = '';
  try {
    studioCss = await fs.readFile(path.join(process.cwd(), 'src', 'index.css'), 'utf8');
  } catch {
    // Export remains usable with component inline styles if source CSS is unavailable.
  }
  source.file(cssPath, `${studioCss}\n${existingCss}`);
  return source.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
}
