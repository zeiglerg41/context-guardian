import { PlaybookService } from '../src/services/playbook-service';
import { Database } from '../src/db/connection';
import { Cache } from '../src/db/cache';
import { GeneratePlaybookRequest } from '../src/types';

// Mock database and cache
jest.mock('../src/db/connection');
jest.mock('../src/db/cache');

describe('PlaybookService', () => {
  let service: PlaybookService;
  let mockDb: jest.Mocked<Database>;
  let mockCache: jest.Mocked<Cache>;

  beforeEach(() => {
    mockDb = new Database('mock://connection') as jest.Mocked<Database>;
    mockCache = new Cache('mock://redis') as jest.Mocked<Cache>;
    service = new PlaybookService(mockDb, mockCache);
  });

  test('returns cached response if available', async () => {
    const request: GeneratePlaybookRequest = {
      packageManager: 'npm',
      dependencies: [
        { name: 'react', version: '18.2.0' },
      ],
    };

    const cachedResponse = {
      rules: [],
      generatedAt: new Date().toISOString(),
    };

    mockCache.get = jest.fn().mockResolvedValue(cachedResponse);

    const result = await service.generatePlaybook(request);

    expect(result.cacheHit).toBe(true);
    expect(result.rules).toEqual([]);
    expect(mockCache.get).toHaveBeenCalled();
  });

  test('generates new response if not cached', async () => {
    const request: GeneratePlaybookRequest = {
      packageManager: 'npm',
      dependencies: [
        { name: 'react', version: '18.2.0' },
      ],
    };

    mockCache.get = jest.fn().mockResolvedValue(null);
    mockCache.set = jest.fn().mockResolvedValue(undefined);

    // postgres.js tagged template literals call the sql function directly.
    // Mock getClient to return a function that resolves to empty arrays.
    const mockSql = jest.fn().mockResolvedValue([]);
    mockDb.getClient = jest.fn().mockReturnValue(mockSql);

    const result = await service.generatePlaybook(request);

    expect(result.cacheHit).toBe(false);
    expect(result.rules).toEqual([]);
    // 3 queries per dependency: best_practices, anti_patterns, security_advisories
    expect(mockSql).toHaveBeenCalledTimes(3);
    expect(mockCache.set).toHaveBeenCalled();
  });

  test('returns rules from database with correct shape', async () => {
    const request: GeneratePlaybookRequest = {
      packageManager: 'npm',
      dependencies: [
        { name: 'react', version: '18.2.0' },
      ],
    };

    mockCache.get = jest.fn().mockResolvedValue(null);
    mockCache.set = jest.fn().mockResolvedValue(undefined);

    // First call: best_practices, second: anti_patterns, third: security_advisories
    const mockSql = jest.fn()
      .mockResolvedValueOnce([
        {
          id: 'bp-1',
          library_id: 'lib-react',
          title: 'Use useCallback for memoization',
          description: 'Wrap callbacks in useCallback',
          category: 'performance',
          severity: 'medium',
          version_range: '>=18.0.0',
          code_example: 'useCallback(() => {}, [dep])',
          source_url: 'https://react.dev',
          library_name: 'react',
        },
      ])
      .mockResolvedValueOnce([]) // anti_patterns
      .mockResolvedValueOnce([]); // security_advisories

    mockDb.getClient = jest.fn().mockReturnValue(mockSql);

    const result = await service.generatePlaybook(request);

    expect(result.rules).toHaveLength(1);
    expect(result.rules[0]).toMatchObject({
      type: 'best_practice',
      title: 'Use useCallback for memoization',
      severity: 'medium',
      library_name: 'react',
    });
  });

  test('queries for pattern-detected frameworks not in deps', async () => {
    const request: GeneratePlaybookRequest = {
      packageManager: 'npm',
      dependencies: [
        { name: 'react', version: '18.2.0' },
      ],
      patterns: {
        frameworks: ['next'],
        stateManagement: 'zustand',
        commonImports: [],
        patterns: { usesHooks: true, usesAsync: false, usesTypeScript: true, usesJSX: true },
      },
    };

    mockCache.get = jest.fn().mockResolvedValue(null);
    mockCache.set = jest.fn().mockResolvedValue(undefined);

    const mockSql = jest.fn().mockResolvedValue([]);
    mockDb.getClient = jest.fn().mockReturnValue(mockSql);

    await service.generatePlaybook(request);

    // 3 deps (react + next + zustand) × 3 queries each = 9
    expect(mockSql).toHaveBeenCalledTimes(9);
  });

  test('sorts rules by severity (critical first)', async () => {
    const request: GeneratePlaybookRequest = {
      packageManager: 'npm',
      dependencies: [
        { name: 'express', version: '4.18.0' },
      ],
    };

    mockCache.get = jest.fn().mockResolvedValue(null);
    mockCache.set = jest.fn().mockResolvedValue(undefined);

    const mockSql = jest.fn()
      .mockResolvedValueOnce([
        {
          id: 'bp-1', library_id: 'lib-express', title: 'Low rule',
          description: 'desc', category: 'style', severity: 'low',
          version_range: null, code_example: null, source_url: null,
          library_name: 'express',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: 'ap-1', library_id: 'lib-express', pattern_name: 'Critical anti-pattern',
          description: 'desc', why_bad: 'bad', better_approach: 'better',
          severity: 'critical', version_range: null,
          code_example_bad: null, code_example_good: null, source_url: null,
          library_name: 'express',
        },
      ])
      .mockResolvedValueOnce([]);

    mockDb.getClient = jest.fn().mockReturnValue(mockSql);

    const result = await service.generatePlaybook(request);

    expect(result.rules).toHaveLength(2);
    expect(result.rules[0].severity).toBe('critical');
    expect(result.rules[1].severity).toBe('low');
  });
});
