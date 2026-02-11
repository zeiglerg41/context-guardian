import * as fs from 'fs';
import * as path from 'path';
import { TreeSitterWrapper } from './parsers/tree-sitter-wrapper';
import { JavaScriptAnalyzer } from './parsers/javascript-analyzer';
import { StateManagementDetector } from './detectors/state-management-detector';
import { ComponentStyleDetector } from './detectors/component-style-detector';
import { FrameworkDetector } from './detectors/framework-detector';
import { AnalysisConfig, FileAnalysis, ProjectPatterns } from './types';

/**
 * Main AST analyzer that orchestrates pattern detection
 */
export class ASTAnalyzer {
  private treeParser: TreeSitterWrapper;
  private jsAnalyzer: JavaScriptAnalyzer;
  private stateDetector: StateManagementDetector;
  private styleDetector: ComponentStyleDetector;
  private frameworkDetector: FrameworkDetector;

  constructor() {
    this.treeParser = new TreeSitterWrapper();
    this.jsAnalyzer = new JavaScriptAnalyzer();
    this.stateDetector = new StateManagementDetector();
    this.styleDetector = new ComponentStyleDetector();
    this.frameworkDetector = new FrameworkDetector();
  }

  /**
   * Analyzes a project and returns detected patterns
   */
  async analyzeProject(config: AnalysisConfig): Promise<ProjectPatterns> {
    const files = this.collectFiles(config);
    const analyses: FileAnalysis[] = [];

    // Analyze each file
    for (const filePath of files) {
      try {
        const analysis = this.analyzeFile(filePath);
        if (analysis) {
          analyses.push(analysis);
        }
      } catch (error) {
        // Skip files that fail to parse
        console.warn(`Failed to analyze ${filePath}:`, error);
      }
    }

    // Detect patterns from analyses
    return this.detectPatterns(analyses);
  }

  /**
   * Analyzes a single file
   */
  private analyzeFile(filePath: string): FileAnalysis | null {
    const ext = path.extname(filePath);
    const sourceCode = fs.readFileSync(filePath, 'utf-8');

    try {
      const tree = this.treeParser.parse(sourceCode, ext);
      const isTypeScript = ext === '.ts' || ext === '.tsx';
      
      return this.jsAnalyzer.analyze(tree, filePath, isTypeScript);
    } catch (error) {
      return null;
    }
  }

  /**
   * Collects files to analyze based on configuration
   */
  private collectFiles(config: AnalysisConfig): string[] {
    const files: string[] = [];
    const { rootDir, extensions, excludeDirs, maxFiles } = config;

    const traverse = (dir: string) => {
      if (maxFiles && files.length >= maxFiles) {
        return;
      }

      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
          // Skip excluded directories
          if (excludeDirs.includes(entry.name)) {
            continue;
          }
          traverse(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };

    traverse(rootDir);
    return files;
  }

  /**
   * Detects project patterns from file analyses
   */
  private detectPatterns(analyses: FileAnalysis[]): ProjectPatterns {
    // Detect state management
    const stateManagement = this.stateDetector.detect(analyses);

    // Detect component style
    const componentStyle = this.styleDetector.detect(analyses);

    // Detect frameworks
    const frameworks = this.frameworkDetector.detect(analyses);

    // Extract common imports
    const importCounts = new Map<string, number>();
    for (const analysis of analyses) {
      for (const imp of analysis.imports) {
        // Only count relative imports (internal modules)
        if (imp.startsWith('.') || imp.startsWith('/')) {
          importCounts.set(imp, (importCounts.get(imp) || 0) + 1);
        }
      }
    }

    const commonImports = Array.from(importCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([imp]) => imp);

    // Detect coding patterns
    const usesHooks = analyses.some(a => a.hooks && a.hooks.length > 0);
    const usesAsync = analyses.some(a => a.functions.some(f => f.isAsync));
    const usesTypeScript = analyses.some(a => a.language === 'typescript');
    const usesJSX = analyses.some(a => a.filePath.endsWith('.jsx') || a.filePath.endsWith('.tsx'));

    return {
      stateManagement,
      componentStyle,
      commonImports,
      frameworks,
      patterns: {
        usesHooks,
        usesAsync,
        usesTypeScript,
        usesJSX,
      },
    };
  }
}

// Re-export types and utilities
export * from './types';
export { TreeSitterWrapper } from './parsers/tree-sitter-wrapper';
export { JavaScriptAnalyzer } from './parsers/javascript-analyzer';
