import { ComponentMeta } from "../parser/tsParser";
import { LLMOutput } from "../ai/llm";
import path from "path";

export function renderStory(meta: ComponentMeta, llmParsed: LLMOutput, storyFileDir: string): string {
  console.log(
    "[7.0] Rendering Storybook stories for component:",
    meta.componentName,
    "with scenarios:",
    Array.isArray(llmParsed.StoriesScenarios) ? llmParsed.StoriesScenarios.length : 0,
  );
  
  // Since story file is in the same directory as component, we can import from the same file
  const componentFileName = path.basename(meta.filePath, path.extname(meta.filePath));
  const importPath = `./${componentFileName}`;
  
  let file = `import { ${meta.componentName} } from "${importPath}";\n\nexport default {\n  title: "${getTitle(meta)}",\n  component: ${meta.componentName},\n  tags: ['autodocs'],\n};\n\n`;

  // For each scenario create story
  llmParsed.StoriesScenarios.forEach((s) => {
    const args = JSON.stringify(s.props, null, 2);
    file += `export const ${toPascalCase(s.name)} = {\n  args: ${args},\n};\n\n`;
  });

  return file;
}

function getTitle(meta: ComponentMeta) {
  // derive title from directory or default to Atoms
  const parts = meta.directory.split("/");
  const idx = parts.lastIndexOf("components");
  if (idx >= 0 && parts.length > idx + 1) {
    const next = parts[idx + 1];
    return `${capitalize(next)}/${meta.componentName}`;
  }
  return `Atoms/${meta.componentName}`;
}

function toPascalCase(s: string) {
  return s
    .replace(/[^a-zA-Z0-9]/g, " ")
    .split(" ")
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
    .join("");
}

function capitalize(s: string) {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}