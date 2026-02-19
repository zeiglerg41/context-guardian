import * as fs from 'fs';
import * as path from 'path';
import { PlaybookRule, GeneratePlaybookResponse } from '../types';

/**
 * Legacy playbook generator for CLI (generates simple .guardian.md from API response)
 * Note: For full-featured generation, use @context-guardian/playbook-generator
 */
export class PlaybookGenerator {
  /**
   * Formats best practices into a Markdown playbook
   */
  generate(response: GeneratePlaybookResponse, projectPath: string): string {
    const markdown = this.formatAsMarkdown(response);
    const playbookPath = path.join(projectPath, '.guardian.md');

    fs.writeFileSync(playbookPath, markdown, 'utf-8');

    return playbookPath;
  }

  /**
   * Formats the playbook response as Markdown
   */
  private formatAsMarkdown(response: GeneratePlaybookResponse): string {
    const lines: string[] = [];

    lines.push('# Context Guardian Playbook');
    lines.push('');
    lines.push('> **Auto-generated best practices for your AI coding assistant**');
    lines.push(`> Generated: ${new Date(response.generatedAt).toLocaleString()}`);
    lines.push('');
    lines.push('---');
    lines.push('');

    const critical = response.rules.filter((r: PlaybookRule) => r.severity === 'critical');
    const high = response.rules.filter((r: PlaybookRule) => r.severity === 'high');
    const medium = response.rules.filter((r: PlaybookRule) => r.severity === 'medium');
    const low = response.rules.filter((r: PlaybookRule) => r.severity === 'low');

    if (critical.length > 0) {
      lines.push('## 🚨 Critical Issues');
      lines.push('');
      critical.forEach((rule: PlaybookRule) => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    if (high.length > 0) {
      lines.push('## ⚠️ High Priority');
      lines.push('');
      high.forEach((rule: PlaybookRule) => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    if (medium.length > 0) {
      lines.push('## 📋 Best Practices');
      lines.push('');
      medium.forEach((rule: PlaybookRule) => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    if (low.length > 0) {
      lines.push('## 💡 Recommendations');
      lines.push('');
      low.forEach((rule: PlaybookRule) => lines.push(...this.formatRule(rule)));
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    lines.push('**Note**: This playbook is automatically updated when dependencies change.');
    lines.push('Run `guardian sync` to refresh.');
    lines.push('');

    return lines.join('\n');
  }

  private formatRule(rule: PlaybookRule): string[] {
    const lines: string[] = [];
    const badge = this.getTypeBadge(rule.type);
    lines.push(`### ${badge} ${rule.title}`);
    lines.push('');
    lines.push(rule.description);
    lines.push('');

    if (rule.code_example) {
      lines.push('```javascript');
      lines.push(rule.code_example);
      lines.push('```');
      lines.push('');
    }

    if (rule.source_url) {
      lines.push(`📚 [Learn more](${rule.source_url})`);
      lines.push('');
    }

    lines.push('---');
    lines.push('');
    return lines;
  }

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
