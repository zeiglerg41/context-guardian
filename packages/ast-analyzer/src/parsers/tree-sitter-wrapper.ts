import Parser, { Tree, SyntaxNode } from 'tree-sitter';
import JavaScript from 'tree-sitter-javascript';
import TypeScript from 'tree-sitter-typescript';
import Python from 'tree-sitter-python';

/**
 * Wrapper for Tree-sitter parsers with language-specific configurations
 */
export class TreeSitterWrapper {
  private jsParser: Parser;
  private tsParser: Parser;
  private pyParser: Parser;

  constructor() {
    // Initialize JavaScript parser
    this.jsParser = new Parser();
    this.jsParser.setLanguage(JavaScript);

    // Initialize TypeScript parser
    this.tsParser = new Parser();
    this.tsParser.setLanguage(TypeScript.typescript);

    // Initialize Python parser
    this.pyParser = new Parser();
    this.pyParser.setLanguage(Python);
  }

  /**
   * Parse JavaScript source code
   */
  parseJavaScript(sourceCode: string): Tree {
    return this.jsParser.parse(sourceCode);
  }

  /**
   * Parse TypeScript source code
   */
  parseTypeScript(sourceCode: string): Tree {
    return this.tsParser.parse(sourceCode);
  }

  /**
   * Parse Python source code
   */
  parsePython(sourceCode: string): Tree {
    return this.pyParser.parse(sourceCode);
  }

  /**
   * Parse source code based on file extension
   */
  parse(sourceCode: string, extension: string): Tree {
    switch (extension) {
      case '.js':
      case '.jsx':
        return this.parseJavaScript(sourceCode);

      case '.ts':
      case '.tsx':
        return this.parseTypeScript(sourceCode);

      case '.py':
        return this.parsePython(sourceCode);

      default:
        throw new Error(`Unsupported file extension: ${extension}`);
    }
  }
}
