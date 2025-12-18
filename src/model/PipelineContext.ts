import { LLMOutput } from "../ai/llm";
import { ComponentMeta } from "./ComponentMeta";
import { Framework } from "./Framework";

export type PipelineContext = {
  inputDir: string;
  framework: Framework;
  files?: string[];
  currentFile?: string;
  meta?: ComponentMeta | null;
  prompt?: string;
  llmOutput?: LLMOutput | null;
  storyCode?: string;
  availableComponents?: string[];
};

export type PipelineStep = (ctx: PipelineContext) => Promise<void>;


