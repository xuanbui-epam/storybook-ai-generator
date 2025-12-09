import { Command } from "commander";
import { orchestrate } from "../core/orchestrate";

const program = new Command();

program
  .name("storybook-ai")
  .description("Generate Storybook stories automatically using AST + LLM")
  .version("0.1.0");

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