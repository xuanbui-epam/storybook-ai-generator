
import path from "path";
import { globSync } from "glob";
import { execSync } from "child_process";
import { PipelineStep } from "../../../model/PipelineContext";

const STORY_IGNORE_PATTERNS = [
  "**/*.stories.*",
  "**/*.story.*",
  "**/node_modules/**",
];

const SUPPORTED_EXTENSIONS_GLOB = "*.{tsx,ts,jsx}";

/**
 * Step: discover staged component files under ctx.inputDir.
 * Populates ctx.files.
 */
export const discoverStep: PipelineStep = async (ctx) => {
  console.log("[1] Discovering staged component files…");
  console.log("    Input dir:", ctx.inputDir);

  const stagedFiles = getStagedFilesScopedToDir(ctx.inputDir);
  if (!stagedFiles.size) {
    console.log("[1.1] No staged files found under input directory.");
    ctx.files = [];
    return;
  }

  const pattern = path.join(ctx.inputDir, "**", SUPPORTED_EXTENSIONS_GLOB);

  const allComponentFiles = globSync(pattern, {
    ignore: STORY_IGNORE_PATTERNS,
  }).filter((filePath) => !isStoryFile(filePath));

  const stagedComponentFiles = allComponentFiles.filter((filePath) =>
    stagedFiles.has(filePath)
  );

  ctx.files = stagedComponentFiles;

  console.log("[1.2] Total component files found:", allComponentFiles.length);
  console.log(
    "[1.3] Staged component files to process:",
    stagedComponentFiles.length
  );
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
