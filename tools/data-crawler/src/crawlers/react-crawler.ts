import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, CrawledRule } from '../types';
import { SQLFormatter } from '../formatters/sql-formatter';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Crawls React documentation for best practices
 */
export class ReactCrawler {
  private baseUrl = 'https://react.dev';

  /**
   * Crawl React documentation
   */
  async crawl(): Promise<CrawlResult> {
    console.log('🕷️  Crawling React documentation...\n');

    const rules: CrawledRule[] = [];
    const sourceUrls: string[] = [];

    // Target pages with best practices
    const targetPages = [
      '/reference/react/hooks',
      '/reference/react/memo',
      '/reference/react-dom/components/common',
      '/learn/keeping-components-pure',
      '/learn/you-might-not-need-an-effect',
    ];

    for (const page of targetPages) {
      const url = `${this.baseUrl}${page}`;
      console.log(`Crawling: ${url}`);

      try {
        const pageRules = await this.crawlPage(url);
        rules.push(...pageRules);
        sourceUrls.push(url);
        console.log(`  ✓ Found ${pageRules.length} rules\n`);

        // Be polite: wait 1 second between requests
        await this.sleep(1000);
      } catch (error) {
        console.error(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}\n`);
      }
    }

    console.log(`\n✅ Total rules found: ${rules.length}`);

    return {
      library: 'react',
      ecosystem: 'npm',
      version: '18.x',
      rules,
      crawledAt: new Date().toISOString(),
      sourceUrls,
    };
  }

  /**
   * Crawl a single page
   */
  private async crawlPage(url: string): Promise<CrawledRule[]> {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const rules: CrawledRule[] = [];

    // Extract rules based on URL
    if (url.includes('/hooks')) {
      rules.push(...this.extractHooksRules($, url));
    } else if (url.includes('/memo')) {
      rules.push(...this.extractMemoRules($, url));
    } else if (url.includes('/common')) {
      rules.push(...this.extractSecurityRules($, url));
    } else if (url.includes('/keeping-components-pure')) {
      rules.push(...this.extractPurityRules($, url));
    } else if (url.includes('/you-might-not-need-an-effect')) {
      rules.push(...this.extractEffectRules($, url));
    }

    return rules;
  }

  /**
   * Extract hooks best practices
   */
  private extractHooksRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    return [
      {
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'Only call hooks at the top level',
          description: 'Don\'t call hooks inside loops, conditions, or nested functions. Always use hooks at the top level of your React function, before any early returns.',
          category: 'best-practice',
          severity: 'high',
          version_range: '>=16.8.0',
          code_example: `// ❌ Bad
function Component({ condition }) {
  if (condition) {
    const [state, setState] = useState(0); // Don't do this!
  }
}

// ✅ Good
function Component({ condition }) {
  const [state, setState] = useState(0);
  if (condition) {
    // Use state here
  }
}`,
          source_url: url,
        },
      },
      {
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'Only call hooks from React functions',
          description: 'Don\'t call hooks from regular JavaScript functions. Call them from React function components or custom hooks.',
          category: 'best-practice',
          severity: 'high',
          version_range: '>=16.8.0',
          source_url: url,
        },
      },
    ];
  }

  /**
   * Extract React.memo best practices
   */
  private extractMemoRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    return [
      {
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'Use React.memo for expensive components',
          description: 'Wrap components that render frequently with React.memo to prevent unnecessary re-renders when props haven\'t changed. This is especially useful for components that perform expensive calculations or render large lists.',
          category: 'performance',
          severity: 'medium',
          version_range: '>=16.6.0',
          code_example: `const ExpensiveComponent = React.memo(({ data }) => {
  // Expensive rendering logic
  const processedData = expensiveCalculation(data);
  return <div>{processedData}</div>;
});`,
          source_url: url,
        },
      },
    ];
  }

  /**
   * Extract security advisories
   */
  private extractSecurityRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    return [
      {
        type: 'security',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'Avoid dangerouslySetInnerHTML without sanitization',
          description: 'Using dangerouslySetInnerHTML without sanitizing user input can lead to XSS (Cross-Site Scripting) attacks. Always sanitize HTML content before rendering it.',
          severity: 'critical',
          affected_versions: '>=0.14.0',
          source_url: url,
        },
      },
    ];
  }

  /**
   * Extract component purity best practices
   */
  private extractPurityRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    return [
      {
        type: 'best_practice',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          title: 'Keep components pure',
          description: 'Components should be pure functions: given the same inputs (props), they should always return the same output. Avoid side effects in the render phase.',
          category: 'best-practice',
          severity: 'medium',
          version_range: '>=16.0.0',
          code_example: `// ❌ Bad - Side effect in render
function Component({ items }) {
  items.push(newItem); // Mutating props!
  return <div>{items.length}</div>;
}

// ✅ Good - Pure component
function Component({ items }) {
  const extendedItems = [...items, newItem];
  return <div>{extendedItems.length}</div>;
}`,
          source_url: url,
        },
      },
    ];
  }

  /**
   * Extract useEffect anti-patterns
   */
  private extractEffectRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    return [
      {
        type: 'anti_pattern',
        data: {
          library_name: 'react',
          ecosystem: 'npm',
          pattern_name: 'Unnecessary useEffect for derived state',
          description: 'Using useEffect to synchronize state that can be calculated during render.',
          why_bad: 'Causes unnecessary re-renders: first render with stale data, then Effect triggers setState causing a second render. Also makes data flow harder to trace.',
          better_approach: 'Calculate derived values directly during render. If you can compute something from existing props or state, don\'t put it in state at all.',
          severity: 'medium',
          version_range: '>=16.8.0',
          code_example_bad: `function Component({ items }) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    setCount(items.length);
  }, [items]);
}`,
          code_example_good: `function Component({ items }) {
  const count = items.length;
  // Use count directly — no state or Effect needed
}`,
          source_url: url,
        },
      },
    ];
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Main execution
 */
async function main() {
  const crawler = new ReactCrawler();
  const result = await crawler.crawl();

  // Format as SQL
  const formatter = new SQLFormatter();
  const sql = formatter.format(result);

  // Save to file
  const outputDir = path.join(__dirname, '../../output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'react-practices.sql');
  fs.writeFileSync(outputPath, sql);

  console.log(`\n💾 Saved to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   Libraries: 1 (react)`);
  console.log(`   Rules: ${result.rules.length}`);
  console.log(`   Best practices: ${result.rules.filter(r => r.type === 'best_practice').length}`);
  console.log(`   Anti-patterns: ${result.rules.filter(r => r.type === 'anti_pattern').length}`);
  console.log(`   Security: ${result.rules.filter(r => r.type === 'security').length}`);
}

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}
