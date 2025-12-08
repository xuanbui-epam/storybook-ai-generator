import { writeStoryFile } from "../../../generator/writer";
import { PipelineStep } from "../../../model/PipelineContext";

/**
 * Step: write story file next to the component.
 */
export const writeStoryStep: PipelineStep = async (ctx) => {
  if (!ctx.storyCode || !ctx.currentFile || !ctx.meta) {
    console.log("[6] Missing storyCode/currentFile/meta, skipping write.");
    return;
  }

  try {
    const writtenPath = await writeStoryFile(ctx.currentFile, ctx.storyCode);
    console.log("[6] Written story for component:", ctx.meta.componentName);
    console.log("    ->", writtenPath);
  } catch (error) {
    console.error("[6.E] Failed to write story file:", error);
  }
};