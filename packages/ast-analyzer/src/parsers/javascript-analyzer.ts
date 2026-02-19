import { Tree, SyntaxNode } from 'tree-sitter';
import { FileAnalysis, FunctionInfo, ClassInfo, HookInfo } from '../types';

/**
 * Helper to find a child node by type
 */
function findChildByType(node: SyntaxNode, type: string): SyntaxNode | undefined {
  return node.namedChildren.find(c => c.type === type);
}

/**
 * Analyzes JavaScript/TypeScript files using Tree-sitter AST
 */
export class JavaScriptAnalyzer {
  /**
   * Analyzes a JavaScript/TypeScript file
   */
  analyze(tree: Tree, filePath: string, isTypeScript: boolean): FileAnalysis {
    const rootNode = tree.rootNode;

    return {
      filePath,
      language: isTypeScript ? 'typescript' : 'javascript',
      imports: this.extractImports(rootNode),
      exports: this.extractExports(rootNode),
      functions: this.extractFunctions(rootNode),
      classes: this.extractClasses(rootNode),
      hooks: this.extractHooks(rootNode),
    };
  }

  /**
   * Extracts import statements
   */
  private extractImports(node: SyntaxNode): string[] {
    const imports: string[] = [];

    const traverse = (n: SyntaxNode) => {
      // ESM: import ... from '...'
      if (n.type === 'import_statement') {
        const source = findChildByType(n, 'string');
        if (source) {
          const importPath = source.text.replace(/['"]/g, '');
          imports.push(importPath);
        }
      }

      // CJS: require('...')
      if (n.type === 'call_expression') {
        const callee = n.namedChildren[0];
        if (callee && callee.type === 'identifier' && callee.text === 'require') {
          const args = findChildByType(n, 'arguments');
          if (args && args.namedChildren.length > 0) {
            const firstArg = args.namedChildren[0];
            if (firstArg.type === 'string') {
              const requirePath = firstArg.text.replace(/['"]/g, '');
              imports.push(requirePath);
            }
          }
        }
      }

      for (const child of n.children) {
        traverse(child);
      }
    };

    traverse(node);
    return imports;
  }

  /**
   * Extracts export statements
   */
  private extractExports(node: SyntaxNode): string[] {
    const exports: string[] = [];

    const traverse = (n: SyntaxNode) => {
      if (n.type === 'export_statement') {
        const declaration = findChildByType(n, 'lexical_declaration') ||
                           findChildByType(n, 'function_declaration') ||
                           findChildByType(n, 'class_declaration');
        if (declaration) {
          const identifier = findChildByType(declaration, 'identifier') ||
                            findChildByType(declaration, 'variable_declarator');
          if (identifier) {
            const name = findChildByType(identifier, 'identifier') || identifier;
            exports.push(name.text);
          }
        }
      }

      for (const child of n.children) {
        traverse(child);
      }
    };

    traverse(node);
    return exports;
  }

  /**
   * Extracts function declarations
   */
  private extractFunctions(node: SyntaxNode): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    const traverse = (n: SyntaxNode, isExported: boolean = false) => {
      if (n.type === 'function_declaration' || n.type === 'arrow_function') {
        const nameNode = findChildByType(n, 'identifier');
        const name = nameNode?.text || 'anonymous';
        const parameters = this.extractParameters(n);
        const isAsync = n.text.startsWith('async');

        functions.push({
          name,
          isAsync,
          isExported,
          parameters,
        });
      }

      if (n.type === 'export_statement') {
        for (const child of n.children) {
          traverse(child, true);
        }
      } else {
        for (const child of n.children) {
          traverse(child, isExported);
        }
      }
    };

    traverse(node);
    return functions;
  }

  /**
   * Extracts function parameters
   */
  private extractParameters(node: SyntaxNode): string[] {
    const params: string[] = [];
    const paramsNode = findChildByType(node, 'formal_parameters');

    if (paramsNode) {
      for (const child of paramsNode.namedChildren) {
        if (child.type === 'identifier' || child.type === 'required_parameter') {
          params.push(child.text);
        }
      }
    }

    return params;
  }

  /**
   * Extracts class declarations
   */
  private extractClasses(node: SyntaxNode): ClassInfo[] {
    const classes: ClassInfo[] = [];

    const traverse = (n: SyntaxNode, isExported: boolean = false) => {
      if (n.type === 'class_declaration') {
        const nameNode = findChildByType(n, 'type_identifier') || findChildByType(n, 'identifier');
        const name = nameNode?.text || 'Anonymous';
        const heritage = findChildByType(n, 'class_heritage');
        const extendsFrom = heritage ? findChildByType(heritage, 'identifier')?.text : undefined;
        const methods = this.extractMethods(n);

        classes.push({
          name,
          isExported,
          methods,
          extendsFrom,
        });
      }

      if (n.type === 'export_statement') {
        for (const child of n.children) {
          traverse(child, true);
        }
      } else {
        for (const child of n.children) {
          traverse(child, isExported);
        }
      }
    };

    traverse(node);
    return classes;
  }

  /**
   * Extracts method names from a class
   */
  private extractMethods(node: SyntaxNode): string[] {
    const methods: string[] = [];

    const traverse = (n: SyntaxNode) => {
      if (n.type === 'method_definition') {
        const nameNode = findChildByType(n, 'property_identifier');
        if (nameNode) {
          methods.push(nameNode.text);
        }
      }

      for (const child of n.children) {
        traverse(child);
      }
    };

    traverse(node);
    return methods;
  }

  /**
   * Extracts React hooks usage
   */
  private extractHooks(node: SyntaxNode): HookInfo[] {
    const hooks: HookInfo[] = [];
    const hookPattern = /^use[A-Z]/;

    const traverse = (n: SyntaxNode) => {
      if (n.type === 'call_expression') {
        const functionNode = n.namedChildren[0];
        if (functionNode && hookPattern.test(functionNode.text)) {
          const hookName = functionNode.text;
          hooks.push({
            name: hookName,
            type: this.getHookType(hookName),
          });
        }
      }

      for (const child of n.children) {
        traverse(child);
      }
    };

    traverse(node);
    return hooks;
  }

  /**
   * Determines the type of React hook
   */
  private getHookType(hookName: string): HookInfo['type'] {
    if (hookName === 'useState') return 'useState';
    if (hookName === 'useEffect') return 'useEffect';
    if (hookName === 'useContext') return 'useContext';
    if (hookName === 'useReducer') return 'useReducer';
    return 'custom';
  }
}
