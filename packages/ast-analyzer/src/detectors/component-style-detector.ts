import { FileAnalysis } from '../types';

/**
 * Detects React component style (functional vs class-based)
 */
export class ComponentStyleDetector {
  /**
   * Detects the predominant component style.
   * Only counts exported functions in files with hooks as functional components
   * (not every function in the file).
   */
  detect(analyses: FileAnalysis[]): string {
    let functionalCount = 0;
    let classCount = 0;

    for (const analysis of analyses) {
      // Check for class components (extends React.Component)
      for (const cls of analysis.classes) {
        if (cls.extendsFrom?.includes('Component') || cls.extendsFrom?.includes('PureComponent')) {
          classCount++;
        }
      }

      // Check for functional components: exported functions in files that use hooks
      if (analysis.hooks && analysis.hooks.length > 0) {
        const exportedFunctions = analysis.functions.filter(f => f.isExported);
        functionalCount += Math.max(exportedFunctions.length, 1);
      }
    }

    if (functionalCount === 0 && classCount === 0) {
      return 'unknown';
    }

    if (functionalCount > classCount * 2) {
      return 'functional';
    } else if (classCount > functionalCount * 2) {
      return 'class';
    } else {
      return 'mixed';
    }
  }
}
