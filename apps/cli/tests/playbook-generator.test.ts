import { PlaybookGenerator } from '../src/utils/playbook-generator';
import { GeneratePlaybookResponse } from '../src/types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('PlaybookGenerator', () => {
  let generator: PlaybookGenerator;
  let tempDir: string;

  beforeEach(() => {
    generator = new PlaybookGenerator();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'guardian-test-'));
  });

  afterEach(() => {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('generates a .guardian.md file', () => {
    const mockResponse: GeneratePlaybookResponse = {
      rules: [
        {
          type: 'best_practice',
          id: 'bp-1',
          library_id: 'lib-1',
          title: 'Use hooks in React 18+',
          description: 'Prefer hooks over class components.',
          category: 'best-practice',
          severity: 'medium',
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    const playbookPath = generator.generate(mockResponse, tempDir);

    expect(fs.existsSync(playbookPath)).toBe(true);
    expect(playbookPath).toContain('.guardian.md');
  });

  test('includes all severity levels', () => {
    const mockResponse: GeneratePlaybookResponse = {
      rules: [
        {
          type: 'security',
          id: 'sec-1',
          library_id: 'lib-1',
          title: 'Critical security issue',
          description: 'Fix this immediately.',
          category: 'security',
          severity: 'critical',
        },
        {
          type: 'best_practice',
          id: 'bp-1',
          library_id: 'lib-1',
          title: 'High priority',
          description: 'Important best practice.',
          category: 'best-practice',
          severity: 'high',
        },
        {
          type: 'best_practice',
          id: 'bp-2',
          library_id: 'lib-1',
          title: 'Medium priority',
          description: 'Good to follow.',
          category: 'best-practice',
          severity: 'medium',
        },
        {
          type: 'best_practice',
          id: 'bp-3',
          library_id: 'lib-1',
          title: 'Low priority',
          description: 'Nice to have.',
          category: 'best-practice',
          severity: 'low',
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    const playbookPath = generator.generate(mockResponse, tempDir);
    const content = fs.readFileSync(playbookPath, 'utf-8');

    expect(content).toContain('🚨 Critical Issues');
    expect(content).toContain('⚠️ High Priority');
    expect(content).toContain('📋 Best Practices');
    expect(content).toContain('💡 Recommendations');
  });

  test('includes code examples when present', () => {
    const mockResponse: GeneratePlaybookResponse = {
      rules: [
        {
          type: 'best_practice',
          id: 'bp-1',
          library_id: 'lib-1',
          title: 'Example with code',
          description: 'This has a code example.',
          category: 'best-practice',
          severity: 'medium',
          code_example: 'const example = "code";',
        },
      ],
      generatedAt: new Date().toISOString(),
    };

    const playbookPath = generator.generate(mockResponse, tempDir);
    const content = fs.readFileSync(playbookPath, 'utf-8');

    expect(content).toContain('```javascript');
    expect(content).toContain('const example = "code";');
  });
});
