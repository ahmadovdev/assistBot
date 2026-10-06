import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface ImageGenerateInput {
  model: string;
  prompt: string;
  n?: number;
  resolution?: string;
  aspect_ratio?: string;
  size?: string;
  quality?: string;
  output_format?: string;
  background?: string;
  provider_sort?: string;
  provider_only?: string;
}

@Injectable()
export class ImageLabService {
  private readonly endpoint = 'https://openrouter.ai/api/v1';

  constructor(private readonly config: ConfigService) {}

  isTokenValid(token: string | undefined): boolean {
    const expected = this.config.get<string>('app.imageLab.token');
    return Boolean(expected && token && token === expected);
  }

  async listModels(): Promise<unknown> {
    const res = await fetch(`${this.endpoint}/images/models`, {
      headers: this.headers(),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) await this.throwOpenRouterError(res, 'models');
    return res.json();
  }

  async generate(input: ImageGenerateInput): Promise<unknown> {
    const model = String(input.model ?? '').trim();
    const prompt = String(input.prompt ?? '').trim();
    if (!model) throw new BadRequestException('model is required');
    if (prompt.length < 8) throw new BadRequestException('prompt must be at least 8 characters');

    const body: Record<string, unknown> = {
      model,
      prompt,
      n: Math.min(Math.max(Number(input.n ?? 1), 1), 4),
    };
    for (const key of ['resolution', 'aspect_ratio', 'size', 'quality', 'output_format', 'background'] as const) {
      const value = input[key];
      if (typeof value === 'string' && value.trim()) body[key] = value.trim();
    }
    const provider: Record<string, unknown> = {};
    if (input.provider_sort) provider.sort = input.provider_sort;
    if (input.provider_only) {
      provider.only = input.provider_only.split(',').map((v) => v.trim()).filter(Boolean);
      provider.allow_fallbacks = false;
    }
    if (Object.keys(provider).length) body.provider = provider;

    const res = await fetch(`${this.endpoint}/images`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(180_000),
    });
    if (!res.ok) await this.throwOpenRouterError(res, 'image');
    return res.json();
  }

  private headers(): Record<string, string> {
    const apiKey = this.config.get<string>('app.ai.openrouterApiKey');
    if (!apiKey) throw new ServiceUnavailableException('OPENROUTER_API_KEY is not configured on the server');
    return {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://t.me/LumioApp_bot',
      'X-Title': 'Lumio Image Lab',
    };
  }

  private async throwOpenRouterError(res: Response, area: 'models' | 'image'): Promise<never> {
    const raw = (await res.text()).slice(0, 500);
    let providerMessage = raw;
    try {
      const parsed = JSON.parse(raw) as { error?: { message?: string } };
      providerMessage = parsed.error?.message || raw;
    } catch {
      // Keep raw provider text when it is not JSON.
    }

    if (res.status === 401) {
      throw new UnauthorizedException(
        'OpenRouter API key is invalid or expired. Update OPENROUTER_API_KEY on the server.',
      );
    }
    if (res.status === 402) {
      throw new BadGatewayException('OpenRouter balance is insufficient for image generation.');
    }
    throw new BadGatewayException(`OpenRouter ${area} HTTP ${res.status}: ${providerMessage}`);
  }
}
