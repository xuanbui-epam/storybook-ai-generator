import { ComponentMeta } from "../parser/tsParser";

export function buildPrompt(meta: ComponentMeta): string {
  const propsJson = JSON.stringify(meta.props, null, 2);
  console.log("[3.0] Building prompt for component:", meta.componentName, "with", meta.props.length, "props");
  return `
You are a Senior Frontend Architect specializing in React and Storybook.
Analyze the following React component metadata and produce a VALID JSON (no markdown, no explanation) matching the schema.

INPUT:
ComponentName: ${meta.componentName}
Props: ${propsJson}

OUTPUT SCHEMA:
{
  "ComponentName": string,
  "Summary": string,
  "PropsDefinition": [
    {
      "name": string,
      "type": string,
      "required": boolean,
      "defaultValue": any | null,
      "description": string,
      "mockValue": any
    }
  ],
  "StoriesScenarios": [
    {
      "name": string,
      "description": string,
      "props": { "<propName>": "<mockValue>" }
    }
  ]
}

RULES:
- Return ONLY JSON following the schema.
- For function props (like onClick), set mockValue to the string: "console.log('clicked')".
- For enum types, list the possible values in type.
- Provide 3 to 4 story scenarios covering typical states.
- Choose reasonable mockValue for each prop.
- Keep JSON parseable.

Begin analysis.
  `;
}