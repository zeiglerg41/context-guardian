import { FileAnalysis } from '../types';

/**
 * Detects React component style (functional vs class-based)
 */
export class ComponentStyleDetector {
  /**
   * Detects the predominant component style
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

      // Check for functional components (functions that use hooks or return JSX)
      if (analysis.hooks && analysis.hooks.length > 0) {
        functionalCount += analysis.functions.length;
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
