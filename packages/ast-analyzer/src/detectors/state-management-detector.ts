import { FileAnalysis } from '../types';

/**
 * Detects state management libraries and patterns
 */
export class StateManagementDetector {
  /**
   * Detects which state management library is being used
   */
  detect(analyses: FileAnalysis[]): string | undefined {
    const importCounts = new Map<string, number>();

    // Count imports of known state management libraries
    for (const analysis of analyses) {
      for (const imp of analysis.imports) {
        if (imp.includes('redux')) {
          importCounts.set('redux', (importCounts.get('redux') || 0) + 1);
        } else if (imp.includes('zustand')) {
          importCounts.set('zustand', (importCounts.get('zustand') || 0) + 1);
        } else if (imp.includes('mobx')) {
          importCounts.set('mobx', (importCounts.get('mobx') || 0) + 1);
        } else if (imp.includes('recoil')) {
          importCounts.set('recoil', (importCounts.get('recoil') || 0) + 1);
        } else if (imp.includes('jotai')) {
          importCounts.set('jotai', (importCounts.get('jotai') || 0) + 1);
        }
      }

      // Check for React Context usage
      if (analysis.hooks) {
        const usesContext = analysis.hooks.some(h => h.type === 'useContext');
        if (usesContext) {
          importCounts.set('context', (importCounts.get('context') || 0) + 1);
        }
      }
    }

    // Return the most frequently used library
    if (importCounts.size === 0) {
      return undefined;
    }

    let maxCount = 0;
    let mostUsed: string | undefined;

    for (const [library, count] of importCounts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        mostUsed = library;
      }
    }

    return mostUsed;
  }
}
