import { StateManagementDetector } from '../src/detectors/state-management-detector';
import { ComponentStyleDetector } from '../src/detectors/component-style-detector';
import { FrameworkDetector } from '../src/detectors/framework-detector';
import { FileAnalysis } from '../src/types';

describe('Pattern Detection', () => {
  describe('StateManagementDetector', () => {
    const detector = new StateManagementDetector();

    test('detects Redux usage', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.ts',
          language: 'typescript',
          imports: ['redux', '@reduxjs/toolkit'],
          exports: [],
          functions: [],
          classes: [],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toBe('redux');
    });

    test('detects Zustand usage', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.ts',
          language: 'typescript',
          imports: ['zustand'],
          exports: [],
          functions: [],
          classes: [],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toBe('zustand');
    });

    test('returns undefined when no state management detected', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.ts',
          language: 'typescript',
          imports: ['react'],
          exports: [],
          functions: [],
          classes: [],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toBeUndefined();
    });
  });

  describe('ComponentStyleDetector', () => {
    const detector = new ComponentStyleDetector();

    test('detects functional components', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.tsx',
          language: 'typescript',
          imports: [],
          exports: [],
          functions: [
            { name: 'MyComponent', isAsync: false, isExported: true, parameters: [] },
          ],
          classes: [],
          hooks: [{ name: 'useState', type: 'useState' }],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toBe('functional');
    });

    test('detects class components', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.tsx',
          language: 'typescript',
          imports: [],
          exports: [],
          functions: [],
          classes: [
            {
              name: 'MyComponent',
              isExported: true,
              methods: ['render'],
              extendsFrom: 'React.Component',
            },
          ],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toBe('class');
    });
  });

  describe('FrameworkDetector', () => {
    const detector = new FrameworkDetector();

    test('detects React', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.tsx',
          language: 'typescript',
          imports: ['react', 'react-dom'],
          exports: [],
          functions: [],
          classes: [],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toContain('react');
    });

    test('detects multiple frameworks', () => {
      const analyses: FileAnalysis[] = [
        {
          filePath: 'test.tsx',
          language: 'typescript',
          imports: ['react', 'next/router', 'express'],
          exports: [],
          functions: [],
          classes: [],
        },
      ];

      const result = detector.detect(analyses);
      expect(result).toContain('react');
      expect(result).toContain('next');
      expect(result).toContain('express');
    });
  });
});
