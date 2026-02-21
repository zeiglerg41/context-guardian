import Handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

// Read version from package.json at module load time
const pkgJsonPath = path.resolve(__dirname, '..', 'package.json');
const pkgVersion: string = (() => {
  try { return JSON.parse(fs.readFileSync(pkgJsonPath, 'utf-8')).version; }
  catch { return '0.1.0'; }
})();
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
  private hbs: typeof Handlebars;
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.hbs = Handlebars.create();
    this.registerHelpers();
    this.loadTemplates();
  }

  /**
   * Register Handlebars helpers on this instance's isolated environment
   */
  private registerHelpers(): void {
    // Join array helper
    this.hbs.registerHelper('join', (arr: string[], separator: string) => {
      return arr ? arr.join(separator) : '';
    });

    // Conditional helpers
    this.hbs.registerHelper('hasCritical', function (this: any) {
      return this.criticalRules && this.criticalRules.length > 0;
    });

    this.hbs.registerHelper('hasKnownComponentStyle', function (this: any) {
      return this.patterns?.componentStyle && this.patterns.componentStyle !== 'unknown';
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
    this.templates.set('base', this.hbs.compile(baseTemplate));

    // Load cursor template
    const cursorTemplate = fs.readFileSync(
      path.join(templatesDir, 'cursor.hbs'),
      'utf-8'
    );
    this.templates.set('cursor', this.hbs.compile(cursorTemplate));
  }

  /**
   * Generate playbook markdown
   */
  generate(input: PlaybookInput, options: PlaybookOptions = {}): PlaybookOutput {
    const {
      projectName = 'Your Project',
      projectType = 'general',
      cursorCompatible = false,
      includeExamples = true,
      groupBySeverity = true,
    } = options;

    // Strip code examples if option is disabled
    const rules = includeExamples ? input.rules : input.rules.map(r => ({ ...r, code_example: undefined }));

    // Group rules by severity
    const rulesBySeverity = this.groupBySeverity(rules);

    // Prepare template data
    const templateData = {
      projectName,
      projectType,
      generatedAt: input.generatedAt,
      offline: input.offline || false,
      patterns: input.patterns,
      hasKnownComponentStyle: input.patterns?.componentStyle && String(input.patterns.componentStyle) !== 'unknown',
      libraryCount: this.countUniqueLibraries(rules),
      ruleCount: rules.length,
      criticalCount: rulesBySeverity.critical.length,
      securityCount: rules.filter((r) => r.type === 'security').length,
      criticalRules: rulesBySeverity.critical,
      highRules: rulesBySeverity.high,
      mediumRules: rulesBySeverity.medium,
      lowRules: rulesBySeverity.low,
      version: pkgVersion,
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
   * Count unique libraries that have matching rules
   */
  private countUniqueLibraries(rules: PlaybookRule[]): number {
    const uniqueNames = new Set(rules.map((r) => r.library_name));
    return uniqueNames.size;
  }
}
