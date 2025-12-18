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

## How It Works

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   1. Discover   │ ──▶ │   2. Parse      │ ──▶ │   3. Generate   │
│   Components    │     │   Props (AST)   │     │   Prompt        │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   6. Write      │ ◀── │   5. Build      │ ◀── │   4. Call       │
│   Story File    │     │   Story Code    │     │   LLM           │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

1. **Component Discovery**: Scans `inputDirectory` for `.tsx` files (ignores existing `.stories.tsx`)

2. **AST Parsing**: Uses ts-morph to extract component metadata:
   ```json
   {
     "componentName": "Button",
     "props": [
       { "name": "label", "type": "string", "required": true }
     ]
   }
   ```

3. **Prompt Generation**: Builds structured prompts with component metadata

4. **LLM Processing**: Sends to OpenAI/Gemini for intelligent scenario generation

5. **Story Building**: Converts LLM response to CSF3 format

6. **File Output**: Writes `.stories.tsx` next to your component

## Installation

```bash
npm install @storybook/storybook-ai-generator
```

## Quick Start

### 1. Initialize configuration

In the root of your project, run:

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

### 2. Set up environment variables

Create a `.env` file in your project root:

```env
LLM_PROVIDER=gemini  # or "openai"
LLM_MODEL=gemini-2.5-pro  # or "gpt-4o"
LLM_API_KEY=your_api_key_here
```

### 3. Generate stories

```bash
npx storybook-ai generate
```

The CLI will:
- Read `storybook.config.js` from `process.cwd()`
- Scan the `inputDirectory` for components
- Generate `.stories.tsx` files next to your components (or into `outputDir` if configured)

## Example

**Component:** `src/components/Button/Button.tsx`

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

**Generated Story:** `src/components/Button/Button.stories.tsx`

```tsx
import { Button } from "./Button";

export default {
  title: "Components/Button",
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

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `inputDirectory` | string | `"./src/components"` | Directory to scan for components |
| `outputFormat` | string | `"csf3"` | Storybook format (csf3) |
| `storybookVersion` | string | `"7"` | Storybook version |
| `llmModel` | string | - | LLM model to use |
| `llmProvider` | string | - | LLM provider (openai/gemini) |
| `outputDir` | string | - | Optional: Output directory for stories |
| `useGitDiff` | boolean | `false` | Only process changed files |

## Benefits

✅ **Co-located Stories**: Stories live next to components  
✅ **No Manual Work**: Automatically generates stories for all components  
✅ **Type-Safe**: Uses TypeScript AST parsing  
✅ **AI-Powered**: Intelligent scenario generation  
✅ **Modern Format**: CSF3 Storybook format  
✅ **Flexible**: Supports OpenAI and Gemini  

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup and contribution guidelines.

## License

MIT
