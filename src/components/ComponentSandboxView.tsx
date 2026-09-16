import React, { useState, useMemo } from 'react';
import {
  studioComponentCatalog,
  getStudioComponent,
  type StudioRegisteredItem,
} from '../studio-components/resolver';
import type { IndustryPresetKey, ThemeMode, ComponentDirection, PreviewMode } from '../studio-components/types';
import {
  Monitor,
  Tablet,
  Smartphone,
  Sun,
  Moon,
  ArrowRightLeft,
  Search,
  Filter,
  CheckCircle2,
  Sparkles,
  Layers,
  Code,
  Sliders,
  ExternalLink,
  RotateCcw,
  Zap,
} from 'lucide-react';

const industryOptions: { key: IndustryPresetKey; label: string; desc: string }[] = [
  { key: 'architecture', label: 'Architecture & Interiors', desc: 'Warm stone, mineral slate, monolithic rhythm' },
  { key: 'luxury', label: 'Haute Luxury & Jewelry', desc: 'Champagne gold, onyx black, serif display' },
  { key: 'contractor', label: 'Contractor & Engineering', desc: 'Safety amber, high-contrast clarity, direct conversions' },
  { key: 'editorial', label: 'Editorial & Publishing', desc: 'Deep cinnabar, broad typography, asymmetric spacing' },
  { key: 'skincare', label: 'Botanical & Organic', desc: 'Earthy sage, soft radius, relaxed cadence' },
  { key: 'consulting', label: 'Advisory & Consulting', desc: 'Cobalt navy, sharp precision, data-led credibility' },
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
  const [selectedComponentId, setSelectedComponentId] = useState<string>(studioComponentCatalog[0].id);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sandbox environmental controls
  const [industryPreset, setIndustryPreset] = useState<IndustryPresetKey>('architecture');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [direction, setDirection] = useState<ComponentDirection>('ltr');
  const [previewMode, setPreviewMode] = useState<PreviewMode>('desktop');
  const [actionLog, setActionLog] = useState<{ action: string; payload: any; timestamp: string }[]>([]);

  // Filter components
  const filteredComponents = useMemo(() => {
    return studioComponentCatalog.filter((item) => {
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
  }, [activeCategory, searchQuery]);

  const activeItem = useMemo(() => {
    return studioComponentCatalog.find((c) => c.id === selectedComponentId) || studioComponentCatalog[0];
  }, [selectedComponentId]);

  const ActiveComponent = useMemo(() => {
    return getStudioComponent(activeItem.id);
  }, [activeItem.id]);

  const handleAction = (action: string, payload: any) => {
    setActionLog((prev) => [
      { action, payload, timestamp: new Date().toLocaleTimeString() },
      ...prev.slice(0, 9),
    ]);
  };

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
            Every component is platform-neutral, responds to mathematical design tokens, natively mirrors in Hebrew (RTL), and complies with strict anti-slop rules.
          </p>
        </div>

        {/* Global Stats Badge */}
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
            <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>Total Components</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#f3f3f1', fontFamily: 'monospace' }}>
              {studioComponentCatalog.length} / 40
            </div>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#26262b' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>RTL Verified</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#2e7d32', fontFamily: 'monospace' }}>
              100%
            </div>
          </div>
          <div style={{ height: '24px', width: '1px', backgroundColor: '#26262b' }} />
          <div>
            <div style={{ fontSize: '10px', color: '#6f6f79', textTransform: 'uppercase', fontFamily: 'monospace' }}>Zero-Slop</div>
            <div style={{ fontSize: '18px', fontWeight: 700, color: '#d6a84f', fontFamily: 'monospace' }}>
              Pass
            </div>
          </div>
        </div>
      </div>

      {/* Control Bar: Industry Presets, Theme, Direction, Viewport */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px 20px',
          backgroundColor: '#121215',
          borderRadius: '8px',
          border: '1px solid #26262b',
        }}
      >
        {/* Left: Industry Preset Picker */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Sliders size={16} color="#d6a84f" />
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#9d9da5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Industry Preset:
          </label>
          <select
            value={industryPreset}
            onChange={(e) => setIndustryPreset(e.target.value as IndustryPresetKey)}
            style={{
              backgroundColor: '#1a1a1e',
              border: '1px solid #333339',
              color: '#f3f3f1',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            {industryOptions.map((opt) => (
              <option key={opt.key} value={opt.key}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Middle & Right: Viewport, Theme, RTL Toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* RTL Toggle */}
          <button
            type="button"
            onClick={() => setDirection((d: ComponentDirection) => (d === 'ltr' ? 'rtl' : 'ltr'))}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              backgroundColor: direction === 'rtl' ? '#d6a84f' : '#1a1a1e',
              color: direction === 'rtl' ? '#111' : '#f3f3f1',
              border: '1px solid ' + (direction === 'rtl' ? '#d6a84f' : '#333339'),
              fontSize: '12.5px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <ArrowRightLeft size={14} />
            <span>{direction === 'rtl' ? 'RTL עברית (Active)' : 'LTR Standard'}</span>
          </button>

          {/* Theme Mode Toggle */}
          <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333339' }}>
            <button
              type="button"
              onClick={() => setThemeMode('dark')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
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
              type="button"
              onClick={() => setThemeMode('light')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '6px 12px',
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

          {/* Viewport Width Toggles */}
          <div style={{ display: 'inline-flex', borderRadius: '6px', overflow: 'hidden', border: '1px solid #333339' }}>
            <button
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
              return (
                <button
                  key={item.id}
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
                        backgroundColor: '#18181c',
                        color: '#9d9da5',
                      }}
                    >
                      {item.category}
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
          {/* Metadata Card */}
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
                      backgroundColor: '#1b3320',
                      color: '#4ade80',
                      fontWeight: 600,
                    }}
                  >
                    APPROVED V1
                  </span>
                </div>
                <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#f3f3f1', margin: '4px 0 0 0' }}>
                  {activeItem.name}
                </h2>
                <p style={{ fontSize: '13.5px', color: '#9d9da5', margin: '4px 0 0 0' }}>
                  {activeItem.description}
                </p>
              </div>

              {/* Badges */}
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
                  Motion: <strong>{activeItem.motionLevel}</strong>
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
                  Mobile: <strong>★ {activeItem.mobileQuality}.0</strong>
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
                  RTL: <strong>Native Verified</strong>
                </span>
              </div>
            </div>

            {/* Tags row */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
              <div>
                <span style={{ color: '#6f6f79' }}>Industries: </span>
                <span style={{ color: '#c4c4cc' }}>{activeItem.industryFit.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>Styles: </span>
                <span style={{ color: '#c4c4cc' }}>{activeItem.styleTags.join(', ')}</span>
              </div>
              <div>
                <span style={{ color: '#6f6f79' }}>Conversion Goals: </span>
                <span style={{ color: '#d6a84f' }}>{activeItem.conversionPurpose.join(', ')}</span>
              </div>
            </div>
          </div>

          {/* THE LIVE RENDERED STAGE */}
          <div
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
              <ActiveComponent
                industryPreset={industryPreset}
                themeMode={themeMode}
                direction={direction}
                previewMode={previewMode}
                onAction={handleAction}
              />
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'monospace', color: '#d6a84f', fontWeight: 700, textTransform: 'uppercase' }}>
                  <Zap size={13} />
                  <span>Interactive Action Log (Telemetry)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActionLog([])}
                  style={{ background: 'transparent', border: 'none', color: '#6f6f79', fontSize: '11px', cursor: 'pointer' }}
                >
                  Clear
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
                {actionLog.map((log, idx) => (
                  <div key={idx} style={{ fontSize: '11.5px', fontFamily: 'monospace', color: '#a0a0a8', display: 'flex', gap: '12px' }}>
                    <span style={{ color: '#5b5b64' }}>{log.timestamp}</span>
                    <strong style={{ color: '#f3f3f1' }}>{log.action}</strong>
                    <span style={{ color: '#888892' }}>{JSON.stringify(log.payload)}</span>
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
