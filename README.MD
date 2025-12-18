# AI Storybook Generator

A fully automated Storybook file generator powered by Node.js, TypeScript, AST parsing, and LLM reasoning.
This tool scans your **React**, **Angular**, or **Vue** component library, extracts component metadata via AST parsing, sends structured metadata to an LLM, and produces complete Storybook story files following CSF3 format.

**Stories are generated in the same directory as your component files.**

Ideal for Design System teams, component libraries, or any project that needs hundreds of Storybook stories without manual writing.

## Supported Frameworks

- ⚛️ **React** - `.tsx`, `.jsx` components
- 🅰️ **Angular** - `*.component.ts` with `@Component` decorator (Angular 14+)
- 💚 **Vue** - `.vue` SFC (Single File Components) with Vue 3

## Features

### Automatic Component Discovery & Framework Detection

Automatically detects your framework (React/Angular/Vue) from `package.json` and scans your components directory for the appropriate file types (excluding existing Storybook files).

### AI-Generated Stories

Uses an LLM (OpenAI or Gemini) to:
- Interpret component props
- Generate story scenarios
- Suggest mock values
- Produce clean and readable Storybook stories

### AST-Powered Component Analysis

Framework-specific parsers analyze your components:

**React**: Using ts-morph to extract:
- Props interfaces
- Types (including unions)
- Required / optional props
- Default values
- JSDoc documentation

**Angular**: Parsing `@Component` decorators and `@Input()` properties

**Vue**: Analyzing `.vue` SFC files with `@vue/compiler-sfc` to extract props from `defineProps()` or Options API

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

1. **Framework Detection**: Auto-detects React/Angular/Vue from `package.json`

2. **Component Discovery**: Scans `inputDirectory` for framework-specific files:
   - React: `.tsx`, `.jsx`
   - Angular: `*.component.ts`
   - Vue: `.vue`

3. **AST Parsing**: Uses framework-specific parsers to extract component metadata:
   ```json
   {
     "componentName": "Button",
     "props": [
       { "name": "label", "type": "string", "required": true }
     ]
   }
   ```

4. **Prompt Generation**: Builds framework-specific prompts with component metadata

5. **LLM Processing**: Sends to OpenAI/Gemini for intelligent scenario generation

6. **Story Building**: Uses framework-specific templates to convert LLM response to CSF3 format

7. **File Output**: Writes story files next to your components:
   - React: `.stories.tsx`
   - Angular: `.stories.ts`
   - Vue: `.stories.ts`

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
  // framework: "react", // Optional: "react" | "angular" | "vue" (auto-detected if not set)
  // outputDir: "./src/stories",
  // useGitDiff: false,
};
```

Adjust the paths and options to match your project. The framework will be auto-detected from your `package.json` if not specified.

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
- Auto-detect your framework (React/Angular/Vue) from `package.json`
- Read `storybook.config.js` from `process.cwd()`
- Scan the `inputDirectory` for components
- Generate story files next to your components (or into `outputDir` if configured)

**Override framework detection:**

```bash
npx storybook-ai generate --framework vue
```

Available options: `react`, `angular`, `vue`

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
| `framework` | string | auto-detect | Framework to use: `"react"`, `"angular"`, or `"vue"` |
| `outputFormat` | string | `"csf3"` | Storybook format (csf3) |
| `storybookVersion` | string | `"7"` | Storybook version |
| `llmModel` | string | - | LLM model to use |
| `llmProvider` | string | - | LLM provider (openai/gemini) |
| `outputDir` | string | - | Optional: Output directory for stories |
| `useGitDiff` | boolean | `false` | Only process changed files |

## Benefits

✅ **Multi-Framework**: Supports React, Angular, and Vue  
✅ **Auto-Detection**: Automatically detects your framework  
✅ **Co-located Stories**: Stories live next to components  
✅ **No Manual Work**: Automatically generates stories for all components  
✅ **Type-Safe**: Uses AST parsing for each framework  
✅ **AI-Powered**: Intelligent scenario generation  
✅ **Modern Format**: CSF3 Storybook format  
✅ **Flexible**: Supports OpenAI and Gemini  

## Contributing

See [DEVELOPMENT.md](./DEVELOPMENT.md) for development setup and contribution guidelines.

## License

MIT
