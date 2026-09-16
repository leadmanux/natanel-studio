import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { GeminiImageGenerator } from './server/services/imageGenerator';
import { GeminiArtDirector } from './server/services/artDirector';
import { GeminiReferenceAnalyzer } from './server/services/referenceAnalyzer';
import { GeminiComponentSelector } from './server/services/componentSelector';
import { GeminiAssetPlanner } from './server/services/assetPlanner';
import { GeminiDesignCritic } from './server/services/designCritic';
import { demoComponents } from './shared/componentRegistry';
import { canonicalComponentStore } from './server/services/canonicalComponentStore';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API routes
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'natanel-studio', timestamp: new Date().toISOString() });
  });

  const imageRequestSchema = z.object({
    prompt: z.string().min(5),
    negativePrompt: z.string().optional(),
    aspectRatio: z.enum(['1:1', '4:5', '3:4', '9:16', '16:9', '21:9', '4:1', '8:1']),
    resolution: z.enum(['0.5K', '1K', '2K', '4K']).default('1K'),
    referenceImageUrls: z.array(z.string().url()).optional(),
  });

  app.post('/api/assets/generate', async (req, res) => {
    const parsed = imageRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid image generation request.', details: parsed.error.flatten() });
    }

    try {
      const generator = new GeminiImageGenerator();
      const image = await generator.generate(parsed.data);
      return res.json(image);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown image generation error.';
      return res.status(500).json({ error: message });
    }
  });

  // Art Director: Generates 3 distinct design concepts
  app.post('/api/ai/art-directions', async (req, res) => {
    try {
      const { project } = req.body;
      if (!project) {
        return res.status(400).json({ error: 'Project payload is required.' });
      }
      const artDirector = new GeminiArtDirector();
      const directions = await artDirector.proposeDirections(project);
      return res.json({ directions });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to generate design directions.';
      return res.status(500).json({ error: message });
    }
  });

  // Reference Website Analysis
  app.post('/api/ai/analyze-reference', async (req, res) => {
    try {
      const { url, project, screenshots } = req.body;
      if (!url) {
        return res.status(400).json({ error: 'Reference URL is required.' });
      }
      const analyzer = new GeminiReferenceAnalyzer();
      const analysis = await analyzer.analyze(url, project, screenshots);
      return res.json({ analysis });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to analyze reference URL.';
      return res.status(500).json({ error: message });
    }
  });

  // Canonical Component Registry Endpoints
  app.get('/api/components', (_req, res) => {
    try {
      const components = canonicalComponentStore.getAllComponents();
      return res.json({ components });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to retrieve components.';
      return res.status(500).json({ error: message });
    }
  });

  app.patch('/api/components/:id/status', async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status || !['approved', 'candidate', 'rejected'].includes(status)) {
        return res.status(400).json({ error: 'Valid status ("approved" | "candidate" | "rejected") is required.' });
      }
      const updated = await canonicalComponentStore.updateComponentStatus(id, status);
      return res.json({ component: updated });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update component status.';
      const statusCode = message.includes('does not exist') ? 404 : 400;
      return res.status(statusCode).json({ error: message });
    }
  });

  app.post('/api/components/candidate', async (req, res) => {
    try {
      const candidate = req.body;
      if (!candidate || !candidate.id || !candidate.name) {
        return res.status(400).json({ error: 'Candidate component specification with id and name is required.' });
      }
      const saved = await canonicalComponentStore.registerCandidate(candidate);
      return res.json({ component: saved });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register candidate.';
      return res.status(400).json({ error: message });
    }
  });

  // Component Selection Engine
  app.post('/api/ai/select-components', async (req, res) => {
    try {
      const { project, candidates } = req.body;
      if (!project) {
        return res.status(400).json({ error: 'Project payload is required.' });
      }

      // Canonical server registry is authoritative.
      // AI selection may use ONLY canonicalComponentStore.getApprovedComponents().
      const canonicalApproved = canonicalComponentStore.getApprovedComponents();
      const approvedMap = new Map(canonicalApproved.map((c) => [c.id, c]));

      let eligibleComponents: typeof canonicalApproved;

      // If client supplied candidate IDs, intersect strictly with canonical approved registry IDs
      // and retrieve component metadata from canonical server registry.
      // Unknown IDs and non-approved IDs are rejected/ignored.
      if (Array.isArray(candidates) && candidates.length > 0) {
        const requestedIds = candidates
          .map((c: any) => (typeof c === 'string' ? c : c?.id))
          .filter(Boolean);

        eligibleComponents = requestedIds
          .map((id: string) => approvedMap.get(id))
          .filter((c): c is (typeof canonicalApproved)[number] => c !== undefined);
      } else {
        eligibleComponents = canonicalApproved;
      }

      const selector = new GeminiComponentSelector();
      const selections = await selector.selectDetailed(project, eligibleComponents);
      return res.json({ selections });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to select components.';
      return res.status(500).json({ error: message });
    }
  });

  // Asset Planner: Website Asset Manifest
  app.post('/api/ai/plan-assets', async (req, res) => {
    try {
      const { project } = req.body;
      if (!project) {
        return res.status(400).json({ error: 'Project payload is required.' });
      }
      const planner = new GeminiAssetPlanner();
      const assets = await planner.plan(project);
      return res.json({ assets });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to plan assets.';
      return res.status(500).json({ error: message });
    }
  });

  // Design Critic: Design Quality Review
  app.post('/api/ai/critic', async (req, res) => {
    try {
      const { project, screenshots } = req.body;
      if (!project) {
        return res.status(400).json({ error: 'Project payload is required.' });
      }
      const critic = new GeminiDesignCritic();
      const report = await critic.review(project, screenshots);
      return res.json({ report });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to critique design.';
      return res.status(500).json({ error: message });
    }
  });

  // Vite middleware in dev, static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
