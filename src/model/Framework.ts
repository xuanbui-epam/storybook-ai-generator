import fs from "fs";
import path from "path";

export type Framework = "react" | "angular" | "vue";

export interface FrameworkConfig {
  framework: Framework;
  fileExtensions: string[];
  componentPatterns: string[];
}

export const FRAMEWORK_CONFIGS: Record<Framework, FrameworkConfig> = {
  react: {
    framework: "react",
    fileExtensions: [".tsx", ".jsx", ".ts", ".js"],
    componentPatterns: ["*.tsx", "*.jsx"],
  },
  angular: {
    framework: "angular",
    fileExtensions: [".ts"],
    componentPatterns: ["*.component.ts"],
  },
  vue: {
    framework: "vue",
    fileExtensions: [".vue", ".ts", ".js"],
    componentPatterns: ["*.vue"],
  },
};

/**
 * Auto-detects the framework used in a project by analyzing package.json
 * and file patterns in the project directory.
 */
export function detectFramework(projectRoot: string): Framework {
  const packageJsonPath = path.join(projectRoot, "package.json");

  // Check package.json for framework dependencies
  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
      const allDeps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
      };

      // Priority order: Angular > Vue > React
      // (Angular is most specific, React is most common so checked last)
      if (allDeps["@angular/core"]) {
        console.log("[Framework Detection] Detected Angular from package.json");
        return "angular";
      }

      if (allDeps["vue"] || allDeps["@vue/runtime-core"]) {
        console.log("[Framework Detection] Detected Vue from package.json");
        return "vue";
      }

      if (allDeps["react"] || allDeps["react-dom"]) {
        console.log("[Framework Detection] Detected React from package.json");
        return "react";
      }
    } catch (error) {
      console.warn(
        "[Framework Detection] Failed to parse package.json:",
        (error as Error).message
      );
    }
  }

  // Fallback: scan for file patterns
  console.log(
    "[Framework Detection] No framework found in package.json, checking file patterns..."
  );
  const hasVueFiles = fs.existsSync(path.join(projectRoot, "src")) &&
    checkForPattern(path.join(projectRoot, "src"), "**/*.vue");
  if (hasVueFiles) {
    console.log("[Framework Detection] Detected Vue from .vue files");
    return "vue";
  }

  const hasAngularFiles = fs.existsSync(path.join(projectRoot, "src")) &&
    checkForPattern(path.join(projectRoot, "src"), "**/*.component.ts");
  if (hasAngularFiles) {
    console.log("[Framework Detection] Detected Angular from .component.ts files");
    return "angular";
  }

  // Default to React as it's most common
  console.log("[Framework Detection] Defaulting to React");
  return "react";
}

/**
 * Helper to check if files matching a pattern exist in a directory
 */
function checkForPattern(dir: string, pattern: string): boolean {
  try {
    const { globSync } = require("glob");
    const files = globSync(pattern, { cwd: dir, absolute: false });
    return files.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Gets the appropriate file extension glob pattern for a framework
 */
export function getFileExtensionGlob(framework: Framework): string {
  const config = FRAMEWORK_CONFIGS[framework];
  const extensions = config.componentPatterns.map((p) =>
    p.replace("*", "")
  ).join(",");
  
  // Return glob pattern like *.{tsx,jsx} or *.vue
  const exts = config.componentPatterns.map(p => p.replace("*.", "")).join(",");
  return exts.includes(",") ? `*.{${exts}}` : `*.${exts}`;
}

/**
 * Checks if a file extension is valid for a given framework
 */
export function isValidFileForFramework(
  filePath: string,
  framework: Framework
): boolean {
  const ext = path.extname(filePath);
  return FRAMEWORK_CONFIGS[framework].fileExtensions.includes(ext);
}

