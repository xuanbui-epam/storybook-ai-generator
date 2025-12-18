import { ComponentMeta } from "../model/ComponentMeta";
import { Framework } from "../model/Framework";

export function buildPrompt(
  meta: ComponentMeta,
  framework: Framework,
  availableComponents?: string[]
): string {
  const propsJson = JSON.stringify(meta.props, null, 2);
  console.log(
    "[3.0] Building prompt for",
    framework,
    "component:",
    meta.componentName,
    "with",
    meta.props.length,
    "props"
  );

  // Framework-specific configurations
  const frameworkConfig = getFrameworkConfig(framework);

  // Build available components section for prompt
  let availableComponentsSection = "";
  if (availableComponents && availableComponents.length > 0) {
    const componentsList = availableComponents
      .filter((name) => name !== meta.componentName) // Exclude current component
      .join(", ");
    if (componentsList) {
      availableComponentsSection = `
AVAILABLE COMPONENTS IN SYSTEM:
The following components are available in this codebase and can be used in stories:
${componentsList}

IMPORTANT: When you need to use a component in props (e.g., for ${frameworkConfig.childrenPropExample}):
- You MUST ONLY use components from the list above.
- NEVER create or reference components that are NOT in the list (e.g., do NOT use "Icon", "Icons", or any component not listed above).
- If no suitable component exists in the list, use simple string values (like emoji "🔍", "✓", "→") or null instead.
- For ${frameworkConfig.childrenPropType} props, prefer using null or simple string/emoji unless a suitable component from the list exists.

`;
    }
  }

  return `
You are a Senior Frontend Architect specializing in ${frameworkConfig.displayName} and Storybook.

Your task:
Analyze the following ${frameworkConfig.displayName} component metadata and produce a VALID JSON object (no markdown, no explanation) matching the schema below.
${availableComponentsSection}
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
    - If "children" prop exists, ALWAYS include it in stories with appropriate text content (e.g., "Click me", "Submit", "Cancel" for buttons, or descriptive text for other components).
    - Do NOT set children to null unless it's an edge case scenario demonstrating empty state.
  - Cover typical states such as:
    - default/primary usage,
    - disabled/readonly,
    - variant values (size, appearance, tone),
    - and one edge case or less common but useful state if applicable.

Your response must be ONLY the JSON object described above. Do not write any explanatory text.

Begin now.
  `.trim();
}

interface FrameworkPromptConfig {
  displayName: string;
  childrenPropExample: string;
  childrenPropType: string;
}

function getFrameworkConfig(framework: Framework): FrameworkPromptConfig {
  switch (framework) {
    case "react":
      return {
        displayName: "React",
        childrenPropExample: "ReactNode props like leftIcon, rightIcon, icon, etc.",
        childrenPropType: "ReactNode",
      };
    case "angular":
      return {
        displayName: "Angular",
        childrenPropExample: "template reference props or content projection",
        childrenPropType: "TemplateRef",
      };
    case "vue":
      return {
        displayName: "Vue 3",
        childrenPropExample: "slot props or component props",
        childrenPropType: "Component/slot",
      };
    default:
      return {
        displayName: framework,
        childrenPropExample: "component props",
        childrenPropType: "Component",
      };
  }
}
