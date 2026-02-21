import { SQLFormatter } from '../src/formatters/sql-formatter';
import { CrawlResult, BestPracticeRule, AntiPatternRule, SecurityAdvisoryRule } from '../src/types';

describe('SQLFormatter', () => {
  let formatter: SQLFormatter;

  beforeEach(() => {
    formatter = new SQLFormatter();
  });

  function makeCrawlResult(overrides?: Partial<CrawlResult>): CrawlResult {
    return {
      library: 'react',
      ecosystem: 'npm',
      rules: [],
      crawledAt: '2026-02-21T00:00:00.000Z',
      sourceUrls: ['https://react.dev/reference/react/hooks'],
      ...overrides,
    };
  }

  test('formats header with library name and timestamp', () => {
    const result = makeCrawlResult();
    const sql = formatter.format(result);

    expect(sql).toContain('-- Library: react');
    expect(sql).toContain('-- Crawled at: 2026-02-21T00:00:00.000Z');
    expect(sql).toContain('-- Total rules: 0');
  });

  test('formats library INSERT with ON CONFLICT', () => {
    const result = makeCrawlResult();
    const sql = formatter.format(result);

    expect(sql).toContain("INSERT INTO libraries");
    expect(sql).toContain("'react'");
    expect(sql).toContain("'npm'");
    expect(sql).toContain("ON CONFLICT (name) DO UPDATE");
  });

  test('formats best practice INSERT into correct table', () => {
    const result = makeCrawlResult({
      rules: [{
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'Use hooks at top level',
          description: 'Always call hooks at the top level.',
          category: 'best-practice',
          severity: 'high',
          version_range: '>=16.8.0',
          code_example: 'const [state] = useState(0);',
          source_url: 'https://react.dev/reference/react/hooks',
        },
      }],
    });
    const sql = formatter.format(result);

    expect(sql).toContain('INSERT INTO best_practices');
    expect(sql).toContain("'Use hooks at top level'");
    expect(sql).toContain("'high'");
    expect(sql).toContain("'>=16.8.0'");
    expect(sql).toContain("'const [state] = useState(0);'");
    expect(sql).toContain('-- Best practices (1)');
  });

  test('formats anti-pattern INSERT into correct table', () => {
    const result = makeCrawlResult({
      rules: [{
        type: 'anti_pattern',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          pattern_name: 'Unnecessary useEffect',
          description: 'Using useEffect for derived state.',
          why_bad: 'Causes extra re-renders.',
          better_approach: 'Calculate during render.',
          severity: 'medium',
          version_range: '>=16.8.0',
          code_example_bad: 'useEffect(() => { setX(y); }, [y]);',
          code_example_good: 'const x = y;',
          source_url: 'https://react.dev/learn',
        },
      }],
    });
    const sql = formatter.format(result);

    expect(sql).toContain('INSERT INTO anti_patterns');
    expect(sql).toContain("'Unnecessary useEffect'");
    expect(sql).toContain("'Causes extra re-renders.'");
    expect(sql).toContain("'Calculate during render.'");
    expect(sql).toContain('-- Anti-patterns (1)');
  });

  test('formats security advisory INSERT into correct table', () => {
    const result = makeCrawlResult({
      rules: [{
        type: 'security',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          cve_id: 'CVE-2018-6341',
          title: 'XSS in SSR',
          description: 'Server-side rendering XSS vulnerability.',
          severity: 'critical',
          affected_versions: '<16.4.2',
          fixed_in_version: '16.4.2',
          source_url: 'https://nvd.nist.gov/vuln/detail/CVE-2018-6341',
          published_at: '2018-08-12',
        },
      }],
    });
    const sql = formatter.format(result);

    expect(sql).toContain('INSERT INTO security_advisories');
    expect(sql).toContain("'CVE-2018-6341'");
    expect(sql).toContain("'<16.4.2'");
    expect(sql).toContain("'16.4.2'");
    expect(sql).toContain('-- Security advisories (1)');
  });

  test('handles NULL optional fields', () => {
    const result = makeCrawlResult({
      rules: [{
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'No code example',
          description: 'A rule without code.',
          category: 'best-practice',
          severity: 'low',
          version_range: '>=18.0.0',
          source_url: 'https://react.dev',
        },
      }],
    });
    const sql = formatter.format(result);

    expect(sql).toContain('NULL');
  });

  test('escapes single quotes in strings', () => {
    const result = makeCrawlResult({
      rules: [{
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: "Don't mutate state",
          description: "Use setState() — don't modify directly.",
          category: 'best-practice',
          severity: 'high',
          version_range: '>=16.0.0',
          source_url: 'https://react.dev',
        },
      }],
    });
    const sql = formatter.format(result);

    expect(sql).toContain("Don''t mutate state");
    expect(sql).toContain("don''t modify directly");
  });

  test('groups rules by type with correct counts', () => {
    const result = makeCrawlResult({
      rules: [
        { type: 'best_practice', data: { library_name: 'react', ecosystem: 'npm', title: 'BP1', description: 'D', category: 'best-practice', severity: 'medium', version_range: '>=16', source_url: 'u' } as BestPracticeRule },
        { type: 'best_practice', data: { library_name: 'react', ecosystem: 'npm', title: 'BP2', description: 'D', category: 'best-practice', severity: 'medium', version_range: '>=16', source_url: 'u' } as BestPracticeRule },
        { type: 'anti_pattern', data: { library_name: 'react', ecosystem: 'npm', pattern_name: 'AP1', description: 'D', why_bad: 'W', better_approach: 'B', severity: 'medium' } as AntiPatternRule },
      ],
    });
    const sql = formatter.format(result);

    expect(sql).toContain('-- Best practices (2)');
    expect(sql).toContain('-- Anti-patterns (1)');
    expect(sql).not.toContain('-- Security advisories');
  });
});
