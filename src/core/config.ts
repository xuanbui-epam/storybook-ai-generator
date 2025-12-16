import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const projectRoot = process.cwd();
const jsConfigPath = path.join(projectRoot, "storybook.config.js");

export type AppConfig = {
  inputDirectory: string;
  outputFormat: string;
  storybookVersion: string;
  llmModel: string;
  llmProvider: "openai" | "gemini";
  llmApiKey: string;
  outputDir?: string;
  useGitDiff?: boolean;
};

function loadConfig(): AppConfig {
  // Require JS config (storybook.config.js)
  if (fs.existsSync(jsConfigPath)) {
    // CommonJS require so that consumers can use module.exports
    // or export default.
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const loaded = require(jsConfigPath);
    const resolved = loaded?.default ?? loaded;

    if (!resolved || typeof resolved !== "object") {
      throw new Error(
        "storybook.config.js must export a plain object configuration"
      );
    }

    return resolved as AppConfig;
  }

  throw new Error(
    [
      "No configuration found for storybook-ai.",
      "Please create a storybook.config.js in your project root by running:",
      "",
      "  npx storybook-ai init-config",
      "",
      "Then adjust the generated config to match your project structure.",
    ].join("\n")
  );
}

export const config: AppConfig = loadConfig();

export const env = {
  llmProvider: config.llmProvider ?? process.env.LLM_PROVIDER ?? "openai",
  llmApiKey: config.llmApiKey ?? process.env.LLM_API_KEY,
  llmModel: config.llmModel ?? process.env.LLM_MODEL ?? "gpt-4.1-mini",
};