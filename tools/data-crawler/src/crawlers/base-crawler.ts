import axios from 'axios';
import * as cheerio from 'cheerio';
import { CrawlResult, CrawledRule, Ecosystem } from '../types';

/**
 * Base crawler with shared HTTP + cheerio logic.
 * Subclasses define target pages and rule extraction.
 */
export abstract class BaseCrawler {
  abstract readonly library: string;
  abstract readonly ecosystem: Ecosystem;
  abstract readonly baseUrl: string;
  abstract readonly targetPages: string[];

  /**
   * Crawl all target pages and collect rules.
   */
  async crawl(): Promise<CrawlResult> {
    console.log(`🕷️  Crawling ${this.library} documentation...\n`);

    const rules: CrawledRule[] = [];
    const sourceUrls: string[] = [];

    for (const page of this.targetPages) {
      const url = page.startsWith('http') ? page : `${this.baseUrl}${page}`;
      console.log(`Crawling: ${url}`);

      try {
        const response = await axios.get(url, { timeout: 10000 });
        const $ = cheerio.load(response.data);
        const pageRules = this.extractRules($, url);
        rules.push(...pageRules);
        sourceUrls.push(url);
        console.log(`  ✓ Found ${pageRules.length} rules\n`);

        // Be polite: wait between requests
        await this.sleep(1000);
      } catch (error) {
        console.error(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        // Fall back to curated rules for this page
        const fallbackRules = this.getFallbackRules(url);
        if (fallbackRules.length > 0) {
          rules.push(...fallbackRules);
          sourceUrls.push(url);
          console.log(`  ↪ Using ${fallbackRules.length} curated fallback rules\n`);
        }
      }
    }

    console.log(`\n✅ Total rules found: ${rules.length}`);
    return {
      library: this.library,
      ecosystem: this.ecosystem,
      rules,
      crawledAt: new Date().toISOString(),
      sourceUrls,
    };
  }

  /**
   * Extract rules from a parsed page. Override in subclasses.
   */
  abstract extractRules($: cheerio.CheerioAPI, url: string): CrawledRule[];

  /**
   * Curated fallback rules when crawling fails. Override in subclasses.
   */
  abstract getFallbackRules(url: string): CrawledRule[];

  /**
   * Extract text content from headings + following paragraphs.
   * Returns array of { heading, content, codeExample? } sections.
   */
  protected extractSections($: cheerio.CheerioAPI): Array<{
    heading: string;
    content: string;
    codeExample?: string;
  }> {
    const sections: Array<{ heading: string; content: string; codeExample?: string }> = [];

    $('h2, h3').each((_, el) => {
      const heading = $(el).text().trim();
      if (!heading) return;

      // Collect paragraph text after the heading until next heading
      let content = '';
      let codeExample: string | undefined;
      let sibling = $(el).next();

      while (sibling.length && !sibling.is('h2, h3')) {
        if (sibling.is('p')) {
          content += sibling.text().trim() + ' ';
        }
        if (sibling.is('pre') || sibling.find('pre').length) {
          const code = sibling.is('pre') ? sibling.text() : sibling.find('pre').first().text();
          if (!codeExample && code.trim()) {
            codeExample = code.trim();
          }
        }
        sibling = sibling.next();
      }

      if (content.trim()) {
        sections.push({ heading, content: content.trim(), codeExample });
      }
    });

    return sections;
  }

  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
