import { Command } from "commander";
import fs from "fs";
import path from "path";
import { orchestrate } from "../core/orchestrate";

const program = new Command();

program
  .name("storybook-ai")
  .description("Generate Storybook stories automatically using AST + LLM")
  .version("0.1.0");

program
  .command("init-config")
  .description("Create a default storybook.config.js file in the current project")
  .action(() => {
    const projectRoot = process.cwd();
    const configPath = path.join(projectRoot, "storybook.config.js");

    if (fs.existsSync(configPath)) {
      console.log("✅ storybook.config.js already exists, no changes made.");
      return;
    }

    const template = `// Configuration for @storybook/storybook-ai-generator
// Adjust these paths/settings to match your project structure.

module.exports = {
  inputDirectory: "./src/components",
  outputFormat: "csf3",
  storybookVersion: "7",
  llmProvider: process.env.LLM_PROVIDER || "openai", // "openai" | "gemini"
  llmModel: process.env.LLM_MODEL || "gpt-4.1-mini",
  llmApiKey: process.env.LLM_API_KEY,
  // Optional: directory where stories will be written
  // outputDir: "./src/stories",
  // Optional: only generate for files changed in git
  // useGitDiff: false,
};
`;

    fs.writeFileSync(configPath, template, "utf-8");
    console.log("✅ Created storybook.config.js in project root.");
  });

program
  .command("generate")
  .description("Scan components and generate storybook files")
  .option("-w, --watch", "watch mode (not implemented)")
  .action(async (opts) => {
    try {
      await orchestrate();
      console.log("Generation finished.");
    } catch (err) {
      console.error("Error:", err);
      process.exit(1);
    }
  });

program.parse(process.argv);