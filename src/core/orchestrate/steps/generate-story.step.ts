import path from "path";
import { TemplateFactory } from "../../../generator/TemplateFactory";
import { PipelineStep } from "../../../model/PipelineContext";

/**
 * Step: generate Storybook code from meta + LLM output using framework-specific template.
 */
export const generateStoryStep: PipelineStep = async (ctx) => {
  if (!ctx.meta || !ctx.llmOutput || !ctx.currentFile) {
    console.log(
      "[5] Missing meta/LLM output/currentFile, skipping story generation."
    );
    return;
  }

  try {
    const componentDir = path.dirname(ctx.currentFile);
    
    // Get framework-specific template
    const template = TemplateFactory.getTemplate(ctx.framework);
    const storyCode = template.renderStory(ctx.meta, ctx.llmOutput, componentDir);

    ctx.storyCode = storyCode;

    console.log("[5] Generated story code. Length:", storyCode.length);
  } catch (error) {
    console.error("[5.E] Failed to generate story code:", error);
    ctx.storyCode = undefined;
  }
};