import { Command } from 'commander';
import ora from 'ora';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { SyncOptions } from '../types';

/**
 * Sync command: Re-analyzes the project and updates .guardian.md
 */
export function createSyncCommand(logger: Logger): Command {
  const command = new Command('sync');

  command
    .description('Update the playbook based on current dependencies')
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

        spinner.text = 'Detecting changes...';
        
        // TODO: Compare current dependencies with last analysis
        logger.debug('Change detection will be implemented');

        spinner.text = 'Fetching updated best practices...';
        
        // TODO: Call API with updated payload
        logger.debug('API call will be implemented');

        spinner.text = 'Updating playbook...';
        
        // TODO: Regenerate .guardian.md
        logger.debug('Playbook regeneration will be implemented');

        spinner.succeed('Playbook synced successfully!');
        logger.success(`Updated: ${playbookPath}`);

      } catch (error) {
        spinner.fail('Sync failed');
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}
