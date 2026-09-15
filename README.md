# Natanel Studio

Private internal website operating system for building premium SMB websites and conversion-focused Shopify stores.

## Product principle

The site is designed in a platform-neutral project model first. Delivery is selected only after the site is approved.

**Business website handoff:** WordPress theme ZIP, React/GitHub, or managed deployment.

**Shopify handoff:** Shopify Online Store 2.0 theme ZIP.

## V1 architecture

- `shared/project.ts` — platform-neutral project, page, section and asset model.
- `shared/componentRegistry.ts` — curated component metadata and quality controls.
- `shared/exporters.ts` — exporter contract plus WordPress/React/Managed/Shopify placeholders.
- `src/ai/contracts.ts` — Art Director, planner, selector, asset planner and Design Critic boundaries.
- `src/data/` — project persistence. Firestore when configured, local storage fallback during development.
- `server/services/imageGenerator.ts` — server-only Nano Banana 2 image generation.
- `server/config/models.ts` — centralized model selection.

## AI pipeline

Brief → Art Direction → Component Selection → Asset Plan → Site Composition → Desktop/Mobile QA → Design Critic → Export.

The AI is not allowed to invent every section from scratch. Components come from an approved registry with metadata for style, industry fit, CRO purpose, RTL readiness, mobile quality, dependencies and license.

## Image generation

Default: `gemini-3.1-flash-image` (Nano Banana 2).

The asset model supports 1:1, 4:5, 3:4, 9:16, 16:9, 21:9, 4:1 and 8:1 slots and up to 4K output. Image calls are server-side only.

## Local development

1. Copy `.env.example` to `.env`.
2. Add `GEMINI_API_KEY`.
3. Add Firebase config when persistence/auth is required.
4. `npm install`
5. `npm run dev`

Web: `http://localhost:5173`
Server: `http://localhost:8787`

## Current milestone

Foundation only. The goal is to establish stable data and service boundaries before implementing the full site-generation intelligence.
