import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import { GeminiImageGenerator } from './server/services/imageGenerator';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // API routes
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'natanel-studio', timestamp: new Date().toISOString() });
  });

  const imageRequestSchema = z.object({
    prompt: z.string().min(10),
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
