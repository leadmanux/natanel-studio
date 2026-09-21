import React, { useRef, useState } from 'react';
import type { ProjectReferenceAsset, ReferenceAssetCategory } from '@shared/project';
import { Camera, Image as ImageIcon, Package, Star, Trash2, Upload } from 'lucide-react';
import { fileToReferenceAsset } from '../utils/referenceAssetUpload';

interface ShopifyReferenceAssetsProps {
  assets: ProjectReferenceAsset[];
  onChange: (assets: ProjectReferenceAsset[]) => void;
}

const MAX_REFERENCE_ASSETS = 8;

const categoryMeta: Record<ReferenceAssetCategory, { label: string; help: string }> = {
  product: {
    label: 'Product Photos',
    help: 'Upload the real product from multiple useful angles. These are the most important references.',
  },
  lifestyle: {
    label: 'Lifestyle / UGC',
    help: 'Upload real usage, vanity, people, environment or campaign photos that show the desired context.',
  },
  packaging: {
    label: 'Packaging',
    help: 'Optional box, bottle, insert or unboxing references.',
  },
  logo: {
    label: 'Logo / Brand Mark',
    help: 'Optional logo or brand mark for visual identity context.',
  },
  inspiration: {
    label: 'Visual Inspiration',
    help: 'Optional reference imagery for mood only. Do not use competitor products as product identity references.',
  },
};

export function ShopifyReferenceAssets({ assets, onChange }: ShopifyReferenceAssetsProps) {
  const [uploadingCategory, setUploadingCategory] = useState<ReferenceAssetCategory | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<Partial<Record<ReferenceAssetCategory, HTMLInputElement | null>>>({});

  const addFiles = async (category: ReferenceAssetCategory, files: FileList | null) => {
    if (!files?.length) return;
    setError(null);

    const remaining = MAX_REFERENCE_ASSETS - assets.length;
    if (remaining <= 0) {
      setError(`You can keep up to ${MAX_REFERENCE_ASSETS} reference images in a project.`);
      return;
    }

    setUploadingCategory(category);
    try {
      const selected = Array.from(files).slice(0, remaining);
      const hasPrimaryProduct = assets.some((asset) => asset.category === 'product' && asset.isPrimary);
      const created: ProjectReferenceAsset[] = [];

      for (let index = 0; index < selected.length; index += 1) {
        created.push(
          await fileToReferenceAsset(
            selected[index],
            category,
            category === 'product' && !hasPrimaryProduct && index === 0
          )
        );
      }

      onChange([...assets, ...created]);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Reference upload failed.');
    } finally {
      setUploadingCategory(null);
      const input = inputRefs.current[category];
      if (input) input.value = '';
    }
  };

  const removeAsset = (id: string) => {
    const removed = assets.find((asset) => asset.id === id);
    const next = assets.filter((asset) => asset.id !== id);

    if (removed?.category === 'product' && removed.isPrimary) {
      const firstProduct = next.find((asset) => asset.category === 'product');
      if (firstProduct) {
        onChange(next.map((asset) => ({ ...asset, isPrimary: asset.id === firstProduct.id })));
        return;
      }
    }
    onChange(next);
  };

  const markPrimary = (id: string) => {
    onChange(
      assets.map((asset) =>
        asset.category === 'product'
          ? { ...asset, isPrimary: asset.id === id }
          : asset
      )
    );
  };

  const updateNotes = (id: string, notes: string) => {
    onChange(assets.map((asset) => (asset.id === id ? { ...asset, notes } : asset)));
  };

  const groups: ReferenceAssetCategory[] = ['product', 'lifestyle', 'packaging', 'logo'];

  return (
    <section className="form-card setup-card reference-assets-card">
      <div className="card-header-line">
        <Camera size={16} />
        <div>
          <h3>Product & Brand References</h3>
          <span className="card-help">
            These images are sent to Design Brain, image planning and content creation so the site understands the real product and visual world.
          </span>
        </div>
      </div>

      <div className="reference-why-box">
        <strong>Upload these before Design.</strong>
        <span>
          Start with 2–5 clear product photos, then add lifestyle/UGC. The AI should reference the real product rather than inventing its appearance.
        </span>
      </div>

      <div className="reference-upload-grid">
        {groups.map((category) => {
          const meta = categoryMeta[category];
          const count = assets.filter((asset) => asset.category === category).length;
          const Icon = category === 'product' ? ImageIcon : category === 'lifestyle' ? Camera : Package;
          return (
            <div className="reference-upload-zone" key={category}>
              <Icon size={18} />
              <div>
                <strong>{meta.label}</strong>
                <span>{meta.help}</span>
              </div>
              <button
                type="button"
                className="secondary-button"
                disabled={uploadingCategory !== null || assets.length >= MAX_REFERENCE_ASSETS}
                onClick={() => inputRefs.current[category]?.click()}
              >
                <Upload size={13} />
                {uploadingCategory === category ? 'Processing...' : count ? `Add more (${count})` : 'Upload'}
              </button>
              <input
                ref={(element) => {
                  inputRefs.current[category] = element;
                }}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={(event) => addFiles(category, event.target.files)}
              />
            </div>
          );
        })}
      </div>

      {error && <div className="error-banner-small">{error}</div>}

      {assets.length > 0 && (
        <div className="reference-asset-gallery">
          {assets.map((asset) => (
            <article className="reference-asset-item" key={asset.id}>
              <div className="reference-asset-image">
                <img src={asset.dataUrl} alt={asset.name} />
                <span>{categoryMeta[asset.category].label}</span>
                {asset.isPrimary && <strong className="primary-reference-badge"><Star size={10} /> Primary product</strong>}
              </div>
              <div className="reference-asset-controls">
                <div className="reference-asset-name" title={asset.name}>{asset.name}</div>
                <input
                  type="text"
                  value={asset.notes || ''}
                  placeholder="Optional note: front view, box, bathroom UGC..."
                  onChange={(event) => updateNotes(asset.id, event.target.value)}
                />
                <div className="reference-asset-actions">
                  {asset.category === 'product' && !asset.isPrimary && (
                    <button type="button" onClick={() => markPrimary(asset.id)}>
                      <Star size={12} /> Make primary
                    </button>
                  )}
                  <button type="button" className="danger-link" onClick={() => removeAsset(asset.id)}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="reference-asset-footer">
        <span>{assets.length}/{MAX_REFERENCE_ASSETS} references saved with this project.</span>
        <span>Images are resized before storage to keep the Studio project lightweight.</span>
      </div>
    </section>
  );
}
