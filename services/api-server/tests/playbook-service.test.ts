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

    // Mock database query
    const mockGetClient = jest.fn().mockReturnValue({
      '``': jest.fn().mockResolvedValue([]),
    });
    mockDb.getClient = mockGetClient as any;

    const result = await service.generatePlaybook(request);

    expect(result.cacheHit).toBe(false);
    expect(mockCache.set).toHaveBeenCalled();
  });
});
