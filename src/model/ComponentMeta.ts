import { PropDef } from "./PropDef";

export type ComponentMeta = {
  componentName: string;
  filePath: string;
  directory: string;
  props: PropDef[];
  rawCode: string;
};