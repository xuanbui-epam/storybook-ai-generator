import fs from "fs";
import path from "path";
import { ComponentMeta } from "../model/ComponentMeta";
import { PropDef } from "../model/PropDef";
import { IComponentParser } from "./IComponentParser";
import { Framework } from "../model/Framework";

export class VueParser implements IComponentParser {
  readonly framework: Framework = "vue";

  canParse(filePath: string): boolean {
    return filePath.endsWith(".vue");
  }

  async parseComponentFile(filePath: string): Promise<ComponentMeta | null> {
    console.log("[2.0] Parsing Vue SFC file:", filePath);

    const fileContent = fs.readFileSync(filePath, "utf-8");

    try {
      // Dynamically import @vue/compiler-sfc
      const { parse } = await import("@vue/compiler-sfc");
      const { descriptor, errors } = parse(fileContent);

      if (errors.length > 0) {
        console.warn(
          "[2.1] Errors parsing Vue SFC:",
          errors.map((e) => e.message).join(", ")
        );
      }

      if (!descriptor.script && !descriptor.scriptSetup) {
        console.log("[2.1] No script block found in Vue SFC, skipping:", filePath);
        return null;
      }

      // Extract component name from filename
      const fileName = path.basename(filePath, ".vue");
      const compName = this.pascalCase(fileName);

      console.log("[2.2] Found Vue component:", compName);

      // Parse props from script setup or script
      const props = await this.extractProps(descriptor);

      // Check for slot usage (Vue's equivalent of children)
      const hasSlots = this.detectSlots(descriptor);
      if (hasSlots) {
        console.log("[2.3] Detected slot usage");
        // Add default slot as a pseudo-prop for story generation
        const hasDefaultSlot = props.some((p) => p.name === "default");
        if (!hasDefaultSlot && this.hasDefaultSlot(descriptor)) {
          props.push({
            name: "default",
            type: "slot",
            required: false,
            description: "Default slot content",
          });
        }
      }

      return {
        componentName: compName,
        filePath,
        directory: path.dirname(filePath),
        props,
        rawCode: fileContent,
      };
    } catch (error) {
      console.warn(
        "[2.1] Failed to parse Vue SFC (is @vue/compiler-sfc installed?):",
        (error as Error).message
      );
      return null;
    }
  }

  async extractComponentName(filePath: string): Promise<string | null> {
    // For Vue SFCs, component name is typically derived from filename
    const fileName = path.basename(filePath, ".vue");
    return this.pascalCase(fileName);
  }

  /**
   * Extract props from Vue SFC descriptor
   */
  private async extractProps(descriptor: any): Promise<PropDef[]> {
    const props: PropDef[] = [];

    // Handle script setup (Vue 3 Composition API)
    if (descriptor.scriptSetup) {
      const scriptContent = descriptor.scriptSetup.content;
      props.push(...this.parseScriptSetupProps(scriptContent));
    }

    // Handle regular script block (Options API or Composition API)
    if (descriptor.script) {
      const scriptContent = descriptor.script.content;
      props.push(...this.parseScriptProps(scriptContent));
    }

    return props;
  }

  /**
   * Parse props from script setup block
   */
  private parseScriptSetupProps(scriptContent: string): PropDef[] {
    const props: PropDef[] = [];

    // Case 1: Look for defineProps<{ ... }>() - inline type definition
    const definePropsInlineMatch = scriptContent.match(
      /defineProps<\s*\{([^}]+)\}\s*>/s
    );
    if (definePropsInlineMatch) {
      const propsBlock = definePropsInlineMatch[1];
      props.push(...this.parsePropsFromTypeBlock(propsBlock));
      return props;
    }

    // Case 2: Look for defineProps<InterfaceName>() - referenced interface
    const definePropsRefMatch = scriptContent.match(
      /defineProps<\s*(\w+)\s*>\s*\(\s*\)/
    );
    if (definePropsRefMatch) {
      const interfaceName = definePropsRefMatch[1];
      console.log(`[2.2.1] Found defineProps with interface: ${interfaceName}`);
      
      // Find the interface definition in the script
      const interfaceProps = this.parseInterfaceProps(scriptContent, interfaceName);
      if (interfaceProps.length > 0) {
        props.push(...interfaceProps);
        return props;
      }
    }

    // Case 3: Look for withDefaults(defineProps<InterfaceName>(), { ... })
    const withDefaultsMatch = scriptContent.match(
      /withDefaults\s*\(\s*defineProps<\s*(\w+)\s*>\s*\(\s*\)/
    );
    if (withDefaultsMatch) {
      const interfaceName = withDefaultsMatch[1];
      console.log(`[2.2.1] Found withDefaults with interface: ${interfaceName}`);
      
      // Find the interface definition and parse defaults
      const interfaceProps = this.parseInterfaceProps(scriptContent, interfaceName);
      
      // Try to extract default values from withDefaults
      const defaultsMatch = scriptContent.match(
        /withDefaults\s*\(\s*defineProps<\s*\w+\s*>\s*\(\s*\)\s*,\s*\{([^}]+)\}/s
      );
      if (defaultsMatch) {
        const defaultsBlock = defaultsMatch[1];
        this.applyDefaultValues(interfaceProps, defaultsBlock);
      }
      
      if (interfaceProps.length > 0) {
        props.push(...interfaceProps);
        return props;
      }
    }

    // Case 4: Look for defineProps({ ... }) with runtime declaration
    const definePropsRuntimeMatch = scriptContent.match(
      /defineProps\(\s*\{([^}]+)\}\s*\)/s
    );
    if (definePropsRuntimeMatch) {
      const propsBlock = definePropsRuntimeMatch[1];
      props.push(...this.parsePropsFromRuntimeBlock(propsBlock));
    }

    return props;
  }

  /**
   * Parse props from a TypeScript interface definition
   */
  private parseInterfaceProps(scriptContent: string, interfaceName: string): PropDef[] {
    const props: PropDef[] = [];

    // Match interface or export interface with multi-line content
    // Use a more robust regex that handles nested braces
    const interfaceRegex = new RegExp(
      `(?:export\\s+)?interface\\s+${interfaceName}\\s*\\{([\\s\\S]*?)\\n\\}`,
      "m"
    );
    const interfaceMatch = scriptContent.match(interfaceRegex);

    if (interfaceMatch) {
      const propsBlock = interfaceMatch[1];
      console.log(`[2.2.2] Found interface ${interfaceName}, parsing props...`);
      props.push(...this.parsePropsFromTypeBlock(propsBlock));
    } else {
      console.log(`[2.2.2] Interface ${interfaceName} not found in script`);
    }

    return props;
  }

  /**
   * Apply default values from withDefaults to prop definitions
   */
  private applyDefaultValues(props: PropDef[], defaultsBlock: string): void {
    // Parse default values like: variant: 'primary', size: 'md', disabled: false
    const defaultPattern = /(\w+):\s*(['"]?[\w-]+['"]?|true|false|\d+)/g;
    let match;

    while ((match = defaultPattern.exec(defaultsBlock)) !== null) {
      const [, propName, defaultValue] = match;
      const prop = props.find(p => p.name === propName);
      if (prop) {
        // Parse the default value
        let parsedValue: string | number | boolean = defaultValue;
        if (defaultValue === "true") parsedValue = true;
        else if (defaultValue === "false") parsedValue = false;
        else if (/^\d+$/.test(defaultValue)) parsedValue = parseInt(defaultValue, 10);
        else parsedValue = defaultValue.replace(/['"]/g, "");
        
        prop.defaultValue = parsedValue;
        // Props with defaults are not required
        prop.required = false;
      }
    }
  }

  /**
   * Parse props from regular script block (Options API)
   */
  private parseScriptProps(scriptContent: string): PropDef[] {
    const props: PropDef[] = [];

    // Look for props: { ... } in Options API
    const propsMatch = scriptContent.match(/props:\s*\{([^}]+)\}/s);
    if (propsMatch) {
      const propsBlock = propsMatch[1];
      props.push(...this.parsePropsFromRuntimeBlock(propsBlock));
    }

    return props;
  }

  /**
   * Parse props from TypeScript type definition
   */
  private parsePropsFromTypeBlock(typeBlock: string): PropDef[] {
    const props: PropDef[] = [];
    const propLines = typeBlock.split(/[,\n]/);

    for (const line of propLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Match: propName?: Type or propName: Type
      const match = trimmed.match(/(\w+)(\?)?:\s*(.+)/);
      if (match) {
        const [, name, optional, type] = match;
        props.push({
          name,
          type: type.trim(),
          required: !optional,
          description: undefined,
        });
      }
    }

    return props;
  }

  /**
   * Parse props from runtime declaration
   */
  private parsePropsFromRuntimeBlock(propsBlock: string): PropDef[] {
    const props: PropDef[] = [];
    
    // Simple regex-based parsing for common patterns
    // In production, would use a proper AST parser
    const propPattern = /(\w+):\s*\{([^}]+)\}/g;
    let match;

    while ((match = propPattern.exec(propsBlock)) !== null) {
      const [, name, definition] = match;
      
      // Extract type
      const typeMatch = definition.match(/type:\s*(\w+)/);
      const type = typeMatch ? typeMatch[1] : "any";

      // Extract required
      const requiredMatch = definition.match(/required:\s*(true|false)/);
      const required = requiredMatch ? requiredMatch[1] === "true" : false;

      props.push({
        name,
        type,
        required,
        description: undefined,
      });
    }

    return props;
  }

  /**
   * Detect if component uses slots
   */
  private detectSlots(descriptor: any): boolean {
    if (!descriptor.template) return false;
    const templateContent = descriptor.template.content;
    return templateContent.includes("<slot");
  }

  /**
   * Check if component has default slot (unnamed slot)
   */
  private hasDefaultSlot(descriptor: any): boolean {
    if (!descriptor.template) return false;
    const templateContent = descriptor.template.content;
    
    // Find all <slot> tags
    const slotMatches = templateContent.match(/<slot(?:\s+[^>]*)?(?:>|\/\s*>)/g);
    if (!slotMatches) return false;

    // Check if any slot is a default slot (no name attribute)
    return slotMatches.some((slot: string) => !slot.includes('name='));
  }

  /**
   * Convert kebab-case or snake_case to PascalCase
   */
  private pascalCase(str: string): string {
    return str
      .replace(/[-_]([a-z])/g, (_, char) => char.toUpperCase())
      .replace(/^[a-z]/, (char) => char.toUpperCase());
  }
}

