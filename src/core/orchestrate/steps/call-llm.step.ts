import { callLLM } from "../../../ai/llm";
import { PipelineStep } from "../../../model/PipelineContext";

/**
 * Step: call LLM with prompt, store structured output.
 */
export const callLLMStep: PipelineStep = async (ctx) => {
  if (!ctx.prompt) {
    console.log("[4] No prompt available, skipping LLM call.");
    return;
  }

  console.log("[4] Calling LLM…");

  try {
    const output = await callLLM(ctx.prompt);
    ctx.llmOutput = output;

    const scenarioCount = Array.isArray(output?.StoriesScenarios)
      ? output.StoriesScenarios.length
      : 0;

    console.log("[4.1] LLM responded with scenarios:", scenarioCount);
  } catch (error) {
    console.error("[4.E] Failed to get LLM response:", error);
    ctx.llmOutput = null;
  }
};
