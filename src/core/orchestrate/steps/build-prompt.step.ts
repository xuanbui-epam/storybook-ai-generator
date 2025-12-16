import { buildPrompt } from "../../../ai/promptBuilder";
import { PipelineStep } from "../../../model/PipelineContext";

/**
 * Step: build LLM prompt from meta.
 */
export const buildPromptStep: PipelineStep = async (ctx) => {
  if (!ctx.meta) {
    console.log("[3] No meta available, skipping prompt build.");
    return;
  }

  const prompt = buildPrompt(ctx.meta, ctx.availableComponents);
  ctx.prompt = prompt;

  console.log("[3.1] Prompt:", prompt);

  console.log("[3] Built LLM prompt. Length:", prompt.length);
};