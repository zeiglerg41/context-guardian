import { Tree, SyntaxNode } from 'tree-sitter';
import { FileAnalysis, FunctionInfo, ClassInfo } from '../types';

/**
 * Helper to find a child node by type
 */
function findChildByType(node: SyntaxNode, type: string): SyntaxNode | undefined {
  return node.namedChildren.find(c => c.type === type);
}

/**
 * Analyzes Python files using Tree-sitter AST
 */
export class PythonAnalyzer {
  /**
   * Analyzes a Python file
   */
  analyze(tree: Tree, filePath: string): FileAnalysis {
    const rootNode = tree.rootNode;

    return {
      filePath,
      language: 'python',
      imports: this.extractImports(rootNode),
      exports: this.extractExports(rootNode),
      functions: this.extractFunctions(rootNode),
      classes: this.extractClasses(rootNode),
    };
  }

  /**
   * Extracts import statements (import x, from x import y)
   */
  private extractImports(node: SyntaxNode): string[] {
    const imports: string[] = [];

    const traverse = (n: SyntaxNode) => {
      if (n.type === 'import_statement') {
        // import foo, import foo.bar
        const nameNode = findChildByType(n, 'dotted_name');
        if (nameNode) {
          imports.push(nameNode.text);
        }
      } else if (n.type === 'import_from_statement') {
        // from foo import bar
        const moduleNode = findChildByType(n, 'dotted_name') ||
                          findChildByType(n, 'relative_import');
        if (moduleNode) {
          imports.push(moduleNode.text);
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
   * Extracts top-level names as "exports" (Python doesn't have explicit exports,
   * but top-level functions/classes are the public API)
   */
  private extractExports(node: SyntaxNode): string[] {
    const exports: string[] = [];

    // Check for __all__ assignment
    for (const child of node.namedChildren) {
      if (child.type === 'expression_statement') {
        const assignment = findChildByType(child, 'assignment');
        if (assignment) {
          const left = assignment.namedChildren[0];
          if (left && left.text === '__all__') {
            const list = findChildByType(assignment, 'list');
            if (list) {
              for (const item of list.namedChildren) {
                if (item.type === 'string') {
                  exports.push(item.text.replace(/['"]/g, ''));
                }
              }
              return exports;
            }
          }
        }
      }
    }

    // Fallback: top-level functions and classes (not prefixed with _)
    for (const child of node.namedChildren) {
      if (child.type === 'function_definition') {
        const nameNode = findChildByType(child, 'identifier');
        if (nameNode && !nameNode.text.startsWith('_')) {
          exports.push(nameNode.text);
        }
      } else if (child.type === 'class_definition') {
        const nameNode = findChildByType(child, 'identifier');
        if (nameNode && !nameNode.text.startsWith('_')) {
          exports.push(nameNode.text);
        }
      }
    }

    return exports;
  }

  /**
   * Extracts function definitions
   */
  private extractFunctions(node: SyntaxNode): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    for (const child of node.namedChildren) {
      if (child.type === 'function_definition') {
        functions.push(this.parseFunctionDef(child, true));
      } else if (child.type === 'decorated_definition') {
        const funcDef = findChildByType(child, 'function_definition');
        if (funcDef) {
          functions.push(this.parseFunctionDef(funcDef, true));
        }
      }
    }

    return functions;
  }

  private parseFunctionDef(node: SyntaxNode, isTopLevel: boolean): FunctionInfo {
    const nameNode = findChildByType(node, 'identifier');
    const name = nameNode?.text || 'anonymous';
    const isAsync = node.type === 'function_definition' &&
      node.children.some(c => c.type === 'async');
    const parameters = this.extractParameters(node);

    return {
      name,
      isAsync,
      isExported: isTopLevel && !name.startsWith('_'),
      parameters,
    };
  }

  /**
   * Extracts function parameters
   */
  private extractParameters(node: SyntaxNode): string[] {
    const params: string[] = [];
    const paramsNode = findChildByType(node, 'parameters');

    if (paramsNode) {
      for (const child of paramsNode.namedChildren) {
        if (child.type === 'identifier') {
          if (child.text !== 'self' && child.text !== 'cls') {
            params.push(child.text);
          }
        } else if (child.type === 'typed_parameter' || child.type === 'default_parameter' || child.type === 'typed_default_parameter') {
          const idNode = findChildByType(child, 'identifier');
          if (idNode && idNode.text !== 'self' && idNode.text !== 'cls') {
            params.push(idNode.text);
          }
        }
      }
    }

    return params;
  }

  /**
   * Extracts class definitions
   */
  private extractClasses(node: SyntaxNode): ClassInfo[] {
    const classes: ClassInfo[] = [];

    for (const child of node.namedChildren) {
      let classDef: SyntaxNode | undefined;
      if (child.type === 'class_definition') {
        classDef = child;
      } else if (child.type === 'decorated_definition') {
        classDef = findChildByType(child, 'class_definition');
      }

      if (classDef) {
        const nameNode = findChildByType(classDef, 'identifier');
        const name = nameNode?.text || 'Anonymous';
        const isExported = !name.startsWith('_');

        // Get base class
        const argList = findChildByType(classDef, 'argument_list');
        let extendsFrom: string | undefined;
        if (argList && argList.namedChildren.length > 0) {
          extendsFrom = argList.namedChildren[0].text;
        }

        // Get methods
        const body = findChildByType(classDef, 'block');
        const methods = this.extractMethods(body);

        classes.push({ name, isExported, methods, extendsFrom });
      }
    }

    return classes;
  }

  /**
   * Extracts method names from a class body
   */
  private extractMethods(body: SyntaxNode | undefined): string[] {
    if (!body) return [];
    const methods: string[] = [];

    for (const child of body.namedChildren) {
      let funcDef: SyntaxNode | undefined;
      if (child.type === 'function_definition') {
        funcDef = child;
      } else if (child.type === 'decorated_definition') {
        funcDef = findChildByType(child, 'function_definition');
      }
      if (funcDef) {
        const nameNode = findChildByType(funcDef, 'identifier');
        if (nameNode) {
          methods.push(nameNode.text);
        }
      }
    }

    return methods;
  }
}
