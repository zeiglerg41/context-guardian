import * as cheerio from 'cheerio';
import { CrawledRule } from '../types';
import { BaseCrawler } from './base-crawler';

/**
 * Crawls Express.js documentation for best practices and anti-patterns.
 */
export class ExpressCrawler extends BaseCrawler {
  readonly library = 'express';
  readonly ecosystem = 'npm' as const;
  readonly baseUrl = 'https://expressjs.com';
  readonly targetPages = [
    '/en/advanced/best-practice-security.html',
    '/en/advanced/best-practice-performance.html',
    '/en/guide/error-handling.html',
  ];

  extractRules($: cheerio.CheerioAPI, url: string): CrawledRule[] {
    const sections = this.extractSections($);
    const rules: CrawledRule[] = [];

    for (const section of sections) {
      if (section.content.length < 50) continue;

      const isSecurity = url.includes('security');
      rules.push({
        type: 'best_practice',
        data: {
          library_name: 'express',
          ecosystem: 'npm',
          title: section.heading,
          description: section.content.substring(0, 500),
          category: isSecurity ? 'security' : 'performance',
          severity: isSecurity ? 'high' : 'medium',
          version_range: '>=4.0.0',
          code_example: section.codeExample,
          source_url: url,
        },
      });
    }

    return rules.length > 0 ? rules : this.getFallbackRules(url);
  }

  getFallbackRules(url: string): CrawledRule[] {
    if (url.includes('security')) {
      return [
        {
          type: 'best_practice',
          data: {
            library_name: 'express', ecosystem: 'npm',
            title: 'Always use helmet for security headers',
            description: 'Helmet helps secure Express apps by setting various HTTP headers to prevent common vulnerabilities.',
            category: 'security', severity: 'critical', version_range: '>=4.0.0',
            code_example: 'const helmet = require("helmet");\napp.use(helmet());',
            source_url: url,
          },
        },
        {
          type: 'best_practice',
          data: {
            library_name: 'express', ecosystem: 'npm',
            title: 'Use TLS/HTTPS in production',
            description: 'Always use HTTPS to encrypt data in transit. Use a reverse proxy like nginx or a cloud load balancer for TLS termination.',
            category: 'security', severity: 'critical', version_range: '>=4.0.0',
            source_url: url,
          },
        },
      ];
    }
    if (url.includes('performance')) {
      return [{
        type: 'best_practice',
        data: {
          library_name: 'express', ecosystem: 'npm',
          title: 'Use compression middleware',
          description: 'Use gzip compression to reduce response body size and improve transfer speed.',
          category: 'performance', severity: 'medium', version_range: '>=4.0.0',
          code_example: 'const compression = require("compression");\napp.use(compression());',
          source_url: url,
        },
      }];
    }
    if (url.includes('error-handling')) {
      return [
        {
          type: 'best_practice',
          data: {
            library_name: 'express', ecosystem: 'npm',
            title: 'Always handle async errors in route handlers',
            description: 'Express doesn\'t catch errors in async route handlers by default. Wrap in try-catch or use express-async-errors.',
            category: 'best-practice', severity: 'high', version_range: '>=4.0.0',
            code_example: 'app.get("/data", async (req, res, next) => {\n  try {\n    const data = await fetchData();\n    res.json(data);\n  } catch (err) {\n    next(err);\n  }\n});',
            source_url: url,
          },
        },
        {
          type: 'anti_pattern',
          data: {
            library_name: 'express', ecosystem: 'npm',
            pattern_name: 'Not using environment variables for config',
            description: 'Hardcoding configuration values like ports, API keys, or database URLs directly in code.',
            why_bad: 'Exposes secrets in version control, makes it impossible to change config without code changes.',
            better_approach: 'Use environment variables with dotenv or process.env.',
            severity: 'high', version_range: '>=4.0.0',
            code_example_bad: 'const PORT = 3000;\nconst DB_URL = "mongodb://localhost:27017/mydb";',
            code_example_good: 'require("dotenv").config();\nconst PORT = process.env.PORT || 3000;',
            source_url: url,
          },
        },
      ];
    }
    return [];
  }
}
