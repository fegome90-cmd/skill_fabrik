import chalk from 'chalk';

export class Logger {
  private verbose: boolean;

  constructor(verbose = false) {
    this.verbose = verbose;
  }

  info(message: string) {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string) {
    console.log(chalk.green('✅'), message);
  }

  error(message: string) {
    console.error(chalk.red('❌'), message);
  }

  warning(message: string) {
    console.warn(chalk.yellow('⚠️'), message);
  }

  debug(message: string) {
    if (this.verbose) {
      console.log(chalk.gray('🔍'), message);
    }
  }
}
