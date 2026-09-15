export interface ModelConfig {
  reasoningModel: string;
  fastModel: string;
  imageModel: string;
  premiumImageModel: string;
}

export const modelConfig: ModelConfig = {
  reasoningModel: process.env.GEMINI_REASONING_MODEL || 'gemini-3.1-pro',
  fastModel: process.env.GEMINI_FAST_MODEL || 'gemini-3.1-flash',
  imageModel: process.env.GEMINI_IMAGE_MODEL || 'gemini-3.1-flash-image',
  premiumImageModel: process.env.GEMINI_PREMIUM_IMAGE_MODEL || 'gemini-3-pro-image-preview',
};
