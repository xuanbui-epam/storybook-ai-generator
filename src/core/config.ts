import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const projectRoot = process.cwd();
const configPath = path.join(projectRoot, "config.json");

if (!fs.existsSync(configPath)) {
  throw new Error("config.json not found in project root");
}

export type AppConfig = {
  inputDirectory: string;
  outputFormat: string;
  storybookVersion: string;
  llmModel: string;
  llmProvider?: "openai" | "gemini";
  outputDir?: string;
};

const raw = fs.readFileSync(configPath, "utf-8");
export const config: AppConfig = JSON.parse(raw);

export const env = {
  llmProvider: process.env.LLM_PROVIDER || "openai",
  llmApiKey: process.env.LLM_API_KEY,
  llmModel: process.env.LLM_MODEL,
};