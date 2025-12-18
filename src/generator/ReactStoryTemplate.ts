import { ComponentMeta } from "../model/ComponentMeta";
import { LLMOutput } from "../ai/llm";
import path from "path";
import { IStoryTemplate } from "./IStoryTemplate";
import { Framework } from "../model/Framework";

export class ReactStoryTemplate implements IStoryTemplate {
  readonly framework: Framework = "react";

  getStoryFileExtension(): string {
    return ".stories.tsx";
  }

  renderStory(
    meta: ComponentMeta,
    llmParsed: LLMOutput,
    storyFileDir: string
  ): string {
    console.log(
      "[7.0] Rendering React Storybook stories for component:",
      meta.componentName,
      "with scenarios:",
      Array.isArray(llmParsed.StoriesScenarios)
        ? llmParsed.StoriesScenarios.length
        : 0
    );

    // Since story file is in the same directory as component, we can import from the same file
    const componentFileName = path.basename(
      meta.filePath,
      path.extname(meta.filePath)
    );
    const importPath = `./${componentFileName}`;

    let file = `import { ${meta.componentName} } from "${importPath}";\n\nexport default {\n  title: "${this.getTitle(meta)}",\n  component: ${meta.componentName},\n  tags: ['autodocs'],\n};\n\n`;

    // For each scenario create story
    llmParsed.StoriesScenarios.forEach((s) => {
      const args = JSON.stringify(s.props, null, 2);
      file += `export const ${this.toPascalCase(s.name)} = {\n  args: ${args},\n};\n\n`;
    });

    return file;
  }

  private getTitle(meta: ComponentMeta): string {
    // derive title from directory or default to Atoms
    const parts = meta.directory.split("/");
    const idx = parts.lastIndexOf("components");
    if (idx >= 0 && parts.length > idx + 1) {
      const next = parts[idx + 1];
      return `${this.capitalize(next)}/${meta.componentName}`;
    }
    return `Atoms/${meta.componentName}`;
  }

  private toPascalCase(s: string): string {
    return s
      .replace(/[^a-zA-Z0-9]/g, " ")
      .split(" ")
      .map((x) => x.charAt(0).toUpperCase() + x.slice(1))
      .join("");
  }

  private capitalize(s: string): string {
    if (!s) return s;
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}

