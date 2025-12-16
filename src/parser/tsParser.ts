import { Project } from "ts-morph";
import path from "path";
import { ComponentMeta } from "../model/ComponentMeta";
import { PropDef } from "../model/PropDef";

export async function parseComponentFile(
  filePath: string
): Promise<ComponentMeta | null> {
  const project = new Project({
    tsConfigFilePath: undefined,
    skipAddingFilesFromTsConfig: true,
  });

  const source = project.addSourceFileAtPath(filePath);
  const text = source.getFullText();
  console.log("[2.0] Parsing AST for file:", filePath);

  // heuristic: find exported function or const arrow component, or default export
  const exports = source.getExportedDeclarations();
  let compName: string | undefined;

  for (const [name, declarations] of exports.entries()) {
    // skip types/interfaces
    const decl = declarations[0];
    if (!decl) continue;
    const kind = decl.getKindName();
    // accept function, arrow function, const, class
    if (
      [
        "FunctionDeclaration",
        "ArrowFunction",
        "ClassDeclaration",
        "VariableDeclaration",
      ].includes(decl.getKindName())
    ) {
      compName = name;
      break;
    }
  }

  // if not found, try default export identifier
  if (!compName) {
    const defaultExport = source.getDefaultExportSymbol();
    if (defaultExport) {
      compName = defaultExport.getName();
    }
  }

  if (!compName) {
    // no obvious component exported
    console.log(
      "[2.1] No React component export detected, skipping file:",
      filePath
    );
    return null;
  }

  // find props: look for Interface with name like <CompName>Props or first param typed
  const interfaces = source.getInterfaces();
  let propsInterfaceName = interfaces
    .find((i) => i.getName().toLowerCase().includes("props"))
    ?.getName();

  // Also check function parameter of component
  const declarations = source
    .getFunctions()
    .filter((f) => f.getName() === compName);
  if (declarations.length === 0) {
    // try variable declaration (const Comp: React.FC<Props> = ...)
    const varDecls = source
      .getVariableDeclarations()
      .filter((v) => v.getName() === compName);
    if (varDecls.length) {
      const v = varDecls[0];
      const typeNode = v.getTypeNode();
      if (typeNode) {
        const typeText = typeNode.getText();
        // match React.FC<SomeProps>
        const m = typeText.match(/<(.+)>/);
        if (m) propsInterfaceName = m[1].trim();
      }
    }
  } else {
    // function param typed
    const fn = declarations[0];
    const params = fn.getParameters();
    if (params.length && params[0].getTypeNode()) {
      const t = params[0].getTypeNode()!.getText();
      // might be { prop1, prop2 }: Props or props: Props
      const match = t.match(/[:<\s]*([A-Za-z0-9_]+)*/);
      if (match && match[1]) propsInterfaceName = match[1];
    }
  }

  let props: PropDef[] = [];

  if (propsInterfaceName) {
    const iface =
      source.getInterface(propsInterfaceName) ||
      source.getInterface(propsInterfaceName.replace(/^{|}$/g, ""));
    if (iface) {
      const propsNodes = iface.getProperties();
      props = propsNodes.map((p) => {
        const name = p.getName();
        const type = p.getType().getText();
        const required = !p.hasQuestionToken();
        const jsDocs = p.getJsDocs();
        const description = jsDocs.length
          ? jsDocs.map((d) => d.getComment()).join("\n")
          : undefined;
        return { name, type, required, description };
      });
      console.log(
        "[2.2] Extracted props interface:",
        propsInterfaceName,
        "props count:",
        props.length
      );
    }
  } else {
    // fallback: look for first parameter destructuring to extract props names, but types may be unknown
    // omitted for brevity; could be implemented later
  }

  // Detect if component uses children prop (even if not explicitly in interface)
  // Check if children is destructured in function params or used in JSX
  const usesChildren = detectChildrenUsage(source, compName, text);
  if (usesChildren) {
    // Check if children already exists in props
    const hasChildrenProp = props.some((p) => p.name === "children");
    if (!hasChildrenProp) {
      props.push({
        name: "children",
        type: "ReactNode",
        required: false,
        description: "The content to display inside the component",
      });
      console.log("[2.3] Detected children usage, added to props");
    }
  }

  return {
    componentName: compName,
    filePath,
    directory: path.dirname(filePath),
    props,
    rawCode: text,
  };
}

/**
 * Detects if a component uses the children prop by checking:
 * 1. If children is destructured in function parameters
 * 2. If children is used in JSX/return statement
 */
function detectChildrenUsage(
  source: any,
  compName: string,
  rawCode: string
): boolean {
  // Check 1: Look for children in function parameter destructuring
  const declarations = source
    .getFunctions()
    .filter((f: any) => f.getName() === compName);
  
  if (declarations.length > 0) {
    const fn = declarations[0];
    const params = fn.getParameters();
    if (params.length > 0) {
      const firstParam = params[0];
      const paramText = firstParam.getText();
      // Check if children is in destructuring: { children, ... } or { children }
      if (paramText.includes("children") && paramText.includes("{")) {
        return true;
      }
    }
  }

  // Check 2: Look for variable declarations (const Comp = ({ children, ... }) => ...)
  const varDecls = source
    .getVariableDeclarations()
    .filter((v: any) => v.getName() === compName);
  
  if (varDecls.length > 0) {
    const varDecl = varDecls[0];
    const initializer = varDecl.getInitializer();
    if (initializer) {
      const initText = initializer.getText();
      // Check if it's an arrow function with children in params
      if (initText.includes("children") && initText.includes("=>")) {
        return true;
      }
    }
  }

  // Check 3: Look for children usage in JSX (simple text search as fallback)
  // Pattern: {children} or { children } or children in JSX context
  const childrenPattern = /\{children\}|\{\s*children\s*\}|children\s*[,\}]/;
  if (childrenPattern.test(rawCode)) {
    return true;
  }

  return false;
}
