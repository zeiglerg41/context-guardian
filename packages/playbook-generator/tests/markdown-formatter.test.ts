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

  test('generates base playbook', () => {
    const output = formatter.generate(sampleInput);

    expect(output.markdown).toContain('Context Guardian Playbook');
    expect(output.markdown).toContain('Test Critical Rule');
    expect(output.metadata.ruleCount).toBe(3);
    expect(output.metadata.criticalCount).toBe(1);
  });

  test('generates cursor-compatible playbook', () => {
    const output = formatter.generate(sampleInput, {
      cursorCompatible: true,
    });

    expect(output.markdown).toContain('Context Guardian Rules');
    expect(output.markdown).toContain('🚨 CRITICAL');
  });

  test('includes offline warning when offline mode', () => {
    const offlineInput = { ...sampleInput, offline: true };
    const output = formatter.generate(offlineInput);

    expect(output.markdown).toContain('Offline Mode');
    expect(output.markdown).toContain('⚠️');
  });

  test('groups rules by severity correctly', () => {
    const output = formatter.generate(sampleInput);

    expect(output.metadata.criticalCount).toBe(1);
    expect(output.markdown).toContain('## Critical Rules');
    expect(output.markdown).toContain('## High Priority Rules');
    expect(output.markdown).toContain('## Medium Priority Rules');
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

  test('counts unique libraries correctly', () => {
    const output = formatter.generate(sampleInput);

    expect(output.metadata.libraryCount).toBe(2);
  });

  test('counts security rules correctly', () => {
    const output = formatter.generate(sampleInput);

    expect(output.metadata.securityCount).toBe(1);
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
