import { Injectable } from '@nestjs/common';

@Injectable()
export class GeminiService {
  private client: any | null = null;

  private async getClient() {
    if (!process.env.GEMINI_API_KEY) return null;
    if (this.client) return this.client;

    const { GoogleGenAI } = await import('@google/genai');
    this.client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    return this.client;
  }

  async generateJson<T>(prompt: string): Promise<T | null> {
    const client = await this.getClient();
    if (!client) return null;

    try {
      const result = await client.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: 'application/json' },
      });

      if (!result.text) return null;
      return JSON.parse(result.text) as T;
    } catch (error) {
      console.error('Gemini generation failed, using local fallback:', error);
      return null;
    }
  }
}
