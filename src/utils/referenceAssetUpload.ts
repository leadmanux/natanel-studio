import type { ProjectReferenceAsset, ReferenceAssetCategory } from '@shared/project';

const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.76;

const RATIOS = [
  ['1:1', 1],
  ['4:5', 4 / 5],
  ['3:4', 3 / 4],
  ['9:16', 9 / 16],
  ['16:9', 16 / 9],
  ['21:9', 21 / 9],
  ['4:1', 4],
  ['8:1', 8],
] as const;

function nearestAspectRatio(width: number, height: number): '1:1' | '4:5' | '3:4' | '9:16' | '16:9' | '21:9' | '4:1' | '8:1' {
  const ratio = width / Math.max(1, height);
  return [...RATIOS]
    .sort((a, b) => Math.abs(a[1] - ratio) - Math.abs(b[1] - ratio))[0][0];
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.onload = () => resolve(String(reader.result || ''));
    reader.readAsDataURL(file);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not decode the uploaded image.'));
    image.src = dataUrl;
  });
}

export async function fileToReferenceAsset(
  file: File,
  category: ReferenceAssetCategory,
  isPrimary = false
): Promise<ProjectReferenceAsset> {
  if (!file.type.startsWith('image/')) {
    throw new Error(`${file.name} is not an image.`);
  }

  const source = await readFile(file);
  const image = await loadImage(source);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Image processing is not supported in this browser.');

  context.drawImage(image, 0, 0, width, height);

  const preserveTransparency = category === 'logo' && file.type === 'image/png';
  const mimeType = preserveTransparency ? 'image/png' : 'image/jpeg';
  const dataUrl = canvas.toDataURL(mimeType, preserveTransparency ? undefined : JPEG_QUALITY);

  return {
    id: `ref-${category}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    category,
    name: file.name,
    mimeType,
    dataUrl,
    isPrimary,
    width,
    height,
    aspectRatio: nearestAspectRatio(width, height),
    createdAt: new Date().toISOString(),
  };
}
