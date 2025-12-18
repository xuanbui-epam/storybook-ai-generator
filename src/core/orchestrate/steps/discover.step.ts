
import path from "path";
import { globSync } from "glob";
import { execSync } from "child_process";
import { PipelineStep } from "../../../model/PipelineContext";
import { config } from "../../config";
import { getFileExtensionGlob } from "../../../model/Framework";
import { ParserFactory } from "../../../parser/ParserFactory";

const STORY_IGNORE_PATTERNS = [
  "**/*.stories.*",
  "**/*.story.*",
  "**/node_modules/**",
];

/**
 * Step: discover component files under ctx.inputDir.
 * Populates ctx.files and ctx.availableComponents.
 * - If useGitDiff is true: only discovers staged files from Git
 * - If useGitDiff is false: discovers all component files in the directory
 * - Also extracts component names from all files to populate availableComponents
 */
export const discoverStep: PipelineStep = async (ctx) => {
  const useGitDiff = config.useGitDiff || false; // Default to false if not specified
  const framework = ctx.framework || config.framework || "react";

  // Get framework-specific file extension glob
  const extensionGlob = getFileExtensionGlob(framework);

  // First, scan all component files to get available components list
  const pattern = path.join(ctx.inputDir, "**", extensionGlob);
  const allComponentFiles = globSync(pattern, {
    ignore: STORY_IGNORE_PATTERNS,
  }).filter((filePath) => !isStoryFile(filePath));

  // Extract component names from all files using framework-specific parser
  const componentNames = new Set<string>();
  const parser = ParserFactory.getParser(framework);

  for (const filePath of allComponentFiles) {
    try {
      const compName = await parser.extractComponentName(filePath);
      if (compName) {
        componentNames.add(compName);
      }
    } catch (error) {
      // Skip files that can't be parsed
      console.warn(
        `[1.0] Failed to parse component name from ${filePath}:`,
        (error as Error).message
      );
    }
  }
  ctx.availableComponents = Array.from(componentNames).sort();
  console.log(
    "[1.0] Found",
    ctx.availableComponents.length,
    "available components:",
    ctx.availableComponents.join(", ")
  );

  if (useGitDiff) {
    console.log("[1] Discovering staged component files…");
    console.log("    Input dir:", ctx.inputDir);

    const stagedFiles = getStagedFilesScopedToDir(ctx.inputDir);
    if (!stagedFiles.size) {
      console.log("[1.1] No staged files found under input directory.");
      ctx.files = [];
      return;
    }

    const stagedComponentFiles = allComponentFiles.filter((filePath) =>
      stagedFiles.has(filePath)
    );

    ctx.files = stagedComponentFiles;

    console.log("[1.2] Total component files found:", allComponentFiles.length);
    console.log(
      "[1.3] Staged component files to process:",
      stagedComponentFiles.length
    );
  } else {
    console.log("[1] Discovering all component files…");
    console.log("    Input dir:", ctx.inputDir);

    ctx.files = allComponentFiles;

    console.log("[1.1] Total component files found:", allComponentFiles.length);
    console.log(
      "[1.2] Component files to process:",
      allComponentFiles.length
    );
  }
};

function isStoryFile(filePath: string): boolean {
  return filePath.includes(".stories.") || filePath.includes(".story.");
}


/**
 * Returns staged files from Git, scoped to the given directory.
 * - Uses "git diff --name-only --cached -- <dir>"
 * - Returns a Set of absolute paths for fast lookup.
 */
function getStagedFilesScopedToDir(scopeDir: string): Set<string> {
  try {
    const cwd = process.cwd();
    const relativeScope = path.relative(cwd, scopeDir) || ".";

    const command = `git diff --name-only --cached -- ${relativeScope}`;
    const output = execSync(command, { encoding: "utf8" });

    if (!output.trim()) {
      return new Set();
    }

    const files = output
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean)
      .map((relativePath) => path.resolve(cwd, relativePath));

    return new Set(files);
  } catch (error) {
    console.warn(
      "[git] Unable to read staged files (possibly not a Git repo or no staged changes):",
      (error as Error).message
    );
    return new Set();
  }
}
