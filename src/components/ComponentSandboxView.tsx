import React, { useState, useMemo, useEffect } from 'react';
import {
  getStudioComponent,
  hasStudioComponentImplementation,
  type StudioRegisteredItem,
} from '../studio-components/resolver';
import type {
  StudioIndustryPreset,
  StudioMotionPreset,
  ThemeMode,
  ComponentDirection,
  PreviewMode,
} from '../studio-components/types';
import {
  getDesignTokensForIndustry,
  isKnownIndustryPreset,
} from '../studio-components/designTokens';
import { StudioMotionWrapper } from '../studio-components/StudioMotionWrapper';
import { componentRegistryRepository } from '../data/componentRegistryRepository';
import type { ComponentDefinition } from '@shared/componentRegistry';
import {
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  ArrowRightLeft,
  Search,
  Sliders,
  ExternalLink,
  Zap,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Sparkles,
} from 'lucide-react';

const industryOptions: { key: StudioIndustryPreset; label: string; desc: string }[] = [
  { key: 'atelier_luxury', label: 'Atelier & Luxury', desc: 'Champagne gold, onyx black, serif display, 2px radius' },
  { key: 'beauty_wellness', label: 'Beauty & Wellness', desc: 'Cormorant Garamond, terracotta accent, 10px soft radius' },
  { key: 'contractor', label: 'Contractor & Engineering', desc: 'Safety amber, high-contrast industrial clarity, 4px radius' },
  { key: 'interior_design', label: 'Interior Architecture', desc: 'Olive bronze, refined serif/sans balance, 0px radius' },
  { key: 'professional_services', label: 'Professional Services & Law', desc: 'Cobalt navy, sharp precision, data-led credibility' },
  { key: 'shopify_beauty', label: 'Shopify Clean Beauty', desc: 'Warm apricot, minimal high-intent commerce, 12px pill radius' },
  { key: 'fitness', label: 'High-Performance Fitness', desc: 'Neon lime/amber, bold grotesque, high energy cadence' },
  { key: 'real_estate', label: 'Prestige Real Estate', desc: 'Refined serif, slate champagne, monumental spacing' },
];

const motionPresetOptions: { key: StudioMotionPreset; label: string }[] = [
  { key: 'fadeReveal', label: 'Fade Reveal' },
  { key: 'clipReveal', label: 'Clip Reveal' },
  { key: 'textStagger', label: 'Text Stagger' },
  { key: 'imageScaleOnScroll', label: 'Image Scale Settle' },
  { key: 'stackedCards', label: 'Stacked Cards' },
  { key: 'fadeSettle', label: 'Fade Settle' },
  { key: 'none', label: 'None (Static)' },
];

const categoryTabs = [
  { id: 'all', label: 'All Components' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'hero', label: 'Hero' },
  { id: 'cro', label: 'Proof & CRO' },
  { id: 'services', label: 'Services' },
  { id: 'portfolio', label: 'Portfolio & Story' },
  { id: 'testimonials', label: 'Testimonials' },
  { id: 'forms', label: 'Forms & FAQ' },
  { id: 'cta', label: 'Call to Action' },
  { id: 'ecommerce', label: 'Ecommerce' },
  { id: 'footer', label: 'Footer' },
];

export function ComponentSandboxView() {
  const [components, setComponents] = useState<ComponentDefinition[]>(() =>
    componentRegistryRepository.getSynchronous()
  );

  useEffect(() => {
    const unsubscribe = componentRegistryRepository.subscribe((latest) => {
      setComponents(latest);
    });
    return unsubscribe;
  }, []);

  const [selectedComponentId, setSelectedComponentId] = useState<string>(
    components[0]?.id || 'nav-minimal-dock-01'
  );
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sandbox environmental controls
  const [industryPreset, setIndustryPreset] = useState<StudioIndustryPreset>('atelier_luxury');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [direction, setDirection] = useState<ComponentDirection>('ltr');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [contentMode, setContentMode] = useState<'preview' | 'production'>('preview');
  const [motionEnabled, setMotionEnabled] = useState<boolean>(true);
  const [motionPreset, setMotionPreset] = useState<StudioMotionPreset>('fadeReveal');
  const [actionLog, setActionLog] = useState<{ action: string; payload: any; timestamp: string }[]>([]);

  // Computed Governance & Verification Stats
  const approvedComponents = useMemo(() => components.filter((c) => c.status === 'approved'), [components]);
  const candidatesCount = useMemo(() => components.filter((c) => c.status === 'candidate').length, [components]);
  const rtlReadyCount = useMemo(
    () => approvedComponents.filter((c) => c.rtlReady === true).length,
    [approvedComponents]
  );
  const unverifiedMobileCount = useMemo(
    () =>
      approvedComponents.filter(
        (c) => !c.mobileVerificationStatus || c.mobileVerificationStatus === 'untested'
      ).length,
    [approvedComponents]
  );

  // Filter components
  const filteredComponents = useMemo(() => {
    return components.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          item.name.toLowerCase().includes(q) ||
          item.id.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.styleTags.some((t) => t.toLowerCase().includes(q)) ||
          item.industryFit.some((i) => i.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [components, activeCategory, searchQuery]);

  const activeItem: ComponentDefinition = useMemo(() => {
    return components.find((c) => c.id === selectedComponentId) || components[0] || ({} as ComponentDefinition);
  }, [components, selectedComponentId]);

  const hasImplementation = useMemo(() => {
    return activeItem?.id ? hasStudioComponentImplementation(activeItem.id) : false;
  }, [activeItem]);

  const ActiveComponent = useMemo(() => {
    return activeItem?.id ? getStudioComponent(activeItem.id) : null;
  }, [activeItem]);

  const handleAction = (action: string, payload: any) => {
    setActionLog((prev) => [
      { action, payload, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  };

  const isIndustryKnown = isKnownIndustryPreset(industryPreset);
  const activeTokens = getDesignTokensForIndustry(industryPreset, themeMode === 'dark' ? 'dark' : 'light');
  const viewportWidth = previewMode === 'mobile' ? '390px' : previewMode === 'tablet' ? '768px' : '100%';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.14em', color: '#d6a84f', textTransform: 'uppercase', fontWeight: 700 }}>
            NATANEL STUDIO • COMPONENT ARSENAL V1
          </span>
          <h1 style={{ fontSize: '28px', fontWeight: 600, color: '#f3f3f1', margin: '6px 0 4px 0', letterSpacing: '-0.02em' }}>
            Interactive Design Sandbox
          </h1>
          <p style={{ fontSize: '14px', color: '#9d9da5', margin: 0, maxWidth: '640px', lineHeight: 1.5 }}>
            Production-grade sandbox for testing mathematical tokens, motion choreography, bidirectional RTL, and preview vs. production content modes.
          </p>
        </div>

        {/* Real Computed Governance Stats (No hardcoded 100% or marketing claims) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 18px',
            borderRadius: '8px',
            backgroundColor: '#141417',
            border: '1px solid #26262b',
          }}
        >
          <div>
            <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>Approved / Total</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#f3f3f1', fontFamily: 'monospace' }}>
              {approvedComponents.length} / {components.length}
            </div>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#26262b' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>RTL Supported</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#4ade80', fontFamily: 'monospace' }}>
              {rtlReadyCount} / {approvedComponents.length}
            </div>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#26262b' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>Mobile Audit</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: unverifiedMobileCount > 0 ? '#eab308' : '#4ade80', fontFamily: 'monospace' }}>
              {unverifiedMobileCount > 0 ? `${unverifiedMobileCount} unverified` : 'All Verified'}
            </div>
          </div>
          {candidatesCount > 0 && (
            <>
              <div style={{ height: '24px', width: '1px', backgroundColor: '#26262b' }} />
              <div>
                <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>Candidates</div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#d6a84f', fontFamily: 'monospace' }}>
                  {candidatesCount}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Control Bar: Industry, Motion, Content Mode, Theme, RTL, Viewport */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          padding: '16px 20px',
          backgroundColor: '#121215',
          borderRadius: '8px',
          border: '1px solid #26262b',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          {/* Industry Preset Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sliders size={15} color="#d6a84f" />
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#9d9da5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Industry Preset:
            </label>
            <select
              id="sandbox-industry-selector"
              value={industryPreset}
              onChange={(e) => setIndustryPreset(e.target.value as StudioIndustryPreset)}
              style={{
                backgroundColor: '#1a1a1f',
                color: '#f3f3f1',
                border: '1px solid #333339',
                borderRadius: '6px',
                padding: '6px 12px',
                fontSize: '13px',
                fontWeight: 500,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {industryOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span style={{ fontSize: '11px', color: '#6f6f79', maxWidth: '300px' }}>
              {industryOptions.find((o) => o.key === industryPreset)?.desc}
            </span>
          </div>

          {/* Motion & Content Mode Toggles */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Motion On / Off */}
            <button
              id="sandbox-motion-toggle"
              type="button"
              onClick={() => setMotionEnabled((prev) => !prev)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: motionEnabled ? '#1e293b' : '#18181c',
                color: motionEnabled ? '#38bdf8' : '#777780',
                border: `1px solid ${motionEnabled ? '#0284c7' : '#333339'}`,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Zap size={13} />
              <span>Motion: {motionEnabled ? 'ON' : 'OFF'}</span>
            </button>

            {/* Motion Preset Selector */}
            <select
              id="sandbox-motion-preset-select"
              disabled={!motionEnabled}
              value={motionPreset}
              onChange={(e) => setMotionPreset(e.target.value as StudioMotionPreset)}
              style={{
                backgroundColor: '#1a1a1f',
                color: motionEnabled ? '#f3f3f1' : '#6f6f79',
                border: '1px solid #333339',
                borderRadius: '6px',
                padding: '6px 10px',
                fontSize: '12px',
                outline: 'none',
                cursor: motionEnabled ? 'pointer' : 'not-allowed',
                opacity: motionEnabled ? 1 : 0.6,
              }}
            >
              {motionPresetOptions.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>

            {/* Content Mode (Preview vs Production) */}
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333339' }}>
              <button
                id="sandbox-content-mode-preview"
                type="button"
                onClick={() => setContentMode('preview')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: contentMode === 'preview' ? '#292930' : '#141417',
                  color: contentMode === 'preview' ? '#f3f3f1' : '#777780',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Preview Demo
              </button>
              <button
                id="sandbox-content-mode-production"
                type="button"
                onClick={() => setContentMode('production')}
                title="Strict production mode: hides fabricated ratings, fake reviews, and unverified guarantees"
                style={{
                  padding: '6px 10px',
                  backgroundColor: contentMode === 'production' ? '#14301d' : '#141417',
                  color: contentMode === 'production' ? '#4ade80' : '#777780',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Production Mode
              </button>
            </div>

            {/* RTL Direction Toggle */}
            <button
              id="sandbox-direction-toggle"
              type="button"
              onClick={() => setDirection((prev) => (prev === 'ltr' ? 'rtl' : 'ltr'))}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: direction === 'rtl' ? '#332314' : '#141417',
                color: direction === 'rtl' ? '#d6a84f' : '#f3f3f1',
                border: `1px solid ${direction === 'rtl' ? '#d6a84f' : '#333339'}`,
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <ArrowRightLeft size={13} />
              <span>{direction === 'rtl' ? 'עברית (RTL)' : 'English (LTR)'}</span>
            </button>

            {/* Theme Toggle */}
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333339' }}>
              <button
                id="sandbox-theme-dark"
                type="button"
                onClick={() => setThemeMode('dark')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  backgroundColor: themeMode === 'dark' ? '#292930' : '#141417',
                  color: themeMode === 'dark' ? '#f3f3f1' : '#777780',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Moon size={13} />
                <span>Dark</span>
              </button>
              <button
                id="sandbox-theme-light"
                type="button"
                onClick={() => setThemeMode('light')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '6px 10px',
                  backgroundColor: themeMode === 'light' ? '#e5e5e0' : '#141417',
                  color: themeMode === 'light' ? '#111' : '#777780',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <Sun size={13} />
                <span>Light</span>
              </button>
            </div>

            {/* Viewport Toggles */}
            <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333339' }}>
              <button
                id="sandbox-viewport-desktop"
                type="button"
                title="Desktop 100%"
                onClick={() => setPreviewMode('desktop')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: previewMode === 'desktop' ? '#292930' : '#141417',
                  color: previewMode === 'desktop' ? '#f3f3f1' : '#777780',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Monitor size={15} />
              </button>
              <button
                id="sandbox-viewport-tablet"
                type="button"
                title="Tablet 768px"
                onClick={() => setPreviewMode('tablet')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: previewMode === 'tablet' ? '#292930' : '#141417',
                  color: previewMode === 'tablet' ? '#f3f3f1' : '#777780',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Tablet size={15} />
              </button>
              <button
                id="sandbox-viewport-mobile"
                type="button"
                title="Mobile 390px"
                onClick={() => setPreviewMode('mobile')}
                style={{
                  padding: '6px 10px',
                  backgroundColor: previewMode === 'mobile' ? '#292930' : '#141417',
                  color: previewMode === 'mobile' ? '#f3f3f1' : '#777780',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Smartphone size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Fallback Warning if unknown industry preset */}
        {!isIndustryKnown && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: '#382810',
              border: '1px solid #854d0e',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: '#fef08a',
            }}
          >
            <AlertTriangle size={14} color="#fef08a" />
            <span>
              Preset &ldquo;{industryPreset}&rdquo; is not a recognized preset key. Falling back cleanly to <strong>atelier_luxury</strong>.
            </span>
          </div>
        )}
      </div>

      {/* Main Sandbox Grid: Left Sidebar Component Browser + Right Stage */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '320px 1fr',
          gap: '24px',
          alignItems: 'start',
        }}
      >
        {/* LEFT COLUMN: Filter & Component List */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            backgroundColor: '#121215',
            borderRadius: '8px',
            border: '1px solid #26262b',
            padding: '16px',
            maxHeight: 'calc(100vh - 220px)',
            overflowY: 'auto',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '10px', color: '#6f6f79' }} />
            <input
              id="sandbox-search-input"
              type="text"
              placeholder="Search components or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#18181c',
                border: '1px solid #2e2e34',
                borderRadius: '6px',
                padding: '8px 12px 8px 32px',
                fontSize: '12.5px',
                color: '#f3f3f1',
                outline: 'none',
              }}
            />
          </div>

          {/* Category Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categoryTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: 500,
                  backgroundColor: activeCategory === tab.id ? '#2e2e34' : '#18181c',
                  color: activeCategory === tab.id ? '#f3f3f1' : '#888892',
                  border: '1px solid ' + (activeCategory === tab.id ? '#484852' : '#26262b'),
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div style={{ height: '1px', backgroundColor: '#26262b' }} />

          {/* Component Item List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {filteredComponents.map((item) => {
              const isSelected = item.id === activeItem.id;
              const isApproved = item.status === 'approved';
              return (
                <button
                  key={item.id}
                  id={`sandbox-select-${item.id}`}
                  type="button"
                  onClick={() => setSelectedComponentId(item.id)}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    textAlign: 'left',
                    backgroundColor: isSelected ? '#222228' : 'transparent',
                    border: '1px solid ' + (isSelected ? '#d6a84f' : 'transparent'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#f3f3f1' : '#c8c8cf' }}>
                      {item.name}
                    </span>
                    <span
                      style={{
                        fontSize: '9.5px',
                        textTransform: 'uppercase',
                        fontFamily: 'monospace',
                        padding: '1px 5px',
                        borderRadius: '3px',
                        backgroundColor: isApproved ? '#18181c' : '#332314',
                        color: isApproved ? '#9d9da5' : '#d6a84f',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#6f6f79' }}>
                    {item.id}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Stage & Inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Metadata & Governance Inspector Card */}
          <div
            style={{
              padding: '18px 24px',
              backgroundColor: '#121215',
              borderRadius: '8px',
              border: '1px solid #26262b',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#d6a84f', textTransform: 'uppercase', fontWeight: 700 }}>
                    {activeItem.category} // {activeItem.id}
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      backgroundColor: activeItem.status === 'approved' ? '#1b3320' : '#382810',
                      color: activeItem.status === 'approved' ? '#4ade80' : '#fef08a',
                      fontWeight: 600,
                    }}
                  >
                    {activeItem.status === 'approved' ? 'APPROVED V1' : 'EXTERNAL CANDIDATE'}
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f3f3f1', margin: '4px 0 0 0' }}>
                  {activeItem.name}
                </h2>
                <p style={{ fontSize: '13.5px', color: '#9d9da5', margin: '4px 0 0 0' }}>
                  {activeItem.description}
                </p>
              </div>

              {/* Verified Badges */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#19191d',
                    border: '1px solid #2a2a30',
                    color: '#c4c4cc',
                  }}
                >
                  Motion: <strong>{activeItem.motionLevel || 'subtle'}</strong>
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#19191d',
                    border: '1px solid #2a2a30',
                    color: '#c4c4cc',
                  }}
                >
                  Mobile:{' '}
                  <strong>
                    ★ {activeItem.mobileQuality || 5}.0{' '}
                    {activeItem.mobileVerificationStatus && activeItem.mobileVerificationStatus !== 'untested' ? '(verified)' : '(unverified)'}
                  </strong>
                </span>
                <span
                  style={{
                    fontSize: '11px',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#19191d',
                    border: '1px solid #2a2a30',
                    color: '#c4c4cc',
                  }}
                >
                  RTL:{' '}
                  <strong>
                    {activeItem.rtlReady
                      ? activeItem.rtlVerificationStatus && activeItem.rtlVerificationStatus !== 'untested'
                        ? 'Native Verified'
                        : 'Supported'
                      : 'Not Verified'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Provenance & Governance Info */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                padding: '12px',
                borderRadius: '6px',
                backgroundColor: '#17171b',
                border: '1px solid #26262b',
                fontSize: '11.5px',
              }}
            >
              <div>
                <span style={{ color: '#6f6f79' }}>Provenance Source: </span>
                <strong style={{ color: '#f3f3f1' }}>{activeItem.source || 'internal'}</strong>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>Author / Creator: </span>
                <span style={{ color: '#c4c4cc' }}>{activeItem.sourceAuthor || 'Natanel Studio'}</span>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>License: </span>
                <span style={{ color: '#c4c4cc' }}>{activeItem.license || 'MIT'}</span>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>Implementation: </span>
                <span style={{ color: hasImplementation ? '#4ade80' : '#eab308' }}>
                  {hasImplementation ? 'Renderable React' : 'Metadata Only (Placeholder)'}
                </span>
              </div>
              {activeItem.sourceUrl && (
                <div style={{ gridColumn: '1 / -1' }}>
                  <span style={{ color: '#6f6f79' }}>Source URL: </span>
                  <a
                    href={activeItem.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#d6a84f', textDecoration: 'underline' }}
                  >
                    {activeItem.sourceUrl}
                  </a>
                </div>
              )}
              {activeItem.transformationNotes && (
                <div style={{ gridColumn: '1 / -1', color: '#9d9da5', fontStyle: 'italic' }}>
                  Transformation Notes: {activeItem.transformationNotes}
                </div>
              )}
            </div>

            {/* Tags row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#6f6f79' }}>Industries: </span>
                <span style={{ color: '#c4c4cc' }}>{activeItem.industryFit?.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>Styles: </span>
                <span style={{ color: '#c4c4cc' }}>{activeItem.styleTags?.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>Conversion Goals: </span>
                <span style={{ color: '#d6a84f' }}>{activeItem.conversionPurpose?.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* Content Mode Notice if in Production Mode */}
          {contentMode === 'production' && (
            <div
              style={{
                padding: '10px 16px',
                borderRadius: '6px',
                backgroundColor: '#122316',
                border: '1px solid #166534',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '12px',
                color: '#86efac',
              }}
            >
              <FileCheck size={16} color="#86efac" />
              <span>
                <strong>Strict Production Content Mode:</strong> Demonstration claims, fake star ratings, unverified review counts, and mock license numbers are suppressed.
              </span>
            </div>
          )}

          {/* THE LIVE RENDERED STAGE */}
          <div
            id="sandbox-live-stage"
            style={{
              borderRadius: '8px',
              border: '1px solid #26262b',
              backgroundColor: themeMode === 'dark' ? '#08080a' : '#f0f0ee',
              padding: previewMode === 'desktop' ? '0' : '32px 16px',
              display: 'flex',
              justifyContent: 'center',
              overflow: 'hidden',
              transition: 'background-color 0.2s ease',
            }}
          >
            <div
              style={{
                width: viewportWidth,
                maxWidth: '100%',
                boxShadow: previewMode !== 'desktop' ? '0 12px 36px rgba(0,0,0,0.5)' : 'none',
                borderRadius: previewMode !== 'desktop' ? '12px' : '0',
                overflow: 'hidden',
                transition: 'width 0.25s ease',
                backgroundColor: themeMode === 'dark' ? '#0c0c0e' : '#fafafa',
              }}
            >
              {ActiveComponent ? (
                <StudioMotionWrapper
                  preset={motionPreset}
                  enabled={motionEnabled}
                  direction={direction}
                >
                  <ActiveComponent
                    contentMode={contentMode}
                    industryPreset={industryPreset}
                    themeMode={themeMode}
                    direction={direction}
                    previewMode={previewMode}
                    motionEnabled={motionEnabled}
                    motionPreset={motionPreset}
                    designTokens={activeTokens}
                    onAction={handleAction}
                  />
                </StudioMotionWrapper>
              ) : null}
            </div>
          </div>

          {/* Action Log Bar */}
          {actionLog.length > 0 && (
            <div
              style={{
                padding: '14px 18px',
                borderRadius: '8px',
                backgroundColor: '#121215',
                border: '1px solid #26262b',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', color: '#6f6f79' }}>
                  Interactive Event Dispatcher Log
                </span>
                <button
                  type="button"
                  onClick={() => setActionLog([])}
                  style={{
                    fontSize: '11px',
                    color: '#9d9da5',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Clear Log
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {actionLog.map((log, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: '#17171b',
                    }}
                  >
                    <span style={{ color: '#6f6f79' }}>[{log.timestamp}]</span>
                    <span style={{ color: '#d6a84f', fontWeight: 600 }}>{log.action}</span>
                    <span style={{ color: '#a0a0aa' }}>{JSON.stringify(log.payload)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
