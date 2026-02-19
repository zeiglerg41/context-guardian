import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import {
  PlaybookInput,
  PlaybookOptions,
  PlaybookOutput,
  PlaybookRule,
} from '../types';

/**
 * Markdown formatter for Context Guardian playbooks
 */
export class MarkdownFormatter {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers(): void {
    // Join array helper
    Handlebars.registerHelper('join', (arr: string[], separator: string) => {
      return arr ? arr.join(separator) : '';
    });

    // Conditional helpers
    Handlebars.registerHelper('hasCritical', function (this: any) {
      return this.criticalRules && this.criticalRules.length > 0;
    });
  }

  /**
   * Load Handlebars templates
   */
  private loadTemplates(): void {
    const templatesDir = path.join(__dirname, '../templates');

    // Load base template
    const baseTemplate = fs.readFileSync(
      path.join(templatesDir, 'base.hbs'),
      'utf-8'
    );
    this.templates.set('base', Handlebars.compile(baseTemplate));

    // Load cursor template
    const cursorTemplate = fs.readFileSync(
      path.join(templatesDir, 'cursor.hbs'),
      'utf-8'
    );
    this.templates.set('cursor', Handlebars.compile(cursorTemplate));
  }

  /**
   * Generate playbook markdown
   */
  generate(input: PlaybookInput, options: PlaybookOptions = {}): PlaybookOutput {
    const {
      projectName = 'Your Project',
      projectType = 'general',
      cursorCompatible = false,
      groupBySeverity = true,
    } = options;

    // Group rules by severity
    const rulesBySeverity = this.groupBySeverity(input.rules);

    // Prepare template data
    const templateData = {
      projectName,
      projectType,
      generatedAt: input.generatedAt,
      offline: input.offline || false,
      patterns: input.patterns,
      libraryCount: this.countUniqueLibraries(input.dependencies),
      ruleCount: input.rules.length,
      criticalCount: rulesBySeverity.critical.length,
      securityCount: input.rules.filter((r) => r.type === 'security').length,
      criticalRules: rulesBySeverity.critical,
      highRules: rulesBySeverity.high,
      mediumRules: rulesBySeverity.medium,
      lowRules: rulesBySeverity.low,
      version: '0.1.0',
    };

    // Select template
    const templateName = cursorCompatible ? 'cursor' : 'base';
    const template = this.templates.get(templateName);

    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Generate markdown
    const markdown = template(templateData);

    return {
      markdown,
      metadata: {
        ruleCount: input.rules.length,
        criticalCount: rulesBySeverity.critical.length,
        securityCount: templateData.securityCount,
        libraryCount: templateData.libraryCount,
      },
    };
  }

  /**
   * Group rules by severity
   */
  private groupBySeverity(rules: PlaybookRule[]): {
    critical: PlaybookRule[];
    high: PlaybookRule[];
    medium: PlaybookRule[];
    low: PlaybookRule[];
  } {
    return {
      critical: rules.filter((r) => r.severity === 'critical'),
      high: rules.filter((r) => r.severity === 'high'),
      medium: rules.filter((r) => r.severity === 'medium'),
      low: rules.filter((r) => r.severity === 'low'),
    };
  }

  /**
   * Count unique libraries
   */
  private countUniqueLibraries(dependencies: any[]): number {
    const uniqueNames = new Set(dependencies.map((d) => d.name));
    return uniqueNames.size;
  }
}
