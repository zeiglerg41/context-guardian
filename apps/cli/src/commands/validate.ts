import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ValidateOptions } from '../types';

/**
 * Validate command: Checks if .guardian.md is up-to-date
 */
export function createValidateCommand(logger: Logger): Command {
  const command = new Command('validate');

  command
    .description('Validate that the playbook is up-to-date')
    .option('--strict', 'Exit with error if playbook is outdated')
    .action(async (options: ValidateOptions) => {
      try {
        const projectPath = process.cwd();
        const playbookPath = path.join(projectPath, '.guardian.md');

        // Check if .guardian.md exists
        if (!fs.existsSync(playbookPath)) {
          logger.error('.guardian.md not found. Run "guardian init" first.');
          process.exit(1);
        }

        logger.info('Validating playbook...');

        // TODO: Compare current dependencies with playbook metadata
        // TODO: Check if any dependencies have changed
        logger.debug('Validation logic will be implemented');

        // For now, just check if file exists and is readable
        const stats = fs.statSync(playbookPath);
        const age = Date.now() - stats.mtimeMs;
        const ageInDays = Math.floor(age / (1000 * 60 * 60 * 24));

        logger.success('✓ Playbook exists');
        logger.info(`  Last updated: ${ageInDays} day(s) ago`);

        if (ageInDays > 7) {
          logger.warn('  Playbook is older than 7 days. Consider running "guardian sync".');
          if (options.strict) {
            process.exit(1);
          }
        } else {
          logger.success('✓ Playbook is up-to-date');
        }

      } catch (error) {
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}
