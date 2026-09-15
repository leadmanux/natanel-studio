import express from 'express';
import { z } from 'zod';
import { GeminiImageGenerator } from './services/imageGenerator';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(express.json({ limit: '20mb' }));

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

app.listen(port, () => {
  console.log(`Natanel Studio server listening on http://localhost:${port}`);
});
