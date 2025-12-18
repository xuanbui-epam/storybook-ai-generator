import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const projectRoot = process.cwd();
const cjsConfigPath = path.join(projectRoot, "storybook.config.cjs");
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
  // Try .cjs first (for ESM projects), then .js
  const configPath = fs.existsSync(cjsConfigPath)
    ? cjsConfigPath
    : fs.existsSync(jsConfigPath)
      ? jsConfigPath
      : null;

  if (configPath) {
    // CommonJS require so that consumers can use module.exports
    // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
    const loaded = require(configPath);
    const resolved = loaded?.default ?? loaded;

    if (!resolved || typeof resolved !== "object") {
      throw new Error(
        "storybook.config.cjs/js must export a plain object configuration"
      );
    }

    return resolved as AppConfig;
  }

  throw new Error(
    [
      "No configuration found for storybook-ai.",
      "Please create a storybook.config.cjs in your project root by running:",
      "",
      "  npx storybook-ai init-config",
      "",
      "Then adjust the generated config to match your project structure.",
    ].join("\n")
  );
}

// Lazy-loaded config singleton
let _config: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

// For backward compatibility - but prefer using getConfig()
export const config = new Proxy({} as AppConfig, {
  get(_, prop: keyof AppConfig) {
    return getConfig()[prop];
  },
});

export const env = {
  get llmProvider() {
    return getConfig().llmProvider ?? process.env.LLM_PROVIDER ?? "openai";
  },
  get llmApiKey() {
    return getConfig().llmApiKey ?? process.env.LLM_API_KEY;
  },
  get llmModel() {
    return getConfig().llmModel ?? process.env.LLM_MODEL ?? "gpt-4.1-mini";
  },
};