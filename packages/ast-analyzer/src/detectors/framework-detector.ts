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
   * Detects frameworks from import statements
   */
  detect(analyses: FileAnalysis[]): string[] {
    const frameworks = new Set<string>();

    for (const analysis of analyses) {
      for (const imp of analysis.imports) {
        for (const framework of FrameworkDetector.KNOWN_FRAMEWORKS) {
          if (imp.includes(framework)) {
            frameworks.add(framework);
          }
        }
      }
    }

    return Array.from(frameworks);
  }
}
