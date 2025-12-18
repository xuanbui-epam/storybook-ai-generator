import path from "path";
import { config } from "../config";

import { processEachFileStep, runPipeline } from "./pipeline";
import { PipelineStep } from "../../model/PipelineContext";
import { discoverStep } from "./steps/discover.step";
import { parseComponentStep } from "./steps/parse-component.step";
import { buildPromptStep } from "./steps/build-prompt.step";
import { callLLMStep } from "./steps/call-llm.step";
import { generateStoryStep } from "./steps/generate-story.step";
import { writeStoryStep } from "./steps/write-story.step";

/**
 * Main orchestrator entry point.
 * You can customize the pipeline by editing `pipelineSteps`.
 */
export async function orchestrate(): Promise<void> {
  const inputDir = path.resolve(process.cwd(), config.inputDirectory);
  const framework = config.framework || "react";

  console.log(`[Orchestrator] Starting with framework: ${framework}`);

  const pipelineSteps: PipelineStep[] = [
    discoverStep,
    processEachFileStep([
      parseComponentStep,
      buildPromptStep,
      callLLMStep,
      generateStoryStep,
      writeStoryStep,
    ]),
  ];

  await runPipeline(pipelineSteps, { inputDir, framework });
}
