# AI Storybook Generator

A fully automated Storybook file generator powered by Node.js, TypeScript, ts-morph, and LLM reasoning.
This tool scans your React component library, extracts TypeScript props via AST parsing, sends structured metadata to an LLM, and produces complete `.stories.tsx` files following Storybook CSF3 format.

**Stories are generated in the same directory as your component files.**

Ideal for Design System teams, component libraries, or any project that needs hundreds of Storybook stories without manual writing.

## Features

### Automatic Component Discovery

Scans your components directory and detects all `.tsx` files (excluding existing Storybook files).

### AI-Generated Stories

Uses an LLM (OpenAI or Gemini) to:
- Interpret component props
- Generate story scenarios
- Suggest mock values
- Produce clean and readable Storybook stories

### AST-Powered Prop Extraction

Using ts-morph, we analyze:
- Props interfaces
- Types (including unions)
- Required / optional props
- Default values
- JSDoc documentation

### CSF3 Storybook Output

Generated files follow the modern CSF3 standard:
```typescript
export const Primary = { args: { ... } };
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

This approach keeps stories co-located with components, following modern best practices.

## Installation (inside this repo for development)

```bash
npm install
```

## Configuration

Create a `.env` file:

```env
LLM_PROVIDER=gemini  # or "openai"
LLM_MODEL=gemini-2.5-pro  # or "gpt-4o"
LLM_API_KEY=your_api_key_here
```

## Usage inside this repo

```bash
# Build the project
npm run build

# Generate stories using the local CLI entry
npm run generate
```

---

## Using as an npm package (recommended)

After you publish this package (or link it locally), you can use the CLI `storybook-ai` in any project.

### 1. Install the package

```bash
# After publishing to npm:
npm install @storybook/storybook-ai-generator

# Or when developing locally:
cd path/to/storybook-ai-generator
npm link

# In your target project:
npm link storybook/ai-generator   # or the name you publish
```

### 2. Initialize configuration

In the root of your target project, run:

```bash
npx storybook-ai init-config
```

This will create a `storybook.config.js` file:

```js
// storybook.config.js
module.exports = {
  inputDirectory: "./src/components",
  outputFormat: "csf3",
  storybookVersion: "7",
  llmModel: "gpt-4.1-mini",
  llmProvider: "openai",
  // outputDir: "./src/stories",
  // useGitDiff: false,
};
```

Adjust the paths and options to match your project.

### 3. Environment variables in your project

Create a `.env` file in the **target project**:

```env
LLM_PROVIDER=gemini  # or "openai"
LLM_MODEL=gemini-2.5-pro  # or "gpt-4o"
LLM_API_KEY=your_api_key_here
```

### 4. Generate stories from your project

From the root of the target project:

```bash
storybook-ai generate
```

The CLI will:
- Read `storybook.config.js` from `process.cwd()`
- Scan the `inputDirectory` for components
- Generate `.stories.tsx` files next to your components (or into `outputDir` if configured)

## Example

**Component:** `examples/components/atoms/Button/Button.tsx`

```tsx
export interface ButtonProps {
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
}

export const Button = ({ label, disabled, variant = 'primary', onClick }: ButtonProps) => {
  return <button disabled={disabled} onClick={onClick}>{label}</button>;
};
```

**Generated Story:** `examples/components/atoms/Button/Button.stories.tsx`

```tsx
import { Button } from "./Button";

export default {
  title: "Atoms/Button",
  component: Button,
};

export const Primary = {
  args: {
    label: "Primary Button",
    variant: "primary",
    disabled: false,
    onClick: "console.log('clicked')"
  },
};

export const Secondary = {
  args: {
    label: "Secondary Button",
    variant: "secondary",
    disabled: false,
    onClick: "console.log('clicked')"
  },
};

export const Disabled = {
  args: {
    label: "Disabled Button",
    variant: "primary",
    disabled: true,
    onClick: "console.log('clicked')"
  },
};
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
├── generator/
│   ├── storyTemplate.ts    # Story file template
│   └── writer.ts           # File writer
└── parser/
    └── tsParser.ts         # AST parsing with ts-morph
```

## Benefits

✅ **Co-located Stories**: Stories live next to components  
✅ **No Manual Work**: Automatically generates stories for all components  
✅ **Type-Safe**: Uses TypeScript AST parsing  
✅ **AI-Powered**: Intelligent scenario generation  
✅ **Modern Format**: CSF3 Storybook format  
✅ **Flexible**: Supports OpenAI and Gemini  

## License

MIT
