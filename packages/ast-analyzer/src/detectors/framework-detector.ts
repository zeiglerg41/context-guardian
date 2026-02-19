import { FileAnalysis } from '../types';

/**
 * Detects frameworks and libraries used in the project
 */
export class FrameworkDetector {
  private static KNOWN_FRAMEWORKS = [
    'react',
    'vue',
    'angular',
    'svelte',
    'next',
    'nuxt',
    'express',
    'fastify',
    'koa',
    'nest',
    'django',
    'flask',
    'fastapi',
  ];

  /**
   * Detects frameworks from import statements using exact package matching.
   * Matches the base package name, not substrings (e.g. "react-native" won't match "react").
   */
  detect(analyses: FileAnalysis[]): string[] {
    const frameworks = new Set<string>();

    for (const analysis of analyses) {
      for (const imp of analysis.imports) {
        // Extract the base package name (before any / for scoped sub-paths)
        // e.g. "next/router" → "next", "react-dom" → "react-dom", "flask" → "flask"
        const basePkg = imp.startsWith('@')
          ? imp.split('/').slice(0, 2).join('/')  // @scope/pkg
          : imp.split('/')[0];                     // pkg

        for (const framework of FrameworkDetector.KNOWN_FRAMEWORKS) {
          if (basePkg === framework) {
            frameworks.add(framework);
          }
        }

        // Also match Python-style dotted imports: "django.db.models" → "django"
        const dottedBase = imp.split('.')[0];
        for (const framework of FrameworkDetector.KNOWN_FRAMEWORKS) {
          if (dottedBase === framework) {
            frameworks.add(framework);
          }
        }
      }
    }

    return Array.from(frameworks);
  }
}
