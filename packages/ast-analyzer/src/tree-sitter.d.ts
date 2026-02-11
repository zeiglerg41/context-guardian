declare module 'tree-sitter-javascript' {
  const language: any;
  export default language;
}

declare module 'tree-sitter-typescript' {
  const typescript: any;
  const tsx: any;
  export { typescript, tsx };
  export default { typescript, tsx };
}

declare module 'tree-sitter-python' {
  const language: any;
  export default language;
}

declare module 'tree-sitter' {
  export interface SyntaxNode {
    type: string;
    text: string;
    startPosition: { row: number; column: number };
    endPosition: { row: number; column: number };
    children: SyntaxNode[];
    namedChildren: SyntaxNode[];
    parent: SyntaxNode | null;
    childForFieldName(fieldName: string): SyntaxNode | null;
    childrenForFieldName(fieldName: string): SyntaxNode[];
    descendantsOfType(type: string | string[]): SyntaxNode[];
    walk(): TreeCursor;
  }

  export interface TreeCursor {
    nodeType: string;
    nodeText: string;
    currentNode: SyntaxNode;
    gotoFirstChild(): boolean;
    gotoNextSibling(): boolean;
    gotoParent(): boolean;
  }

  export interface Tree {
    rootNode: SyntaxNode;
    walk(): TreeCursor;
  }

  export default class Parser {
    setLanguage(language: any): void;
    parse(input: string): Tree;
  }
}
