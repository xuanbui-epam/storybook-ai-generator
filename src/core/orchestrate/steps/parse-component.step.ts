import { PipelineStep } from "../../../model/PipelineContext";
import { ParserFactory } from "../../../parser/ParserFactory";

/**
 * Step: parse the current file into ComponentMeta using framework-specific parser.
 */
export const parseComponentStep: PipelineStep = async (ctx) => {
  const file = ctx.currentFile;
  if (!file) return;

  console.log("[2] Parsing component file…");

  try {
    // Get framework-specific parser
    const parser = ParserFactory.getParser(ctx.framework);
    const meta = await parser.parseComponentFile(file);

    if (!meta) {
      console.log("[2.1] No component found, skipping.");
      ctx.meta = null;
      return;
    }

    ctx.meta = meta;

    const propsSummary =
      meta.props?.map((p) => p.name).join(", ") || "(no props)";

    console.log("[2.2] Parsed component:", meta.componentName);
    console.log("      Props:", propsSummary);
  } catch (error) {
    console.error("[2.E] Failed to parse component file:", file, error);
    ctx.meta = null;
  }
};