import { ComponentMeta } from "../model/ComponentMeta";
import { LLMOutput } from "../ai/llm";
import { Framework } from "../model/Framework";

/**
 * Interface for framework-specific story template generators.
 * Each framework (React, Angular, Vue) implements this interface
 * to generate Storybook story files in the appropriate format.
 */
export interface IStoryTemplate {
  /**
   * The framework this template handles
   */
  readonly framework: Framework;

  /**
   * Render a Storybook story file for the component
   * @param meta - Component metadata
   * @param llmParsed - Parsed LLM output with story scenarios
   * @param storyFileDir - Directory where the story file will be written
   * @returns The generated story file content as a string
   */
  renderStory(
    meta: ComponentMeta,
    llmParsed: LLMOutput,
    storyFileDir: string
  ): string;

  /**
   * Get the file extension for story files
   * @returns File extension (e.g., ".stories.tsx", ".stories.ts")
   */
  getStoryFileExtension(): string;
}

