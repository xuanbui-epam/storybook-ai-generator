import path from "path";
import { renderStory } from "../../../generator/storyTemplate";
import { PipelineStep } from "../../../model/PipelineContext";

/**
 * Step: generate Storybook code from meta + LLM output.
 */
export const generateStoryStep: PipelineStep = async (ctx) => {
  if (!ctx.meta || !ctx.llmOutput || !ctx.currentFile) {
    console.log("[5] Missing meta/LLM output/currentFile, skipping story generation.");
    return;
  }

  try {
    const componentDir = path.dirname(ctx.currentFile);
    const storyCode = renderStory(ctx.meta, ctx.llmOutput, componentDir);

    ctx.storyCode = storyCode;

    console.log("[5] Generated story code. Length:", storyCode.length);
  } catch (error) {
    console.error("[5.E] Failed to generate story code:", error);
    ctx.storyCode = undefined;
  }
};