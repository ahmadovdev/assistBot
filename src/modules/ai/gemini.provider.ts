import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmChatResult, LlmMessage, LlmProvider } from './llm.types';

interface GeminiResponse {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
  modelVersion?: string;
  error?: { message: string };
}

/**
 * Direct Google Gemini (AI Studio) client.
 * Gemini separates the system prompt (systemInstruction), uses roles
 * user/model, and supports JSON mode via responseMimeType.
 */
@Injectable()
export class GeminiProvider implements LlmProvider {
  private readonly base = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private readonly config: ConfigService) {}

  async chatJson(messages: LlmMessage[], model: string): Promise<LlmChatResult> {
    const apiKey = this.config.get<string>('app.ai.geminiApiKey');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');

    const system = messages
      .filter((m) => m.role === 'system')
      .map((m) => m.content)
      .join('\n\n');

    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const body = {
      systemInstruction: system ? { parts: [{ text: system }] } : undefined,
      contents,
      generationConfig: { responseMimeType: 'application/json' },
    };

    const res = await fetch(`${this.base}/${model}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Gemini HTTP ${res.status}: ${text.slice(0, 300)}`);
    }

    const json = (await res.json()) as GeminiResponse;
    if (json.error) throw new Error(`Gemini error: ${json.error.message}`);

    const content = json.candidates?.[0]?.content?.parts
      ?.map((p) => p.text ?? '')
      .join('');
    if (!content) throw new Error('Gemini returned empty content');

    return {
      content,
      model: json.modelVersion ?? model,
      usage: {
        promptTokens: json.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: json.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: json.usageMetadata?.totalTokenCount ?? 0,
      },
    };
  }
}
