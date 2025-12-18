import { ComponentMeta } from "../model/ComponentMeta";
import { LLMOutput } from "../ai/llm";
import path from "path";
import { IStoryTemplate } from "./IStoryTemplate";
import { Framework } from "../model/Framework";

export class VueStoryTemplate implements IStoryTemplate {
  readonly framework: Framework = "vue";

  getStoryFileExtension(): string {
    return ".stories.ts";
  }

  renderStory(
    meta: ComponentMeta,
    llmParsed: LLMOutput,
    storyFileDir: string
  ): string {
    console.log(
      "[7.0] Rendering Vue Storybook stories for component:",
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
    const importPath = `./${componentFileName}.vue`;

    // Vue 3 stories use Meta and StoryObj types from @storybook/vue3
    let file = `import type { Meta, StoryObj } from '@storybook/vue3';\nimport ${meta.componentName} from "${importPath}";\n\n`;

    // Define meta
    file += `const meta: Meta<typeof ${meta.componentName}> = {\n`;
    file += `  title: '${this.getTitle(meta)}',\n`;
    file += `  component: ${meta.componentName},\n`;
    file += `  tags: ['autodocs'],\n`;
    file += `};\n\n`;
    file += `export default meta;\n`;
    file += `type Story = StoryObj<typeof ${meta.componentName}>;\n\n`;

    // Check if component has default slot
    const hasDefaultSlot = meta.props.some((p) => p.name === "default" && p.type === "slot");

    // For each scenario create story
    llmParsed.StoriesScenarios.forEach((s) => {
      // Handle slot content (default slot is a special prop in our parser)
      const storyProps = { ...s.props };
      let slotContent: string | null = null;

      // Extract slot content from props
      if ("default" in storyProps) {
        const defaultValue = storyProps.default;
        slotContent = typeof defaultValue === "string" ? defaultValue : "";
        delete storyProps.default;
      }

      file += `export const ${this.toPascalCase(s.name)}: Story = {\n`;

      if (Object.keys(storyProps).length > 0) {
        const args = JSON.stringify(storyProps, null, 2);
        file += `  args: ${args},\n`;
      }

      // Add render function if:
      // 1. There's explicit slot content, OR
      // 2. Component has default slot (to provide a placeholder)
      const needsRenderFunction = slotContent !== null || hasDefaultSlot;
      
      if (needsRenderFunction) {
        // Use slot content if provided, otherwise use a sensible default based on component name
        const templateContent = slotContent !== null && slotContent !== "" 
          ? slotContent 
          : this.getDefaultSlotContent(meta.componentName, s.name);

        // Escape backticks and ${} in template content for use in template literal
        const escapedContent = this.escapeTemplateContent(templateContent);

        file += `  render: (args) => ({\n`;
        file += `    components: { ${meta.componentName} },\n`;
        file += `    setup() {\n`;
        file += `      return { args };\n`;
        file += `    },\n`;
        file += "    template: `<" + meta.componentName + ' v-bind="args">' + escapedContent + "</" + meta.componentName + ">`,\n";
        file += `  }),\n`;
      }

      file += `};\n\n`;
    });

    return file;
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

  /**
   * Escape content for use in a template literal
   * - Escape backticks
   * - Escape ${ to prevent interpolation
   */
  private escapeTemplateContent(content: string): string {
    return content
      .replace(/\\/g, "\\\\")      // Escape backslashes first
      .replace(/`/g, "\\`")        // Escape backticks
      .replace(/\$\{/g, "\\${");   // Escape template interpolation
  }

  /**
   * Generate sensible default slot content based on component type and story name
   */
  private getDefaultSlotContent(componentName: string, storyName: string): string {
    const lowerComponent = componentName.toLowerCase();
    const lowerStory = storyName.toLowerCase();

    // Button-like components
    if (lowerComponent.includes("button") || lowerComponent.includes("btn")) {
      if (lowerStory.includes("disabled")) return "Disabled";
      if (lowerStory.includes("loading")) return "Loading...";
      if (lowerStory.includes("primary")) return "Click me";
      if (lowerStory.includes("secondary")) return "Secondary";
      if (lowerStory.includes("outline")) return "Outline";
      if (lowerStory.includes("icon")) return "With Icon";
      if (lowerStory.includes("empty")) return "";
      return "Button";
    }

    // Card-like components
    if (lowerComponent.includes("card")) {
      if (lowerStory.includes("empty")) return "";
      return "Card content goes here";
    }

    // Link-like components
    if (lowerComponent.includes("link")) {
      return "Link text";
    }

    // Tab-like components
    if (lowerComponent.includes("tab")) {
      return "Tab content";
    }

    // Modal/Dialog components
    if (lowerComponent.includes("modal") || lowerComponent.includes("dialog")) {
      return "Modal content";
    }

    // Alert/Notification components
    if (lowerComponent.includes("alert") || lowerComponent.includes("notification")) {
      return "Alert message";
    }

    // Default fallback
    if (lowerStory.includes("empty")) return "";
    return "Content";
  }
}

