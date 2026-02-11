/**
 * Project-specific patterns detected from AST analysis
 */
export interface ProjectPatterns {
  /** State management library detected (e.g., "redux", "zustand", "mobx", "context") */
  stateManagement?: string;
  
  /** Component style (e.g., "functional", "class", "mixed") */
  componentStyle?: string;
  
  /** Frequently imported internal modules */
  commonImports: string[];
  
  /** Detected frameworks or libraries */
  frameworks: string[];
  
  /** Coding patterns detected */
  patterns: {
    usesHooks: boolean;
    usesAsync: boolean;
    usesTypeScript: boolean;
    usesJSX: boolean;
  };
}

/**
 * Analysis result for a single file
 */
export interface FileAnalysis {
  filePath: string;
  language: 'javascript' | 'typescript' | 'python';
  imports: string[];
  exports: string[];
  functions: FunctionInfo[];
  classes: ClassInfo[];
  hooks?: HookInfo[]; // React-specific
}

/**
 * Function information extracted from AST
 */
export interface FunctionInfo {
  name: string;
  isAsync: boolean;
  isExported: boolean;
  parameters: string[];
}

/**
 * Class information extracted from AST
 */
export interface ClassInfo {
  name: string;
  isExported: boolean;
  methods: string[];
  extendsFrom?: string;
}

/**
 * React hook usage information
 */
export interface HookInfo {
  name: string;
  type: 'useState' | 'useEffect' | 'useContext' | 'useReducer' | 'custom';
}

/**
 * Configuration for AST analysis
 */
export interface AnalysisConfig {
  /** Root directory to analyze */
  rootDir: string;
  
  /** File extensions to include */
  extensions: string[];
  
  /** Directories to exclude */
  excludeDirs: string[];
  
  /** Maximum number of files to analyze */
  maxFiles?: number;
}
