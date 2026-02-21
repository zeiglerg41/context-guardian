import { MarkdownFormatter, PlaybookInput } from '../src';

describe('MarkdownFormatter', () => {
  let formatter: MarkdownFormatter;
  let sampleInput: PlaybookInput;

  beforeEach(() => {
    formatter = new MarkdownFormatter();

    sampleInput = {
      dependencies: [
        { name: 'react', version: '18.2.0' },
        { name: 'express', version: '4.18.0' },
      ],
      patterns: {
        frameworks: ['React'],
        stateManagement: ['Redux'],
        componentStyle: 'functional',
      },
      rules: [
        {
          id: '1',
          library_id: 'lib-1',
          type: 'security',
          title: 'Test Critical Rule',
          description: 'This is a critical security issue',
          category: 'security',
          severity: 'critical',
          library_name: 'react',
        },
        {
          id: '2',
          library_id: 'lib-1',
          type: 'best_practice',
          title: 'Test High Rule',
          description: 'This is a high priority rule',
          category: 'performance',
          severity: 'high',
          library_name: 'react',
        },
        {
          id: '3',
          library_id: 'lib-2',
          type: 'best_practice',
          title: 'Test Medium Rule',
          description: 'This is a medium priority rule',
          category: 'best-practice',
          severity: 'medium',
          library_name: 'express',
        },
      ],
      generatedAt: '2024-01-01T00:00:00Z',
      offline: false,
    };
  });

  test('generates base playbook with directive framing', () => {
    const output = formatter.generate(sampleInput);

    expect(output.markdown).toContain('Project Rules');
    expect(output.markdown).toContain('Follow them when writing, reviewing, or refactoring code');
    expect(output.markdown).toContain('Test Critical Rule');
    expect(output.metadata.ruleCount).toBe(3);
    expect(output.metadata.criticalCount).toBe(1);
  });

  test('generates cursor-compatible playbook', () => {
    const output = formatter.generate(sampleInput, {
      cursorCompatible: true,
    });

    expect(output.markdown).toContain('Project Rules');
    expect(output.markdown).toContain('CRITICAL');
  });

  test('does not include offline warning in output', () => {
    const offlineInput = { ...sampleInput, offline: true };
    const output = formatter.generate(offlineInput);

    // Offline mode should not add noise for the AI
    expect(output.markdown).not.toContain('Offline Mode Active');
  });

  test('groups rules by severity correctly', () => {
    const output = formatter.generate(sampleInput);

    expect(output.metadata.criticalCount).toBe(1);
    expect(output.markdown).toContain('CRITICAL: Test Critical Rule');
    expect(output.markdown).toContain('Test High Rule');
    expect(output.markdown).toContain('Test Medium Rule');
  });

  test('includes project patterns', () => {
    const output = formatter.generate(sampleInput, {
      projectName: 'Test Project',
    });

    expect(output.markdown).toContain('Test Project');
    expect(output.markdown).toContain('React');
    expect(output.markdown).toContain('Redux');
    expect(output.markdown).toContain('functional');
  });

  test('hides unknown component style', () => {
    const unknownStyleInput = {
      ...sampleInput,
      patterns: { ...sampleInput.patterns, componentStyle: 'unknown' as any },
    };
    const output = formatter.generate(unknownStyleInput);

    expect(output.markdown).not.toContain('unknown');
  });

  test('counts unique libraries correctly', () => {
    const output = formatter.generate(sampleInput);

    expect(output.metadata.libraryCount).toBe(2);
  });

  test('counts security rules correctly', () => {
    const output = formatter.generate(sampleInput);

    expect(output.metadata.securityCount).toBe(1);
  });

  test('does not HTML-escape special characters', () => {
    const inputWithSpecialChars = {
      ...sampleInput,
      rules: [
        {
          id: '1',
          library_id: 'lib-1',
          type: 'best_practice' as const,
          title: 'Use version >= 18.0',
          description: "Don't use class components",
          category: 'best-practice',
          severity: 'high' as const,
          library_name: 'react',
          version_range: '>=18.0.0',
        },
      ],
    };
    const output = formatter.generate(inputWithSpecialChars);

    expect(output.markdown).toContain('>=18.0.0');
    expect(output.markdown).not.toContain('&gt;');
    expect(output.markdown).not.toContain('&#x3D;');
    expect(output.markdown).toContain("Don't");
    expect(output.markdown).not.toContain('&#x27;');
  });

  test('base template output matches snapshot', () => {
    const output = formatter.generate(sampleInput, {
      projectName: 'Snapshot Test Project',
      projectType: 'web',
    });

    expect(output.markdown).toMatchSnapshot();
  });

  test('cursor template output matches snapshot', () => {
    const output = formatter.generate(sampleInput, {
      projectName: 'Snapshot Test Project',
      cursorCompatible: true,
    });

    expect(output.markdown).toMatchSnapshot();
  });

  test('offline mode output matches snapshot', () => {
    const offlineInput = { ...sampleInput, offline: true };
    const output = formatter.generate(offlineInput, {
      projectName: 'Offline Project',
    });

    expect(output.markdown).toMatchSnapshot();
  });
});
