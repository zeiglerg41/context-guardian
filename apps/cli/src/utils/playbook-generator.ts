import * as fs from 'fs';
import * as path from 'path';
import { BestPractice, PlaybookResponse } from '../types';

/**
 * Generates a .guardian.md playbook file from API response
 */
export class PlaybookGenerator {
  /**
   * Formats best practices into a Markdown playbook
   * 
   * @param response - API response with best practices
   * @param projectPath - Path to the project directory
   * @returns Path to the generated playbook file
   */
  generate(response: PlaybookResponse, projectPath: string): string {
    const markdown = this.formatAsMarkdown(response);
    const playbookPath = path.join(projectPath, '.guardian.md');

    fs.writeFileSync(playbookPath, markdown, 'utf-8');

    return playbookPath;
  }

  /**
   * Formats the playbook response as Markdown
   */
  private formatAsMarkdown(response: PlaybookResponse): string {
    const lines: string[] = [];

    // Header
    lines.push('# Context Guardian Playbook');
    lines.push('');
    lines.push('> **Auto-generated best practices for your AI coding assistant**');
    lines.push(`> Generated: ${new Date(response.generatedAt).toLocaleString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    // Group rules by severity
    const critical = response.rules.filter(r => r.severity === 'critical');
    const high = response.rules.filter(r => r.severity === 'high');
    const medium = response.rules.filter(r => r.severity === 'medium');
    const low = response.rules.filter(r => r.severity === 'low');

    // Critical issues first
    if (critical.length > 0) {
      lines.push('## 🚨 Critical Issues');
      lines.push('');
      critical.forEach(rule => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    // High priority
    if (high.length > 0) {
      lines.push('## ⚠️ High Priority');
      lines.push('');
      high.forEach(rule => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    // Medium priority
    if (medium.length > 0) {
      lines.push('## 📋 Best Practices');
      lines.push('');
      medium.forEach(rule => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    // Low priority
    if (low.length > 0) {
      lines.push('## 💡 Recommendations');
      lines.push('');
      low.forEach(rule => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    // Footer
    lines.push('---');
    lines.push('');
    lines.push('**Note**: This playbook is automatically updated when dependencies change.');
    lines.push('Run `guardian sync` to refresh.');
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Formats a single rule as Markdown
   */
  private formatRule(rule: BestPractice): string[] {
    const lines: string[] = [];

    // Title with type badge
    const badge = this.getTypeBadge(rule.type);
    lines.push(`### ${badge} ${rule.title}`);
    lines.push('');

    // Description
    lines.push(rule.description);
    lines.push('');

    // Code example (if present)
    if (rule.code_example) {
      lines.push('```javascript');
      lines.push(rule.code_example);
      lines.push('```');
      lines.push('');
    }

    // Source link (if present)
    if (rule.source_url) {
      lines.push(`📚 [Learn more](${rule.source_url})`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');

    return lines;
  }

  /**
   * Gets an emoji badge for the rule type
   */
  private getTypeBadge(type: string): string {
    switch (type) {
      case 'security':
        return '🔒';
      case 'anti_pattern':
        return '❌';
      case 'best_practice':
      default:
        return '✅';
    }
  }
}
