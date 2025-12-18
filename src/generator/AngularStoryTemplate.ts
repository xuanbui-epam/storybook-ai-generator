import { ComponentMeta } from "../model/ComponentMeta";
import { LLMOutput } from "../ai/llm";
import path from "path";
import { IStoryTemplate } from "./IStoryTemplate";
import { Framework } from "../model/Framework";

export class AngularStoryTemplate implements IStoryTemplate {
  readonly framework: Framework = "angular";

  getStoryFileExtension(): string {
    return ".stories.ts";
  }

  renderStory(
    meta: ComponentMeta,
    llmParsed: LLMOutput,
    storyFileDir: string
  ): string {
    console.log(
      "[7.0] Rendering Angular Storybook stories for component:",
      meta.componentName,
      "with scenarios:",
      Array.isArray(llmParsed.StoriesScenarios)
        ? llmParsed.StoriesScenarios.length
        : 0
    );

    // Import component from same directory
    const componentFileName = path.basename(
      meta.filePath,
      path.extname(meta.filePath)
    );
    const importPath = `./${componentFileName}`;

    // Angular stories use Meta and StoryObj types from @storybook/angular
    let file = `import type { Meta, StoryObj } from '@storybook/angular';\nimport { ${meta.componentName} } from "${importPath}";\n\n`;

    // Define meta with moduleMetadata for Angular
    file += `const meta: Meta<${meta.componentName}> = {\n`;
    file += `  title: '${this.getTitle(meta)}',\n`;
    file += `  component: ${meta.componentName},\n`;
    file += `  tags: ['autodocs'],\n`;
    file += `};\n\n`;
    file += `export default meta;\n`;
    file += `type Story = StoryObj<${meta.componentName}>;\n\n`;

    // Check if component has ng-content (content projection)
    const hasNgContent = meta.props.some((p) => p.name === "ngContent" && p.type === "content-projection");

    // Extract selector from component (derive from component name)
    const selector = this.getSelector(meta.componentName);

    // For each scenario create story
    llmParsed.StoriesScenarios.forEach((s) => {
      // Handle content projection (ngContent is a pseudo-prop)
      const storyProps = { ...s.props };
      let contentProjection: string | null = null;

      // Extract ngContent from props
      if ("ngContent" in storyProps) {
        const ngContentValue = storyProps.ngContent;
        contentProjection = typeof ngContentValue === "string" ? ngContentValue : null;
        delete storyProps.ngContent;
      }

      // Filter out null and undefined values from props
      // TypeScript expects undefined for optional props, but JSON.stringify converts it to null
      const filteredProps: Record<string, any> = {};
      for (const [key, value] of Object.entries(storyProps)) {
        if (value !== null && value !== undefined) {
          filteredProps[key] = value;
        }
      }

      file += `export const ${this.toPascalCase(s.name)}: Story = {\n`;

      if (Object.keys(filteredProps).length > 0) {
        const args = JSON.stringify(filteredProps, null, 2);
        file += `  args: ${args},\n`;
      }

      // Add render function if component has content projection
      const needsRenderFunction = contentProjection !== null || hasNgContent;
      
      if (needsRenderFunction) {
        // Use content projection if provided, otherwise use sensible default
        const templateContent = contentProjection !== null && contentProjection !== ""
          ? contentProjection
          : this.getDefaultContent(meta.componentName, s.name);

        // Escape backticks in content
        const escapedContent = this.escapeTemplateContent(templateContent);

        // Build template with input bindings
        const inputBindings = Object.keys(filteredProps)
          .map(key => `[${key}]="${key}"`)
          .join(" ");

        file += `  render: (args) => ({\n`;
        file += `    props: args,\n`;
        file += `    template: \`<${selector} ${inputBindings}>${escapedContent}</${selector}>\`,\n`;
        file += `  }),\n`;
      }

      file += `};\n\n`;
    });

    return file;
  }

  /**
   * Get Angular selector from component name
   * ButtonComponent -> app-button
   */
  private getSelector(componentName: string): string {
    // Remove "Component" suffix and convert to kebab-case
    const name = componentName.replace(/Component$/, "");
    const kebab = name.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    return `app-${kebab}`;
  }

  /**
   * Escape content for use in a template literal
   */
  private escapeTemplateContent(content: string): string {
    return content
      .replace(/\\/g, "\\\\")
      .replace(/`/g, "\\`")
      .replace(/\$\{/g, "\\${");
  }

  /**
   * Generate sensible default content based on component type and story name
   */
  private getDefaultContent(componentName: string, storyName: string): string {
    const lowerComponent = componentName.toLowerCase();
    const lowerStory = storyName.toLowerCase();

    if (lowerComponent.includes("button")) {
      if (lowerStory.includes("disabled")) return "Disabled";
      if (lowerStory.includes("loading")) return "Loading...";
      if (lowerStory.includes("primary")) return "Click me";
      if (lowerStory.includes("secondary")) return "Secondary";
      if (lowerStory.includes("full")) return "Full Width Button";
      return "Button";
    }

    if (lowerComponent.includes("card")) {
      return "Card content";
    }

    if (lowerComponent.includes("alert") || lowerComponent.includes("notification")) {
      return "Alert message";
    }

    return "Content";
  }

  private getTitle(meta: ComponentMeta): string {
    // derive title from directory or default to Components
    const parts = meta.directory.split("/");
    const idx = parts.lastIndexOf("components");
    if (idx >= 0 && parts.length > idx + 1) {
      const next = parts[idx + 1];
      return `${this.capitalize(next)}/${meta.componentName}`;
    }
    return `Components/${meta.componentName}`;
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

