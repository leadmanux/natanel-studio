import { Router } from 'express';
import { z } from 'zod';
import type { ExportTarget, Project } from '../../shared/project';
import { SiteExportService } from '../services/exportService';
import { normalizeShopifyThemeZip } from '../services/shopifyZipNormalizer';

const router = Router();
const targetSchema = z.enum(['wordpress', 'react', 'shopify', 'managed']);
const service = new SiteExportService();

router.post('/validate', async (req, res) => {
  const parsed = targetSchema.safeParse(req.body?.target);
  const project = req.body?.project as Project | undefined;
  if (!project || !parsed.success) {
    return res.status(400).json({ error: 'Project and a valid export target are required.' });
  }

  try {
    const validation = await service.validate(project, parsed.data as ExportTarget);
    return res.json(validation);
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Export validation failed.' });
  }
});

router.post('/generate', async (req, res) => {
  const parsed = targetSchema.safeParse(req.body?.target);
  const project = req.body?.project as Project | undefined;
  if (!project || !parsed.success) {
    return res.status(400).json({ error: 'Project and a valid export target are required.' });
  }

  try {
    const target = parsed.data as ExportTarget;
    const artifact = await service.generate(project, target);
    const output = target === 'shopify'
      ? await normalizeShopifyThemeZip(artifact.buffer)
      : artifact.buffer;
    res.setHeader('Content-Type', artifact.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${artifact.filename}"`);
    res.setHeader('X-Natanel-Export-Target', artifact.target);
    res.setHeader('X-Natanel-Export-Warnings', String(artifact.validation.issues.filter((issue) => issue.severity === 'warning').length));
    return res.send(output);
  } catch (error) {
    const validation = (error as Error & { validation?: unknown })?.validation;
    if (validation) return res.status(422).json({ error: 'Project is not export-ready.', validation });
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Export generation failed.' });
  }
});

export const exportRouter = router;
