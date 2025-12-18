# Development Guide

This guide is for developers who want to contribute to or modify the AI Storybook Generator.

## Prerequisites

- Node.js >= 18
- npm or yarn
- TypeScript knowledge
- Understanding of AST parsing (ts-morph)

## Getting Started

### 1. Clone the repository

```bash
git clone <repository-url>
cd storybook-ai-generator
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment

Create a `.env` file:

```env
LLM_PROVIDER=gemini  # or "openai"
LLM_MODEL=gemini-2.5-pro  # or "gpt-4o"
LLM_API_KEY=your_api_key_here
```

### 4. Build the project

```bash
npm run build
```

### 5. Run locally

```bash
npm run generate
```

## Project Structure

```
src/
├── ai/
│   ├── llm.ts              # LLM integration (OpenAI/Gemini)
│   └── promptBuilder.ts    # Prompt construction
├── cli/
│   └── index.ts            # CLI entry point
├── core/
│   ├── config.ts           # Configuration loader
│   └── orchestrator.ts     # Main workflow
│   └── orchestrate/
│       ├── index.ts
│       ├── pipeline.ts
│       └── steps/          # Pipeline steps
├── generator/
│   ├── storyTemplate.ts    # Story file template
│   └── writer.ts           # File writer
├── model/
│   ├── ComponentMeta.ts    # Component metadata model
│   ├── PipelineContext.ts  # Pipeline context model
│   └── PropDef.ts          # Props definition model
└── parser/
    └── tsParser.ts         # AST parsing with ts-morph
```

## How It Works (Detailed Workflow)

### 1. Component Discovery

- Uses glob to scan all `.tsx` files in `inputDirectory`
- Ignores `.stories.tsx` to avoid regeneration loops

### 2. AST Parsing via ts-morph

For each component file:
- Extract component name
- Identify props interface
- Extract type details
- Read JSDoc
- Infer defaults

Example output:
```json
{
  "componentName": "Button",
  "props": [
    { "name": "label", "type": "string", "required": true }
  ]
}
```

### 3. Prompt Generation

We build a structured prompt instructing the LLM to:
- Summarize component
- Suggest 3–4 scenarios
- Generate mock values
- Return strict JSON

### 4. LLM Processing

The LLM returns:
```json
{
  "ComponentName": "Button",
  "StoriesScenarios": [...],
  "PropsDefinition": [...]
}
```

### 5. Story File Generation

We use CSF3 templates such as:
```typescript
export const Primary = {
  args: {
    label: "Click me"
  }
};
```

### 6. File Output

Stories are saved **in the same directory** as the component:

**Input:**
```
examples/components/atoms/Button/Button.tsx
```

**Output:**
```
examples/components/atoms/Button/Button.stories.tsx
```

## Local Development with npm link

To test the CLI locally in another project:

```bash
# In storybook-ai-generator directory
npm link

# In your target project
npm link storybook-ai-generator
```

Now you can use `storybook-ai` commands in the target project.

## Testing with Examples

The `examples/` directory contains sample components for testing:

```bash
# Generate stories for example components
npm run generate
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run generate` | Run the generator CLI |
| `npm run dev` | Watch mode for development |

## Adding a New Pipeline Step

1. Create a new file in `src/core/orchestrate/steps/`
2. Export a step function that takes `PipelineContext`
3. Register the step in `src/core/orchestrate/pipeline.ts`

Example:
```typescript
// src/core/orchestrate/steps/my-step.ts
import { PipelineContext } from '../../../model/PipelineContext';

export async function myStep(context: PipelineContext): Promise<void> {
  // Your logic here
}
```

## Modifying LLM Prompts

Edit `src/ai/promptBuilder.ts` to customize prompts sent to the LLM.

## Adding New LLM Providers

1. Add provider logic in `src/ai/llm.ts`
2. Update the provider switch case
3. Add environment variable support in `src/core/config.ts`

## Code Style

- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Add JSDoc comments for public APIs

## Troubleshooting

### Build errors
```bash
rm -rf dist/
npm run build
```

### LLM API errors
- Verify your API key in `.env`
- Check API rate limits
- Ensure correct model name

### Parsing errors
- Check if component exports are correct
- Verify props interface is exported
- Check TypeScript syntax in target files

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and build
5. Submit a pull request

## License

MIT

