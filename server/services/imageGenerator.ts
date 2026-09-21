import { GoogleGenAI } from '@google/genai';
import type { ImageGeneratorRequest, ImageGeneratorResponse, ImageGeneratorService } from '../../src/ai/contracts';
import { modelConfig } from '../config/models';

const buildPrompt = (request: ImageGeneratorRequest) => {
  const negative = request.negativePrompt?.trim();
  return negative
    ? `${request.prompt}\n\nAvoid: ${negative}`
    : request.prompt;
};

export class GeminiImageGenerator implements ImageGeneratorService {
  private readonly ai: GoogleGenAI;

  constructor(apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured.');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generate(request: ImageGeneratorRequest): Promise<ImageGeneratorResponse> {
    const referenceParts = (request.referenceImageUrls || [])
      .slice(0, 6)
      .map((reference) => {
        const match = reference.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        return match
          ? {
              inlineData: {
                mimeType: match[1],
                data: match[2],
              },
            }
          : null;
      })
      .filter(Boolean);

    const referenceInstruction = referenceParts.length
      ? '\n\nREFERENCE IMAGE REQUIREMENT: The attached images show the real product and/or approved lifestyle context. Preserve the visible product identity exactly where the product appears. Do not invent controls, colors, proportions, packaging, logos or physical features that are not supported by the references.'
      : '';

    const response = await this.ai.models.generateContent({
      model: modelConfig.imageModel,
      contents: [buildPrompt(request) + referenceInstruction, ...referenceParts] as any[],
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
        imageConfig: {
          aspectRatio: request.aspectRatio,
          imageSize: request.resolution === '0.5K' ? '512' : request.resolution,
        },
      },
    });

    const parts = response.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((part) => part.inlineData?.data);
    if (!imagePart?.inlineData?.data) {
      const text = parts.map((part) => part.text).filter(Boolean).join('\n');
      throw new Error(text || 'Gemini returned no image data.');
    }

    return {
      mimeType: imagePart.inlineData.mimeType || 'image/png',
      base64Data: imagePart.inlineData.data,
      text: parts.map((part) => part.text).filter(Boolean).join('\n') || undefined,
    };
  }
}
