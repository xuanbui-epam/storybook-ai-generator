import fs from "fs/promises";
import path from "path";
import { Framework } from "../model/Framework";
import { TemplateFactory } from "./TemplateFactory";

/**
 * Writes story file in the same directory as the component file
 * @param componentFilePath - Full path to the component file
 * @param content - Story file content
 * @param framework - The framework being used (for determining file extension)
 * @returns Path to the written story file
 */
export async function writeStoryFile(
  componentFilePath: string,
  content: string,
  framework: Framework
) {
  // Get the directory and base name of the component file
  const componentDir = path.dirname(componentFilePath);
  const componentBase = path.basename(
    componentFilePath,
    path.extname(componentFilePath)
  );

  // Get framework-specific story file extension
  const template = TemplateFactory.getTemplate(framework);
  const storyExtension = template.getStoryFileExtension();

  // Create story file in the same directory
  const storyFilename = path.join(
    componentDir,
    `${componentBase}${storyExtension}`
  );

  // Ensure directory exists (should already exist since component is there)
  await fs.mkdir(componentDir, { recursive: true });

  // Write the story file
  await fs.writeFile(storyFilename, content, "utf-8");
  console.log("[8.0] Story file written:", storyFilename);

  return storyFilename;
}