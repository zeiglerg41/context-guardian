import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ApiClient } from '../utils/api-client';
import { PlaybookGenerator } from '../utils/playbook-generator';
import { InitOptions } from '../types';

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

        spinner.text = 'Detecting package manager...';
        
        // TODO: Import and use dependency parser module
        // For now, this is a placeholder that will be implemented when integrating modules
        logger.debug('Package manager detection will be implemented');

        spinner.text = 'Analyzing dependencies...';
        
        // TODO: Parse dependencies and create analysis payload
        logger.debug('Dependency parsing will be implemented');

        spinner.text = 'Fetching best practices from API...';
        
        // TODO: Call API with analysis payload
        // For now, create a mock response
        const mockResponse = {
          rules: [
            {
              type: 'best_practice' as const,
              title: 'Example Best Practice',
              description: 'This is a placeholder. Real rules will come from the API.',
              category: 'best-practice',
              severity: 'medium' as const,
              code_example: '// Example code here',
              source_url: 'https://example.com',
            },
          ],
          generatedAt: new Date().toISOString(),
        };

        spinner.text = 'Generating playbook...';
        
        const generator = new PlaybookGenerator();
        const generatedPath = generator.generate(mockResponse, projectPath);

        spinner.succeed('Context Guardian initialized successfully!');
        logger.success(`Playbook created: ${generatedPath}`);
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
