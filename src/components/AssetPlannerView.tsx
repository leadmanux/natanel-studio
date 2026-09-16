import React, { useState } from 'react';
import type { Project, GeneratedAsset } from '@shared/project';
import { requestAssetPlan, requestImageGeneration } from '../ai/client';
import {
  Sparkles,
  Image as ImageIcon,
  RefreshCw,
  Sliders,
  CheckCircle2,
  ExternalLink,
  Download,
  AlertCircle,
  Camera,
  Layers,
} from 'lucide-react';

interface AssetPlannerViewProps {
  project: Project;
  onUpdateProject: (updated: Project) => void;
}

export function AssetPlannerView({ project, onUpdateProject }: AssetPlannerViewProps) {
  const [isPlanning, setIsPlanning] = useState(false);
  const [generatingAssetId, setGeneratingAssetId] = useState<string | null>(null);
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [generationErrors, setGenerationErrors] = useState<Record<string, string>>({});

  const assets = project.assets || [];

  const handlePlanAssets = async () => {
    setIsPlanning(true);
    setPlannerError(null);
    try {
      const planned = await requestAssetPlan(project);
      const updated: Project = {
        ...project,
        assets: planned,
      };
      onUpdateProject(updated);
    } catch (err: any) {
      setPlannerError(err.message || 'Failed to plan website asset manifest.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGenerateAsset = async (asset: GeneratedAsset) => {
    setGeneratingAssetId(asset.id);
    setGenerationErrors((prev) => ({ ...prev, [asset.id]: '' }));

    try {
      // Update status to generating
      const inProgressAssets = assets.map((a) => (a.id === asset.id ? { ...a, status: 'generating' as const } : a));
      onUpdateProject({ ...project, assets: inProgressAssets });

      const response = await requestImageGeneration({
        prompt: asset.prompt,
        negativePrompt: asset.negativePrompt,
        aspectRatio: asset.aspectRatio,
        resolution: asset.resolution,
      });

      const outputUrl = `data:${response.mimeType};base64,${response.base64Data}`;

      const updatedAssets = assets.map((a) =>
        a.id === asset.id
          ? {
              ...a,
              status: 'generated' as const,
              outputUrl,
            }
          : a
      );

      onUpdateProject({ ...project, assets: updatedAssets });
    } catch (err: any) {
      setGenerationErrors((prev) => ({ ...prev, [asset.id]: err.message || 'Image generation failed.' }));
      const failedAssets = assets.map((a) => (a.id === asset.id ? { ...a, status: 'failed' as const } : a));
      onUpdateProject({ ...project, assets: failedAssets });
    } finally {
      setGeneratingAssetId(null);
    }
  };

  return (
    <div className="asset-planner-view">
      <div className="section-intro">
        <div>
          <span className="eyebrow">STAGE 03 / PRODUCTION ASSETS</span>
          <h2>Website Asset Manifest & Visual Consistency</h2>
          <p className="section-description">
            Before executing generation, a complete asset manifest maps every panoramic banner, case-study elevation,
            and executive portrait. Visual consistency instructions lock lighting, focal length, and material reality
            across the suite via <code className="code-pill">gemini-3.1-flash-image</code>.
          </p>
        </div>
        <button className="primary-button" disabled={isPlanning} onClick={handlePlanAssets}>
          {isPlanning ? (
            <><RefreshCw size={14} className="spin" /> Generating Manifest...</>
          ) : (
            <><Sparkles size={15} /> {assets.length > 0 ? 'Re-plan Asset Manifest' : 'Generate Asset Manifest'}</>
          )}
        </button>
      </div>

      {plannerError && <div className="error-banner">{plannerError}</div>}

      {assets.length === 0 && !isPlanning && (
        <div className="empty-state-box">
          <ImageIcon size={32} strokeWidth={1.2} />
          <h3>No visual assets planned yet</h3>
          <p>
            Generate a full website asset manifest tailored to {project.business.businessName || 'this brand'},
            featuring 21:9 panoramic banners, 4:1 elevations, and authentic 4:5 portraits.
          </p>
          <button className="primary-button" onClick={handlePlanAssets} style={{ marginTop: '16px' }}>
            Generate Manifest
          </button>
        </div>
      )}

      {assets.length > 0 && (
        <div className="assets-manifest-grid">
          {assets.map((asset) => {
            const isGenerating = generatingAssetId === asset.id;
            const error = generationErrors[asset.id];

            return (
              <article key={asset.id} className={`asset-manifest-card status-${asset.status}`}>
                {/* Asset preview if generated */}
                {asset.outputUrl ? (
                  <div className="asset-image-frame" data-aspect={asset.aspectRatio}>
                    <img
                      src={asset.outputUrl}
                      alt={asset.purpose}
                      className="generated-image"
                      referrerPolicy="no-referrer"
                    />
                    <div className="asset-generated-overlay">
                      <span className="gen-badge">
                        <CheckCircle2 size={13} /> GENERATED ({asset.resolution})
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="asset-placeholder-frame" data-aspect={asset.aspectRatio}>
                    <div className="frame-center-content">
                      <Camera size={26} strokeWidth={1.3} />
                      <span className="aspect-label">{asset.aspectRatio}</span>
                      <span className="res-label">{asset.resolution} • {asset.model}</span>
                    </div>
                  </div>
                )}

                <div className="asset-body">
                  <div className="asset-meta-row">
                    <span className="asset-id-code">{asset.id}</span>
                    <div className="meta-badges">
                      <span className="aspect-pill">{asset.aspectRatio}</span>
                      <span className="res-pill">{asset.resolution}</span>
                      <span className={`status-pill status-${asset.status}`}>{asset.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <h3 className="asset-purpose">{asset.purpose}</h3>
                  <div className="asset-section-link">
                    Page: <strong>{asset.pageId || 'Home'}</strong> • Section: <strong>{asset.sectionId}</strong>
                  </div>

                  <div className="asset-prompt-box">
                    <span className="box-title">Photographic Prompt:</span>
                    <p className="prompt-text">{asset.prompt}</p>
                  </div>

                  {asset.visualConsistencyInstructions && (
                    <div className="consistency-box">
                      <span className="box-title">Visual Consistency Standard:</span>
                      <p className="consistency-text">{asset.visualConsistencyInstructions}</p>
                    </div>
                  )}

                  {error && (
                    <div className="error-banner-small">
                      <AlertCircle size={13} /> {error}
                    </div>
                  )}

                  <div className="asset-card-actions">
                    <button
                      className="primary-button full-width"
                      disabled={isGenerating}
                      onClick={() => handleGenerateAsset(asset)}
                    >
                      {isGenerating ? (
                        <><RefreshCw size={14} className="spin" /> Generating via Gemini 3.1 Flash Image...</>
                      ) : asset.outputUrl ? (
                        <><RefreshCw size={14} /> Regenerate Image</>
                      ) : (
                        <><Sparkles size={14} /> Generate with gemini-3.1-flash-image</>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
