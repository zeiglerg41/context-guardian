import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from '../utils/logger';
import { ValidateOptions } from '../types';
import { analyzeDependencies } from '@context-guardian/dependency-parser';

/**
 * Validate command: Checks if .guardian.md is up-to-date
 * by comparing current dependencies against the playbook metadata.
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

        const content = fs.readFileSync(playbookPath, 'utf-8');
        const stats = fs.statSync(playbookPath);
        const ageInDays = Math.floor((Date.now() - stats.mtimeMs) / (1000 * 60 * 60 * 24));
        let issues = 0;

        // 1. Check file age
        logger.success('✓ Playbook exists');
        logger.info(`  Last updated: ${ageInDays} day(s) ago`);

        if (ageInDays > 7) {
          logger.warn('  ⚠ Playbook is older than 7 days');
          issues++;
        }

        // 2. Compare current dependencies against playbook
        try {
          const manifest = analyzeDependencies(projectPath);
          const currentDeps = manifest.dependencies
            .filter(d => !d.isDev && !d.isPeer && !d.isOptional)
            .map(d => d.name)
            .sort();

          // Extract dependency names mentioned in the playbook
          const playbookDeps = extractPlaybookDeps(content);

          // Find deps that are in the project but not in the playbook
          const missingFromPlaybook = currentDeps.filter(d => !playbookDeps.has(d));

          // Find deps in the playbook that are no longer in the project
          const removedFromProject = Array.from(playbookDeps).filter(d => !currentDeps.includes(d));

          if (missingFromPlaybook.length > 0) {
            logger.warn(`  ⚠ ${missingFromPlaybook.length} new dependencies not in playbook:`);
            for (const dep of missingFromPlaybook.slice(0, 5)) {
              logger.warn(`    - ${dep}`);
            }
            if (missingFromPlaybook.length > 5) {
              logger.warn(`    ... and ${missingFromPlaybook.length - 5} more`);
            }
            issues++;
          }

          if (removedFromProject.length > 0) {
            logger.warn(`  ⚠ ${removedFromProject.length} playbook dependencies no longer in project:`);
            for (const dep of removedFromProject.slice(0, 5)) {
              logger.warn(`    - ${dep}`);
            }
            issues++;
          }

          if (missingFromPlaybook.length === 0 && removedFromProject.length === 0) {
            logger.success('✓ Dependencies match playbook');
          }
        } catch {
          // No package manager found — skip dep comparison
          logger.debug('  Could not detect package manager, skipping dependency comparison');
        }

        // 3. Summary
        if (issues === 0) {
          logger.success('✓ Playbook is up-to-date');
        } else {
          logger.warn(`\n${issues} issue(s) found. Consider running "guardian sync".`);
          if (options.strict) {
            process.exit(1);
          }
        }

      } catch (error) {
        logger.error(error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }
    });

  return command;
}

/**
 * Extracts dependency names referenced in the playbook.
 * Looks for package names in headers and rule sections.
 */
function extractPlaybookDeps(content: string): Set<string> {
  const deps = new Set<string>();

  // Match markdown headers with package names: "## react", "### express"
  const headerMatches = content.matchAll(/^#{2,4}\s+([a-z@][a-z0-9./_-]*)/gm);
  for (const match of headerMatches) {
    deps.add(match[1]);
  }

  // Match "**Library**: react" or "**Package**: express" patterns
  const libMatches = content.matchAll(/\*\*(?:Library|Package)\*\*:\s*([a-z@][a-z0-9./_-]*)/gi);
  for (const match of libMatches) {
    deps.add(match[1].toLowerCase());
  }

  return deps;
}
