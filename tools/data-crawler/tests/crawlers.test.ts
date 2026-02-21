import { ReactCrawler } from '../src/crawlers/react-crawler';
import { NextCrawler } from '../src/crawlers/next-crawler';
import { ExpressCrawler } from '../src/crawlers/express-crawler';

describe('ReactCrawler', () => {
  let crawler: ReactCrawler;

  beforeEach(() => {
    crawler = new ReactCrawler();
  });

  test('has correct library metadata', () => {
    expect(crawler.library).toBe('react');
    expect(crawler.ecosystem).toBe('npm');
    expect(crawler.baseUrl).toBe('https://react.dev');
    expect(crawler.targetPages.length).toBeGreaterThan(0);
  });

  test('provides fallback rules for hooks page', () => {
    const rules = crawler.getFallbackRules('https://react.dev/reference/react/hooks');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].type).toBe('best_practice');
    if (rules[0].type === 'best_practice') {
      expect(rules[0].data.library_name).toBe('react');
      expect(rules[0].data.severity).toBe('high');
    }
  });

  test('provides fallback rules for memo page', () => {
    const rules = crawler.getFallbackRules('https://react.dev/reference/react/memo');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].type).toBe('best_practice');
    if (rules[0].type === 'best_practice') {
      expect(rules[0].data.category).toBe('performance');
    }
  });

  test('provides fallback anti-pattern for effects page', () => {
    const rules = crawler.getFallbackRules('https://react.dev/learn/you-might-not-need-an-effect');
    expect(rules.length).toBeGreaterThan(0);
    expect(rules[0].type).toBe('anti_pattern');
    if (rules[0].type === 'anti_pattern') {
      expect(rules[0].data.code_example_bad).toBeDefined();
      expect(rules[0].data.code_example_good).toBeDefined();
    }
  });

  test('returns empty array for unknown page', () => {
    const rules = crawler.getFallbackRules('https://react.dev/unknown');
    expect(rules).toEqual([]);
  });
});

describe('NextCrawler', () => {
  let crawler: NextCrawler;

  beforeEach(() => {
    crawler = new NextCrawler();
  });

  test('has correct library metadata', () => {
    expect(crawler.library).toBe('next');
    expect(crawler.ecosystem).toBe('npm');
    expect(crawler.targetPages.length).toBeGreaterThan(0);
  });

  test('provides fallback rules for all target pages', () => {
    for (const page of crawler.targetPages) {
      const url = `${crawler.baseUrl}${page}`;
      const rules = crawler.getFallbackRules(url);
      expect(rules.length).toBeGreaterThan(0);
    }
  });
});

describe('ExpressCrawler', () => {
  let crawler: ExpressCrawler;

  beforeEach(() => {
    crawler = new ExpressCrawler();
  });

  test('has correct library metadata', () => {
    expect(crawler.library).toBe('express');
    expect(crawler.ecosystem).toBe('npm');
    expect(crawler.targetPages.length).toBeGreaterThan(0);
  });

  test('provides fallback rules for all target pages', () => {
    for (const page of crawler.targetPages) {
      const url = `${crawler.baseUrl}${page}`;
      const rules = crawler.getFallbackRules(url);
      expect(rules.length).toBeGreaterThan(0);
    }
  });

  test('security fallback rules have critical severity', () => {
    const secUrl = crawler.targetPages.find(p => p.includes('security'));
    if (secUrl) {
      const url = `${crawler.baseUrl}${secUrl}`;
      const rules = crawler.getFallbackRules(url);
      const secRule = rules.find(r => r.type === 'best_practice');
      if (secRule && secRule.type === 'best_practice') {
        expect(['critical', 'high']).toContain(secRule.data.severity);
      }
    }
  });
});
