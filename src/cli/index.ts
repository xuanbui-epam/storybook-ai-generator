#!/usr/bin/env node
import { Command } from "commander";
import fs from "fs";
import path from "path";
import { orchestrate } from "../core/orchestrate";
import { getConfig } from "../core/config";

const program = new Command();

program
  .name("storybook-ai")
  .description("Generate Storybook stories automatically using AST + LLM")
  .version("1.0.0");

program
  .command("init-config")
  .description("Create a default storybook.config.cjs file in the current project")
  .action(() => {
    const projectRoot = process.cwd();
    const cjsConfigPath = path.join(projectRoot, "storybook.config.cjs");
    const jsConfigPath = path.join(projectRoot, "storybook.config.js");

    // Check if either config file already exists
    if (fs.existsSync(cjsConfigPath)) {
      console.log("✅ storybook.config.cjs already exists, no changes made.");
      return;
    }
    if (fs.existsSync(jsConfigPath)) {
      console.log("✅ storybook.config.js already exists, no changes made.");
      return;
    }

    const template = `// Configuration for @xsoft/storybook-ai-generator
// Adjust these paths/settings to match your project structure.

module.exports = {
  inputDirectory: "./src/components",
  outputFormat: "csf3",
  storybookVersion: "7",
  llmProvider: process.env.LLM_PROVIDER || "openai", // "openai" | "gemini"
  llmModel: process.env.LLM_MODEL || "gpt-4.1-mini",
  llmApiKey: process.env.LLM_API_KEY,
  // Optional: Specify framework ("react" | "angular" | "vue")
  // If not specified, will auto-detect from package.json
  // framework: "react",
  // Optional: directory where stories will be written
  // outputDir: "./src/stories",
  // Optional: only generate for files changed in git
  // useGitDiff: false,
};
`;

    fs.writeFileSync(cjsConfigPath, template, "utf-8");
    console.log("✅ Created storybook.config.cjs in project root.");
  });

program
  .command("generate")
  .description("Scan components and generate storybook files")
  .option("-w, --watch", "watch mode (not implemented)")
  .option(
    "-f, --framework <framework>",
    "Override framework detection (react, angular, vue)"
  )
  .action(async (opts) => {
    try {
      // Show detected/configured framework
      const config = getConfig();
      const framework = opts.framework || config.framework;
      
      console.log("╔═══════════════════════════════════════════════╗");
      console.log("║   Storybook AI Generator - Multi-Framework   ║");
      console.log("╚═══════════════════════════════════════════════╝");
      console.log(`Framework: ${framework}`);
      console.log(`Input Directory: ${config.inputDirectory}`);
      console.log(`LLM Provider: ${config.llmProvider}`);
      console.log(`LLM Model: ${config.llmModel}`);
      console.log("─────────────────────────────────────────────────\n");

      // Override framework if specified via CLI
      if (opts.framework) {
        config.framework = opts.framework as any;
        console.log(`[CLI] Framework overridden to: ${opts.framework}\n`);
      }

      await orchestrate();
      
      console.log("\n╔═══════════════════════════════════════════════╗");
      console.log("║          Generation finished! ✓               ║");
      console.log("╚═══════════════════════════════════════════════╝");
    } catch (err) {
      console.error("Error:", err);
      process.exit(1);
    }
  });

program.parse(process.argv);