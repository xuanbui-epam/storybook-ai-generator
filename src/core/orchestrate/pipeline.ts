import { PipelineContext, PipelineStep } from "../../model/PipelineContext";

export async function runPipeline(
  steps: PipelineStep[],
  ctx: PipelineContext
): Promise<void> {
  for (const step of steps) {
    await step(ctx);
  }
}

/**
 * Wraps a set of steps so they are executed for each file in ctx.files.
 * Before each file, it resets per-file state in the context.
 */
export function processEachFileStep(steps: PipelineStep[]): PipelineStep {
  return async (ctx) => {
    const files = ctx.files ?? [];

    if (!files.length) {
      console.log("[*] No files to process.");
      return;
    }

    for (const file of files) {
      console.log("\n==============================");
      console.log("Processing file:", file);
      console.log("==============================");

      ctx.currentFile = file;
      ctx.meta = null;
      ctx.prompt = undefined;
      ctx.llmOutput = null;
      ctx.storyCode = undefined;

      for (const step of steps) {
        await step(ctx);
      }
    }
  };
}
