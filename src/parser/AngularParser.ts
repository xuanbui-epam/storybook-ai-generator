import { Project, SyntaxKind } from "ts-morph";
import path from "path";
import { ComponentMeta } from "../model/ComponentMeta";
import { PropDef } from "../model/PropDef";
import { IComponentParser } from "./IComponentParser";
import { Framework } from "../model/Framework";

export class AngularParser implements IComponentParser {
  readonly framework: Framework = "angular";

  canParse(filePath: string): boolean {
    return filePath.endsWith(".component.ts");
  }

  async parseComponentFile(filePath: string): Promise<ComponentMeta | null> {
    const project = new Project({
      tsConfigFilePath: undefined,
      skipAddingFilesFromTsConfig: true,
    });

    const source = project.addSourceFileAtPath(filePath);
    const text = source.getFullText();
    console.log("[2.0] Parsing AST for Angular file:", filePath);

    // Find class with @Component decorator
    const classes = source.getClasses();
    let componentClass = null;
    let componentDecorator = null;

    for (const cls of classes) {
      const decorator = cls.getDecorator("Component");
      if (decorator) {
        componentClass = cls;
        componentDecorator = decorator;
        break;
      }
    }

    if (!componentClass || !componentDecorator) {
      console.log(
        "[2.1] No @Component decorator found, skipping file:",
        filePath
      );
      return null;
    }

    const compName = componentClass.getName();
    if (!compName) {
      console.log("[2.1] Component class has no name, skipping file:", filePath);
      return null;
    }

    console.log("[2.2] Found Angular component:", compName);

    // Extract @Input() properties
    const props: PropDef[] = [];
    const properties = componentClass.getProperties();

    // Build a map of type aliases in the file for resolution
    const typeAliases = this.extractTypeAliases(source);

    for (const prop of properties) {
      const inputDecorator = prop.getDecorator("Input");
      if (inputDecorator) {
        const name = prop.getName();
        let type = prop.getType().getText();
        const required = !prop.hasQuestionToken() && !prop.hasInitializer();

        // Try to resolve type alias to its literal values
        const resolvedType = this.resolveTypeAlias(type, typeAliases);
        if (resolvedType !== type) {
          console.log(`[2.3.1] Resolved type alias ${type} -> ${resolvedType}`);
          type = resolvedType;
        }

        // Extract JSDoc description
        const jsDocs = prop.getJsDocs();
        const description = jsDocs.length
          ? jsDocs.map((d) => d.getComment()).join("\n")
          : undefined;

        // Extract default value from initializer
        let defaultValue: string | number | boolean | null | undefined;
        if (prop.hasInitializer()) {
          const initializer = prop.getInitializer();
          if (initializer) {
            const initText = initializer.getText();
            // Parse simple literal values
            if (initText === "true") defaultValue = true;
            else if (initText === "false") defaultValue = false;
            else if (/^['"].*['"]$/.test(initText)) defaultValue = initText.slice(1, -1);
            else if (/^\d+$/.test(initText)) defaultValue = parseInt(initText, 10);
          }
        }

        props.push({
          name,
          type,
          required,
          description,
          defaultValue,
        });

        console.log(`[2.3] Found @Input() ${name}: ${type}${defaultValue !== undefined ? ` = ${defaultValue}` : ''}`);
      }
    }

    // Check for ng-content (Angular's equivalent of children)
    const hasNgContent = this.detectNgContent(componentDecorator, text);
    if (hasNgContent) {
      console.log("[2.4] Detected ng-content usage");
      // Add a pseudo-prop for content projection so story generator can include it
      props.push({
        name: "ngContent",
        type: "content-projection",
        required: false,
        description: "Content projection (ng-content)",
      });
    }

    return {
      componentName: compName,
      filePath,
      directory: path.dirname(filePath),
      props,
      rawCode: text,
    };
  }

  async extractComponentName(filePath: string): Promise<string | null> {
    const project = new Project({
      tsConfigFilePath: undefined,
      skipAddingFilesFromTsConfig: true,
    });

    const source = project.addSourceFileAtPath(filePath);

    // Find class with @Component decorator
    const classes = source.getClasses();
    for (const cls of classes) {
      const decorator = cls.getDecorator("Component");
      if (decorator) {
        return cls.getName() || null;
      }
    }

    return null;
  }

  /**
   * Detects if component uses ng-content for content projection
   */
  private detectNgContent(decorator: any, rawCode: string): boolean {
    // Check template or templateUrl in decorator
    const decoratorText = decorator.getText();

    // Check inline template
    if (decoratorText.includes("template:")) {
      const templateMatch = decoratorText.match(/template:\s*`([^`]*)`/s);
      if (templateMatch && templateMatch[1].includes("<ng-content")) {
        return true;
      }
    }

    // Check external template file (would need to read the file)
    // For now, just check if ng-content appears in the component file
    if (rawCode.includes("<ng-content")) {
      return true;
    }

    return false;
  }

  /**
   * Extract type aliases from the source file
   * Returns a map of alias name -> literal type string
   */
  private extractTypeAliases(source: any): Map<string, string> {
    const aliases = new Map<string, string>();
    
    const typeAliases = source.getTypeAliases();
    for (const alias of typeAliases) {
      const name = alias.getName();
      const typeNode = alias.getTypeNode();
      if (typeNode) {
        const typeText = typeNode.getText();
        // Only store if it's a union of literals (e.g., 'primary' | 'secondary' | 'outline')
        if (typeText.includes("'") || typeText.includes('"')) {
          aliases.set(name, typeText);
        }
      }
    }
    
    return aliases;
  }

  /**
   * Resolve a type alias to its literal values if possible
   */
  private resolveTypeAlias(type: string, aliases: Map<string, string>): string {
    // Check if the type is a known alias
    if (aliases.has(type)) {
      return aliases.get(type)!;
    }
    
    // Handle union types that might include aliases (e.g., ButtonVariant | undefined)
    if (type.includes(" | ")) {
      const parts = type.split(" | ").map(p => p.trim());
      const resolved = parts.map(p => {
        if (aliases.has(p)) {
          return aliases.get(p)!;
        }
        return p;
      });
      return resolved.join(" | ");
    }
    
    return type;
  }
}

