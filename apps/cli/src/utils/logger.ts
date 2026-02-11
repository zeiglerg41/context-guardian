import chalk from 'chalk';

/**
 * Simple logger with color-coded output
 */
export class Logger {
  private verbose: boolean;

  constructor(verbose: boolean = false) {
    this.verbose = verbose;
  }

  /**
   * Log an info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Log a success message
   */
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  /**
   * Log a warning message
   */
  warn(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  /**
   * Log an error message
   */
  error(message: string): void {
    console.error(chalk.red('✗'), message);
  }

  /**
   * Log a debug message (only if verbose mode is enabled)
   */
  debug(message: string): void {
    if (this.verbose) {
      console.log(chalk.gray('→'), message);
    }
  }

  /**
   * Log a plain message without prefix
   */
  log(message: string): void {
    console.log(message);
  }
}

/**
 * Default logger instance
 */
export const logger = new Logger();
