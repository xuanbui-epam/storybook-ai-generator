import { Framework } from "../model/Framework";
import { IComponentParser } from "./IComponentParser";
import { ReactParser } from "./ReactParser";
import { AngularParser } from "./AngularParser";
import { VueParser } from "./VueParser";

/**
 * Factory for creating framework-specific component parsers
 */
export class ParserFactory {
  private static parsers: Map<Framework, IComponentParser> = new Map<Framework, IComponentParser>()
    .set("react", new ReactParser())
    .set("angular", new AngularParser())
    .set("vue", new VueParser());

  /**
   * Get parser for a specific framework
   */
  static getParser(framework: Framework): IComponentParser {
    const parser = this.parsers.get(framework);
    if (!parser) {
      throw new Error(`No parser available for framework: ${framework}`);
    }
    return parser;
  }

  /**
   * Get parser based on file path
   * Auto-detects which parser can handle the file
   */
  static getParserForFile(filePath: string): IComponentParser | null {
    for (const parser of this.parsers.values()) {
      if (parser.canParse(filePath)) {
        return parser;
      }
    }
    return null;
  }

  /**
   * Get all available parsers
   */
  static getAllParsers(): IComponentParser[] {
    return Array.from(this.parsers.values());
  }
}

