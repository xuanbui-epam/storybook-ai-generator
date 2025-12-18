import { Framework } from "../model/Framework";
import { IStoryTemplate } from "./IStoryTemplate";
import { ReactStoryTemplate } from "./ReactStoryTemplate";
import { AngularStoryTemplate } from "./AngularStoryTemplate";
import { VueStoryTemplate } from "./VueStoryTemplate";

/**
 * Factory for creating framework-specific story templates
 */
export class TemplateFactory {
  private static templates: Map<Framework, IStoryTemplate> = new Map<Framework, IStoryTemplate>()
    .set("react", new ReactStoryTemplate())
    .set("angular", new AngularStoryTemplate())
    .set("vue", new VueStoryTemplate());

  /**
   * Get template for a specific framework
   */
  static getTemplate(framework: Framework): IStoryTemplate {
    const template = this.templates.get(framework);
    if (!template) {
      throw new Error(`No template available for framework: ${framework}`);
    }
    return template;
  }
}

