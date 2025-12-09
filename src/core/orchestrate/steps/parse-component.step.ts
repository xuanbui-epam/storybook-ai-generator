import { PipelineStep } from "../../../model/PipelineContext";
import { parseComponentFile } from "../../../parser/tsParser";

/**
 * Step: parse the current file into ComponentMeta.
 */
export const parseComponentStep: PipelineStep = async (ctx) => {
  const file = ctx.currentFile;
  if (!file) return;

  console.log("[2] Parsing component file…");

  try {
    const meta = await parseComponentFile(file);

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