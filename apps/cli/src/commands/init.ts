import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ApiClient } from '../utils/api-client';
import { InitOptions, PlaybookInput, PlaybookInputPatterns } from '../types';
import { analyzeDependencies } from '@context-guardian/dependency-parser';
import { ASTAnalyzer } from '@context-guardian/ast-analyzer';
import { MarkdownFormatter } from '@context-guardian/playbook-generator';

/**
 * Init command: Analyzes the project and generates initial .guardian.md playbook
 */
export function createInitCommand(logger: Logger): Command {
  const command = new Command('init');

  command
    .description('Initialize Context Guardian in the current project')
    .option('-f, --force', 'Overwrite existing .guardian.md file')
    .option('--offline', 'Use offline mode (bundled SQLite fallback)')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options: InitOptions) => {
      const spinner = ora('Initializing Context Guardian...').start();

      try {
        const projectPath = process.cwd();
        const playbookPath = path.join(projectPath, '.guardian.md');

        // Check if .guardian.md already exists
        if (fs.existsSync(playbookPath) && !options.force) {
          spinner.stop();
          logger.warn('.guardian.md already exists. Use --force to overwrite.');
          process.exit(1);
        }

        // Step 1: Detect package manager and parse dependencies
        spinner.text = 'Detecting package manager and analyzing dependencies...';
        const manifest = analyzeDependencies(projectPath);
        if (options.verbose) {
          logger.debug(`Detected ${manifest.packageManager} with ${manifest.dependencies.length} dependencies`);
        }

        // Step 2: AST analysis for project patterns
        spinner.text = 'Analyzing project patterns...';
        const analyzer = new ASTAnalyzer();
        const patterns = await analyzer.analyzeProject({
          rootDir: projectPath,
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          excludeDirs: ['node_modules', 'dist', 'build', '.git', 'coverage'],
          maxFiles: 200,
        });
        if (options.verbose) {
          logger.debug(`Frameworks: ${patterns.frameworks.join(', ') || 'none detected'}`);
          logger.debug(`State management: ${patterns.stateManagement || 'none detected'}`);
        }

        // Step 3: Fetch rules (offline or API)
        let rules;
        if (options.offline) {
          spinner.text = 'Querying offline database...';
          // Lazy import to avoid requiring better-sqlite3 for online users
          const { OfflineClient } = require('@context-guardian/offline-fallback');
          const offlinePkgDir = path.dirname(require.resolve('@context-guardian/offline-fallback/package.json'));
          const dbPath = path.join(offlinePkgDir, 'data', 'offline-fallback.db');
          if (!fs.existsSync(dbPath)) {
            throw new Error(
              `Offline database not found at ${dbPath}. Run "guardian sync" while online first.`
            );
          }
          const offlineClient = new OfflineClient(dbPath);
          try {
            rules = offlineClient.queryMultipleDependencies(manifest.dependencies);
          } finally {
            offlineClient.close();
          }
        } else {
          spinner.text = 'Fetching best practices from API...';
          const apiClient = new ApiClient();
          const response = await apiClient.generatePlaybook({
            packageManager: manifest.packageManager,
            dependencies: manifest.dependencies,
            projectName: manifest.projectName,
            projectVersion: manifest.projectVersion,
            patterns,
          });
          rules = response.rules;
        }

        if (options.verbose) {
          logger.debug(`Fetched ${rules.length} rules`);
        }

        // Step 4: Wrap patterns for template (string -> string[])
        const templatePatterns: PlaybookInputPatterns = {
          stateManagement: patterns.stateManagement ? [patterns.stateManagement] : undefined,
          componentStyle: patterns.componentStyle as PlaybookInputPatterns['componentStyle'],
          frameworks: patterns.frameworks.length > 0 ? patterns.frameworks : undefined,
        };

        // Step 5: Generate playbook
        spinner.text = 'Generating playbook...';
        const formatter = new MarkdownFormatter();
        const playbookInput: PlaybookInput = {
          dependencies: manifest.dependencies,
          patterns: templatePatterns,
          rules,
          generatedAt: new Date().toISOString(),
          offline: options.offline,
        };

        const output = formatter.generate(playbookInput, {
          projectName: manifest.projectName || path.basename(projectPath),
          projectType: 'general',
        });

        // Step 6: Write output
        fs.writeFileSync(playbookPath, output.markdown, 'utf-8');

        spinner.succeed('Context Guardian initialized successfully!');
        logger.success(`Playbook created: ${playbookPath}`);
        logger.info(`  ${output.metadata.ruleCount} rules | ${output.metadata.criticalCount} critical | ${output.metadata.securityCount} security`);
        logger.info('');
        logger.info('Next steps:');
        logger.info('  1. Review the .guardian.md file');
        logger.info('  2. Your AI assistant will automatically use this context');
        logger.info('  3. Run "guardian sync" to update when dependencies change');

      } catch (error) {
        spinner.fail('Initialization failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}
