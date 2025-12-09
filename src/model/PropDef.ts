export type PropDef = {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: string | number | boolean | null;
};