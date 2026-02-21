import * as cheerio from 'cheerio';
import { CrawledRule } from '../types';
import { BaseCrawler } from './base-crawler';

/**
 * Crawls React documentation for best practices, anti-patterns, and security rules.
 */
export class ReactCrawler extends BaseCrawler {
  readonly library = 'react';
  readonly ecosystem = 'npm' as const;
  readonly baseUrl = 'https://react.dev';
  readonly targetPages = [
    '/reference/react/hooks',
    '/reference/react/memo',
    '/learn/keeping-components-pure',
    '/learn/you-might-not-need-an-effect',
  ];

  extractRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    const sections = this.extractSections($);
    const rules: CrawledRule[] = [];

    // If we got meaningful sections, generate rules from them
    if (sections.length > 0) {
      for (const section of sections) {
        // Skip sections that are too short or generic
        if (section.content.length < 50) continue;

        // Detect if this is about anti-patterns or best practices
        const isAntiPattern = /don't|avoid|bad|wrong|mistake|instead of/i.test(section.heading);

        if (isAntiPattern) {
          rules.push({
            type: 'anti_pattern',
            data: {
              library_name: 'react',
              ecosystem: 'npm',
              pattern_name: section.heading,
              description: section.content.substring(0, 500),
              why_bad: section.content.substring(0, 300),
              better_approach: 'See the documentation for recommended alternatives.',
              severity: 'medium',
              version_range: '>=16.8.0',
              code_example_bad: section.codeExample,
              source_url: url,
            },
          });
        } else {
          rules.push({
            type: 'best_practice',
            data: {
              library_name: 'react',
              ecosystem: 'npm',
              title: section.heading,
              description: section.content.substring(0, 500),
              category: url.includes('performance') || url.includes('memo') ? 'performance' : 'best-practice',
              severity: 'medium',
              version_range: '>=16.8.0',
              code_example: section.codeExample,
              source_url: url,
            },
          });
        }
      }
    }

    // If cheerio extraction didn't produce results, use fallbacks
    if (rules.length === 0) {
      return this.getFallbackRules(url);
    }

    return rules;
  }

  getFallbackRules(url: string): CrawledRule[] {
    if (url.includes('/hooks')) {
      return [
        {
          type: 'best_practice',
          data: {
            library_name: 'react', ecosystem: 'npm',
            title: 'Only call hooks at the top level',
            description: 'Don\'t call hooks inside loops, conditions, or nested functions. Always use hooks at the top level of your React function.',
            category: 'best-practice', severity: 'high', version_range: '>=16.8.0',
            code_example: '// ✅ Good\nfunction Component() {\n  const [state, setState] = useState(0);\n  // ...\n}',
            source_url: url,
          },
        },
        {
          type: 'best_practice',
          data: {
            library_name: 'react', ecosystem: 'npm',
            title: 'Only call hooks from React functions',
            description: 'Don\'t call hooks from regular JavaScript functions. Call them from React function components or custom hooks.',
            category: 'best-practice', severity: 'high', version_range: '>=16.8.0',
            source_url: url,
          },
        },
      ];
    }
    if (url.includes('/memo')) {
      return [{
        type: 'best_practice',
        data: {
          library_name: 'react', ecosystem: 'npm',
          title: 'Use React.memo for expensive components',
          description: 'Wrap components that render frequently with React.memo to prevent unnecessary re-renders when props haven\'t changed.',
          category: 'performance', severity: 'medium', version_range: '>=16.6.0',
          source_url: url,
        },
      }];
    }
    if (url.includes('/keeping-components-pure')) {
      return [{
        type: 'best_practice',
        data: {
          library_name: 'react', ecosystem: 'npm',
          title: 'Keep components pure',
          description: 'Components should be pure functions: given the same inputs, they should always return the same output. Avoid side effects in the render phase.',
          category: 'best-practice', severity: 'medium', version_range: '>=16.0.0',
          source_url: url,
        },
      }];
    }
    if (url.includes('/you-might-not-need-an-effect')) {
      return [{
        type: 'anti_pattern',
        data: {
          library_name: 'react', ecosystem: 'npm',
          pattern_name: 'Unnecessary useEffect for derived state',
          description: 'Using useEffect to synchronize state that can be calculated during render.',
          why_bad: 'Causes unnecessary re-renders and makes data flow harder to trace.',
          better_approach: 'Calculate derived values directly during render.',
          severity: 'medium', version_range: '>=16.8.0',
          code_example_bad: 'useEffect(() => { setCount(items.length); }, [items]);',
          code_example_good: 'const count = items.length; // No state or Effect needed',
          source_url: url,
        },
      }];
    }
    return [];
  }
}
