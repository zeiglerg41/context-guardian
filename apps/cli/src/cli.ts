#!/usr/bin/env node

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './utils/logger';
import { createInitCommand } from './commands/init';
import { createSyncCommand } from './commands/sync';
import { createValidateCommand } from './commands/validate';

const pkgVersion: string = (() => {
  try { return JSON.parse(fs.readFileSync(path.resolve(__dirname, '..', 'package.json'), 'utf-8')).version; }
  catch { return '0.1.0'; }
})();

/**
 * Main CLI entry point
 */
async function main() {
  const program = new Command();
  const logger = new Logger();

  program
    .name('guardian')
    .description('Context Guardian - AI coding guardrails for your projects')
    .version(pkgVersion);

  // Register commands
  program.addCommand(createInitCommand(logger));
  program.addCommand(createSyncCommand(logger));
  program.addCommand(createValidateCommand(logger));

  // Parse arguments
  await program.parseAsync(process.argv);
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
