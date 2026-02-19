import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ApiClient } from '../utils/api-client';
import { SyncOptions, PlaybookInput, PlaybookInputPatterns } from '../types';
import { analyzeDependencies } from '@context-guardian/dependency-parser';
import { ASTAnalyzer } from '@context-guardian/ast-analyzer';
import { MarkdownFormatter } from '@context-guardian/playbook-generator';

/**
 * Sync command: Re-analyzes the project and updates .guardian.md
 */
export function createSyncCommand(logger: Logger): Command {
  const command = new Command('sync');

  command
    .description('Update the playbook based on current dependencies')
    .option('--offline', 'Use offline mode (bundled SQLite fallback)')
    .option('-v, --verbose', 'Enable verbose logging')
    .action(async (options: SyncOptions) => {
      const spinner = ora('Syncing playbook...').start();

      try {
        const projectPath = process.cwd();
        const playbookPath = path.join(projectPath, '.guardian.md');

        // Check if .guardian.md exists
        if (!fs.existsSync(playbookPath)) {
          spinner.stop();
          logger.error('.guardian.md not found. Run "guardian init" first.');
          process.exit(1);
        }

        // Step 1: Re-analyze dependencies
        spinner.text = 'Analyzing dependencies...';
        const manifest = analyzeDependencies(projectPath);
        if (options.verbose) {
          logger.debug(`Detected ${manifest.packageManager} with ${manifest.dependencies.length} dependencies`);
        }

        // Step 2: Re-analyze project patterns
        spinner.text = 'Analyzing project patterns...';
        const analyzer = new ASTAnalyzer();
        const patterns = await analyzer.analyzeProject({
          rootDir: projectPath,
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
          excludeDirs: ['node_modules', 'dist', 'build', '.git', 'coverage'],
          maxFiles: 200,
        });

        // Step 3: Fetch rules
        let rules;
        const isOffline = !!options.offline;
        if (isOffline) {
          spinner.text = 'Querying offline database...';
          const { OfflineClient } = require('@context-guardian/offline-fallback');
          const dbPath = path.join(__dirname, '../../data/offline.db');
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
          spinner.text = 'Fetching updated best practices...';
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

        // Step 4: Wrap patterns for template
        const templatePatterns: PlaybookInputPatterns = {
          stateManagement: patterns.stateManagement ? [patterns.stateManagement] : undefined,
          componentStyle: patterns.componentStyle as PlaybookInputPatterns['componentStyle'],
          frameworks: patterns.frameworks.length > 0 ? patterns.frameworks : undefined,
        };

        // Step 5: Regenerate playbook
        spinner.text = 'Updating playbook...';
        const formatter = new MarkdownFormatter();
        const playbookInput: PlaybookInput = {
          dependencies: manifest.dependencies,
          patterns: templatePatterns,
          rules,
          generatedAt: new Date().toISOString(),
          offline: isOffline,
        };

        const output = formatter.generate(playbookInput, {
          projectName: manifest.projectName || path.basename(projectPath),
          projectType: 'general',
        });

        // Step 6: Write updated playbook
        fs.writeFileSync(playbookPath, output.markdown, 'utf-8');

        spinner.succeed('Playbook synced successfully!');
        logger.success(`Updated: ${playbookPath}`);
        logger.info(`  ${output.metadata.ruleCount} rules | ${output.metadata.criticalCount} critical | ${output.metadata.securityCount} security`);

      } catch (error) {
        spinner.fail('Sync failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}
