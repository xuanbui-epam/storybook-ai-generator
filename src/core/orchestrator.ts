import path from "path";
import { globSync } from "glob";
import { config } from "./config";
import { parseComponentFile, ComponentMeta } from "../parser/tsParser";
import { buildPrompt } from "../ai/promptBuilder";
import { callLLM, LLMOutput } from "../ai/llm";
import { renderStory } from "../generator/storyTemplate";
import { writeStoryFile } from "../generator/writer";

export async function orchestrate() {
  const inputDir = path.join(process.cwd(), config.inputDirectory);
  console.log("[1] Scanning components from:", inputDir);
  const pattern = `${inputDir}/**/*.{tsx,ts,jsx}`;
  const files = globSync(pattern, { 
    ignore: ["**/*.stories.*", "**/*.story.*", "**/node_modules/**"] 
  }).filter(file => !file.includes('.stories.') && !file.includes('.story.'));

  if (!files.length) {
    console.log("No components found at", inputDir);
    return;
  }

  console.log("[1.1] Found component files:", files.length);

  for (const file of files) {
    try {
      console.log("\n=== Component file ===");
      console.log("[2] Processing file:", file);
      const meta: ComponentMeta | null = await parseComponentFile(file);
      if (!meta) {
        console.log("[2.1] Skipping (no component found):", file);
        continue;
      }

      console.log(
        "[3] Parsed component:",
        meta.componentName,
        "props:",
        meta.props.map((p) => p.name).join(", ") || "(no props)",
      );

      const prompt = buildPrompt(meta);
      console.log("[4] Built LLM prompt (chars):", prompt.length);

      // LangChain returns structured output directly, no need for manual parsing
      let parsed: LLMOutput;
      try {
        parsed = await callLLM(prompt);
        console.log(
          "[5] Received structured LLM output with scenarios:",
          Array.isArray(parsed?.StoriesScenarios) ? parsed.StoriesScenarios.length : 0,
        );
      } catch (e) {
        console.error("Failed to get LLM response for", file, e);
        continue;
      }

      // Generate story code - story file will be in the same directory as component
      const componentDir = path.dirname(file);
      const storyCode = renderStory(meta, parsed, componentDir);
      console.log("[7] Generated Storybook code (chars):", storyCode.length);

      // Write story file in the same directory as component
      const writtenPath = await writeStoryFile(file, storyCode);

      console.log("[8] Written story for component:", meta.componentName);
      console.log("    ->", writtenPath);
    } catch (err) {
      console.error("Error processing", file, err);
    }
  }
}