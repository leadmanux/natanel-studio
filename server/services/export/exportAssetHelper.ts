import { lookup as dnsLookup } from 'node:dns/promises';
import net from 'node:net';
import type { Project } from '../../../shared/project';
import type { ComponentDefinition } from '../../../shared/componentRegistry';
import { resolveSectionAssets } from '../../../shared/assetBinding';

const MAX_ASSET_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const SUPPORTED_MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

export interface ProcessedAsset {
  id: string;
  filename: string;
  buffer: Buffer;
  alt: string;
  originalUrl: string;
  aspectRatio?: string;
}

export interface CollectedProjectAssets {
  assets: ProcessedAsset[];
  urlToFilenameMap: Map<string, string>;
  idToFilenameMap: Map<string, string>;
}

export interface ExportAssetFetchOptions {
  fetchImpl?: typeof fetch;
  resolveHostname?: (hostname: string) => Promise<string[]>;
  timeoutMs?: number;
  maxBytes?: number;
}

export class ExportAssetError extends Error {
  constructor(public assetId: string, message: string) {
    super(message);
    this.name = 'ExportAssetError';
  }
}

/**
 * Collects only assets actually resolved into exported sections and localizes their
 * real bytes. Required remote assets are never replaced with generated placeholders.
 */
export async function collectAndProcessExportAssets(
  project: Project,
  canonicalComponents: ComponentDefinition[],
  options: ExportAssetFetchOptions = {}
): Promise<CollectedProjectAssets> {
  const componentLookup = new Map(canonicalComponents.map((component) => [component.id, component]));
  const assets: ProcessedAsset[] = [];
  const urlToFilenameMap = new Map<string, string>();
  const idToFilenameMap = new Map<string, string>();
  const processedAssetIds = new Set<string>();

  for (const page of project.pages || []) {
    for (const section of page.sections || []) {
      const component = componentLookup.get(section.componentRegistryId);
      if (!component) continue;

      const resolution = resolveSectionAssets(section, component, project.assets, page.id);
      for (const assetId of resolution.boundAssetIds) {
        if (processedAssetIds.has(assetId)) continue;
        processedAssetIds.add(assetId);

        const asset = project.assets.find((candidate) => candidate.id === assetId);
        if (!asset?.outputUrl) {
          throw new ExportAssetError(assetId, `Export asset "${assetId}" has no outputUrl.`);
        }

        let parsed: { buffer: Buffer; ext: string };
        try {
          parsed = asset.outputUrl.startsWith('data:')
            ? parseDataUrl(asset.outputUrl)
            : await fetchRemoteAsset(asset.outputUrl, options);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          throw new ExportAssetError(assetId, `Could not localize required export asset "${assetId}": ${reason}`);
        }

        const cleanPurpose = sanitizeFilenamePart(asset.purpose || 'image').slice(0, 28) || 'image';
        const cleanId = sanitizeFilenamePart(asset.id).slice(0, 12) || 'asset';
        const filename = `${cleanPurpose}-${cleanId}.${parsed.ext}`;
        const processed: ProcessedAsset = {
          id: asset.id,
          filename,
          buffer: parsed.buffer,
          alt: asset.purpose || `${section.name} image`,
          originalUrl: asset.outputUrl,
          aspectRatio: asset.aspectRatio,
        };

        assets.push(processed);
        urlToFilenameMap.set(asset.outputUrl, filename);
        idToFilenameMap.set(asset.id, filename);
      }
    }
  }

  return { assets, urlToFilenameMap, idToFilenameMap };
}

export function parseDataUrl(outputUrl: string): { buffer: Buffer; ext: string } {
  const match = outputUrl.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new Error('Unsupported data URL format; expected base64 image data.');

  const mime = match[1].toLowerCase();
  const ext = SUPPORTED_MIME_TO_EXT[mime];
  if (!ext) throw new Error(`Unsupported image MIME type "${mime}".`);

  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  if (!buffer.length) throw new Error('Image data URL decoded to an empty file.');
  if (buffer.length > MAX_ASSET_BYTES) throw new Error(`Image exceeds ${MAX_ASSET_BYTES} byte export limit.`);
  return { buffer, ext };
}

export async function fetchRemoteAsset(
  outputUrl: string,
  options: ExportAssetFetchOptions = {}
): Promise<{ buffer: Buffer; ext: string }> {
  const fetchImpl = options.fetchImpl || fetch;
  const resolveHostname = options.resolveHostname || defaultResolveHostname;
  const timeoutMs = options.timeoutMs ?? 12_000;
  const maxBytes = options.maxBytes ?? MAX_ASSET_BYTES;

  let currentUrl = outputUrl;
  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    const url = new URL(currentUrl);
    await assertSafeRemoteUrl(url, resolveHostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let response: Response;
    try {
      response = await fetchImpl(url, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: { Accept: 'image/avif,image/webp,image/png,image/jpeg,image/gif,image/svg+xml' },
      });
    } finally {
      clearTimeout(timer);
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error(`Remote asset redirect ${response.status} omitted Location header.`);
      if (redirectCount === MAX_REDIRECTS) throw new Error('Remote asset exceeded redirect limit.');
      currentUrl = new URL(location, url).toString();
      continue;
    }

    if (!response.ok) throw new Error(`Remote asset request failed with HTTP ${response.status}.`);

    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    const ext = SUPPORTED_MIME_TO_EXT[mime];
    if (!ext) throw new Error(`Remote asset returned unsupported Content-Type "${mime || 'missing'}".`);

    const contentLength = Number(response.headers.get('content-length') || 0);
    if (contentLength > maxBytes) throw new Error(`Remote asset exceeds ${maxBytes} byte export limit.`);

    if (!response.body) throw new Error('Remote asset response contained no body.');
    const reader = response.body.getReader();
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error(`Remote asset exceeds ${maxBytes} byte export limit.`);
      }
      chunks.push(value);
    }

    if (!total) throw new Error('Remote asset response was empty.');
    return { buffer: Buffer.concat(chunks.map((chunk) => Buffer.from(chunk))), ext };
  }

  throw new Error('Remote asset redirect resolution failed.');
}

async function defaultResolveHostname(hostname: string): Promise<string[]> {
  const directFamily = net.isIP(hostname);
  if (directFamily) return [hostname];
  const results = await dnsLookup(hostname, { all: true, verbatim: true });
  return results.map((entry) => entry.address);
}

async function assertSafeRemoteUrl(
  url: URL,
  resolveHostname: (hostname: string) => Promise<string[]>
): Promise<void> {
  if (url.protocol !== 'https:') throw new Error('Only HTTPS remote assets may be exported.');
  if (url.username || url.password) throw new Error('Authenticated asset URLs are not allowed.');

  const hostname = url.hostname.toLowerCase();
  if (hostname === 'localhost' || hostname.endsWith('.localhost') || hostname.endsWith('.local')) {
    throw new Error('Local/private asset hosts are not allowed.');
  }

  const addresses = await resolveHostname(hostname);
  if (!addresses.length) throw new Error('Remote asset hostname did not resolve.');
  for (const address of addresses) {
    if (isPrivateOrReservedAddress(address)) {
      throw new Error(`Remote asset resolved to private/reserved address ${address}.`);
    }
  }
}

function isPrivateOrReservedAddress(address: string): boolean {
  const family = net.isIP(address);
  if (family === 4) {
    const [a, b] = address.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 0) ||
      (a === 192 && b === 168) ||
      (a === 198 && (b === 18 || b === 19)) ||
      a >= 224
    );
  }
  if (family === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === '::' ||
      normalized === '::1' ||
      normalized.startsWith('fc') ||
      normalized.startsWith('fd') ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb') ||
      normalized.startsWith('ff')
    );
  }
  return true;
}

function sanitizeFilenamePart(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Rewrites exact source asset URLs inside rendered markup to a caller-provided path prefix. */
export function rewriteAssetUrlsInHtml(
  html: string,
  urlToFilenameMap: Map<string, string>,
  targetPrefix: string
): string {
  let result = html;
  for (const [originalUrl, filename] of urlToFilenameMap.entries()) {
    if (!originalUrl) continue;
    result = result.split(originalUrl).join(`${targetPrefix.replace(/\/$/, '')}/${filename}`);
  }
  return result;
}
