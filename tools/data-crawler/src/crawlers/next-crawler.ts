import * as cheerio from 'cheerio';
import { CrawledRule } from '../types';
import { BaseCrawler } from './base-crawler';

/**
 * Crawls Next.js documentation for best practices and anti-patterns.
 */
export class NextCrawler extends BaseCrawler {
  readonly library = 'next';
  readonly ecosystem = 'npm' as const;
  readonly baseUrl = 'https://nextjs.org';
  readonly targetPages = [
    '/docs/app/building-your-application/rendering/server-components',
    '/docs/app/building-your-application/data-fetching',
    '/docs/app/building-your-application/optimizing/images',
  ];

  extractRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    const sections = this.extractSections($);
    const rules: CrawledRule[] = [];

    for (const section of sections) {
      if (section.content.length < 50) continue;

      rules.push({
        type: 'best_practice',
        data: {
          library_name: 'next',
          ecosystem: 'npm',
          title: section.heading,
          description: section.content.substring(0, 500),
          category: url.includes('optimizing') ? 'performance' : 'best-practice',
          severity: 'medium',
          version_range: '>=13.0.0',
          code_example: section.codeExample,
          source_url: url,
        },
      });
    }

    return rules.length > 0 ? rules : this.getFallbackRules(url);
  }

  getFallbackRules(url: string): CrawledRule[] {
    if (url.includes('server-components')) {
      return [
        {
          type: 'best_practice',
          data: {
            library_name: 'next', ecosystem: 'npm',
            title: 'Use Server Components by default in App Router',
            description: 'In Next.js 13+ App Router, components are Server Components by default. Only add "use client" when you need interactivity, browser APIs, or hooks.',
            category: 'performance', severity: 'high', version_range: '>=13.0.0',
            code_example: '// Server Component (default) - can fetch data directly\nexport default async function Page() {\n  const data = await fetchData();\n  return <div>{data}</div>;\n}',
            source_url: url,
          },
        },
        {
          type: 'anti_pattern',
          data: {
            library_name: 'next', ecosystem: 'npm',
            pattern_name: 'Client-side data fetching in Server Components',
            description: 'Using useEffect to fetch data when a Server Component can fetch directly.',
            why_bad: 'Server Components can fetch data during render. Using useEffect forces client-side fetching, losing SSR benefits.',
            better_approach: 'Fetch data directly in the Server Component using async/await.',
            severity: 'high', version_range: '>=13.0.0',
            source_url: url,
          },
        },
      ];
    }
    if (url.includes('data-fetching')) {
      return [{
        type: 'best_practice',
        data: {
          library_name: 'next', ecosystem: 'npm',
          title: 'Use async Server Components for data fetching',
          description: 'Fetch data directly in async Server Components instead of using client-side data fetching libraries.',
          category: 'best-practice', severity: 'high', version_range: '>=13.0.0',
          source_url: url,
        },
      }];
    }
    if (url.includes('images')) {
      return [{
        type: 'anti_pattern',
        data: {
          library_name: 'next', ecosystem: 'npm',
          pattern_name: 'Not optimizing images with next/image',
          description: 'Using standard <img> tags instead of Next.js Image component.',
          why_bad: 'Misses automatic optimization, lazy loading, and responsive sizing.',
          better_approach: 'Use next/image for all images.',
          severity: 'medium', version_range: '>=10.0.0',
          code_example_bad: '<img src="/photo.jpg" alt="Photo" />',
          code_example_good: 'import Image from "next/image";\n<Image src="/photo.jpg" alt="Photo" width={500} height={300} />',
          source_url: url,
        },
      }];
    }
    return [];
  }
}
