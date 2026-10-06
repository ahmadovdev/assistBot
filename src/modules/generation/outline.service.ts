import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LlmService } from '../ai/llm.service';
import { LlmResult, LlmUsage } from '../ai/llm.types';
import { buildOutlineSchema, Outline } from '../ai/schemas/outline.schema';
import { OUTLINE_SYSTEM, buildOutlineUser } from '../ai/prompts/outline.prompt';
import { resolveModel } from '../ai/layout.catalog';
import { buildTopicPlanSchema, TopicPlan } from '../ai/schemas/topic-plan.schema';
import { TOPIC_PLAN_SYSTEM, buildTopicPlanUser } from '../ai/prompts/topic-plan.prompt';
import { estimateCostUsd } from '../ai/model-pricing';

export interface OutlineInput {
  topic: string;
  slideCount: number;
  language: string;
}

export function applyPlannedTypes(data: Outline, plan: TopicPlan): Outline {
  const plannedTypeByPosition = new Map(
    plan.sequence.map((item) => [item.position, item.type]),
  );
  return {
    ...data,
    slides: data.slides.map((slide) => ({
      ...slide,
      type: plannedTypeByPosition.get(slide.position)!,
    })),
  };
}

@Injectable()
export class OutlineService {
  private readonly logger = new Logger(OutlineService.name);

  constructor(
    private readonly llm: LlmService,
    private readonly config: ConfigService,
  ) {}

  async generate(input: OutlineInput): Promise<LlmResult<Outline>> {
    const model = resolveModel(this.config.get<string>('app.ai.outlineModel') as string, input.language);
    const planResult = await this.llm.generateStructured<TopicPlan>({
      system: TOPIC_PLAN_SYSTEM,
      user: buildTopicPlanUser(input),
      schema: buildTopicPlanSchema(input.slideCount),
      model,
    });
    this.logger.log(
      `Topic planner chose ${planResult.data.topicKind}/${planResult.data.explanationMode}: ` +
      planResult.data.sequence.map((item) => item.type).join(' → '),
    );

    const outlineResult = await this.llm.generateStructured<Outline>({
      system: OUTLINE_SYSTEM,
      user: buildOutlineUser({ ...input, topicPlan: planResult.data }),
      schema: buildOutlineSchema(input.slideCount),
      model,
    });
    const outlined = applyPlannedTypes(outlineResult.data, planResult.data);

    const usage = sumUsage(planResult.usage, outlineResult.usage);
    const planCost =
      planResult.costUsd ??
      estimateCostUsd(planResult.model, planResult.usage);
    const outlineCost =
      outlineResult.costUsd ??
      estimateCostUsd(outlineResult.model, outlineResult.usage);
    return {
      data: outlined,
      model: planResult.model === outlineResult.model
        ? outlineResult.model
        : `planner:${planResult.model}; outline:${outlineResult.model}`,
      usage,
      costUsd: planCost === undefined && outlineCost === undefined
        ? undefined
        : (planCost ?? 0) + (outlineCost ?? 0),
    };
  }
}

function sumUsage(a: LlmUsage, b: LlmUsage): LlmUsage {
  return {
    promptTokens: a.promptTokens + b.promptTokens,
    completionTokens: a.completionTokens + b.completionTokens,
    totalTokens: a.totalTokens + b.totalTokens,
  };
}
