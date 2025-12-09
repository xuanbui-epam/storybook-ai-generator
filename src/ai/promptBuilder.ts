import { ComponentMeta } from "../model/ComponentMeta";

export function buildPrompt(meta: ComponentMeta): string {
  const propsJson = JSON.stringify(meta.props, null, 2);
  console.log(
    "[3.0] Building prompt for component:",
    meta.componentName,
    "with",
    meta.props.length,
    "props"
  );

  return `
You are a Senior Frontend Architect specializing in React and Storybook.

Your task:
Analyze the following React component metadata and produce a VALID JSON object (no markdown, no explanation) matching the schema below.

IMPORTANT OUTPUT RULES:
- You MUST return ONLY a single JSON object.
- The FIRST character of your response MUST be "{".
- The LAST character of your response MUST be "}".
- Do NOT include backticks, code fences, markdown, or natural language.
- The JSON MUST be syntactically valid and parseable by JSON.parse in JavaScript.
- Use only JSON-compatible values: string, number, boolean, null, arrays, or plain objects.
- Never output "undefined", functions, Symbols, or other non-JSON values.

INPUT:
ComponentName: "${meta.componentName}"
Props (array of prop metadata):
${propsJson}

OUTPUT SCHEMA (structure and field names must match exactly):
{
  "ComponentName": string,            // MUST equal the input ComponentName
  "Summary": string,                 // One-sentence description of the component purpose
  "PropsDefinition": [
    {
      "name": string,                // Prop name as in input
      "type": string,                // Human-readable type, for enums list allowed values
      "required": boolean,
      "defaultValue": any | null,    // Use null if unknown
      "description": string,         // Use "" if no information
      "mockValue": any               // JSON-safe mock, see rules below
    }
  ],
  "StoriesScenarios": [
    {
      "name": string,                // Story name (e.g. "Primary", "Disabled")
      "description": string,         // What this scenario demonstrates
      "props": {                     // Props to pass to the component for this scenario
        "<propName>": <mockValue>
      }
    }
  ]
}

ADDITIONAL RULES:
- "ComponentName" in the output MUST exactly match the input ComponentName.
- "PropsDefinition":
  - Include ONLY props that appear in the input Props array.
  - For props with no description or default value, set:
    - "description": ""
    - "defaultValue": null
  - For enum-like types, include all possible literal options in "type", e.g. "primary | secondary | ghost".
- "mockValue":
  - MUST be JSON-safe: string, number, boolean, null, array, or plain object.
  - For function props (like onClick), set:
    - "mockValue": "console.log('clicked')" (string, not a real function).
- "StoriesScenarios":
  - MUST contain between 3 and 4 items (inclusive).
  - Each scenario's "props" object:
    - MUST only use prop names from "PropsDefinition".
    - MUST use realistic combinations of mock values for meaningful scenarios.
  - Cover typical states such as:
    - default/primary usage,
    - disabled/readonly,
    - variant values (size, appearance, tone),
    - and one edge case or less common but useful state if applicable.

Your response must be ONLY the JSON object described above. Do not write any explanatory text.

Begin now.
  `.trim();
}
