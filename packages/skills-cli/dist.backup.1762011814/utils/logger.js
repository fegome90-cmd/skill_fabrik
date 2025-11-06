import chalk from 'chalk';
export class Logger {
    verbose;
    constructor(verbose = false) {
        this.verbose = verbose;
    }
    info(message) {
        console.log(chalk.blue('ℹ'), message);
    }
    success(message) {
        console.log(chalk.green('✅'), message);
    }
    error(message) {
        console.error(chalk.red('❌'), message);
    }
    warning(message) {
        console.warn(chalk.yellow('⚠️'), message);
    }
    debug(message) {
        if (this.verbose) {
            console.log(chalk.gray('🔍'), message);
        }
    }
}
//# sourceMappingURL=logger.js.map