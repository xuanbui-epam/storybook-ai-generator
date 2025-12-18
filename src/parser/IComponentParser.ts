import { ComponentMeta } from "../model/ComponentMeta";
import { Framework } from "../model/Framework";

/**
 * Interface for framework-specific component parsers.
 * Each framework (React, Angular, Vue) implements this interface
 * to extract component metadata from source files.
 */
export interface IComponentParser {
  /**
   * The framework this parser handles
   */
  readonly framework: Framework;

  /**
   * Parse a component file and extract metadata
   * @param filePath - Absolute path to the component file
   * @returns ComponentMeta if a valid component is found, null otherwise
   */
  parseComponentFile(filePath: string): Promise<ComponentMeta | null>;

  /**
   * Extract component name from a file without full parsing
   * Used for building the available components list
   * @param filePath - Absolute path to the component file
   * @returns Component name or null if not found
   */
  extractComponentName(filePath: string): Promise<string | null>;

  /**
   * Check if this parser can handle the given file
   * @param filePath - Path to check
   * @returns true if this parser can handle the file
   */
  canParse(filePath: string): boolean;
}

