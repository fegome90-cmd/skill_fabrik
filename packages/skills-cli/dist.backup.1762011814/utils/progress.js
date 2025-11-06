"use strict";
/**
 * Progress Indicators and Interactive Elements
 * Provides spinners, progress bars, and interactive prompts
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepIndicator = exports.ProgressBar = exports.Spinner = void 0;
exports.promptInput = promptInput;
exports.promptConfirm = promptConfirm;
exports.promptSelect = promptSelect;
exports.promptMultiSelect = promptMultiSelect;
exports.showStatus = showStatus;
exports.withSpinner = withSpinner;
exports.withProgress = withProgress;
const colors_js_1 = require("./colors.js");
const readline_1 = require("readline");
// Simple spinner for async operations
class Spinner {
    constructor(text, color = colors_js_1.colors.info) {
        this.text = text;
        this.color = color;
        this.interval = null;
        this.index = 0;
        this.isRunning = false;
    }
    start() {
        if (this.isRunning)
            return;
        this.isRunning = true;
        this.interval = setInterval(() => {
            process.stdout.write(`\r${this.color(colors_js_1.spinners[this.index])} ${this.text}`);
            this.index = (this.index + 1) % colors_js_1.spinners.length;
        }, 100);
    }
    stop(finalText) {
        if (!this.isRunning)
            return;
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
        this.isRunning = false;
        const output = finalText || this.text;
        process.stdout.write(`\r${colors_js_1.colors.success('✓')} ${output}\n`);
    }
    updateText(text) {
        this.text = text;
    }
    updateColor(color) {
        this.color = color;
    }
}
exports.Spinner = Spinner;
// Progress bar for multi-step operations
class ProgressBar {
    constructor(total, width = 50, prefix = 'Progress') {
        this.current = 0;
        this.total = total;
        this.width = width;
        this.prefix = prefix;
    }
    update(current, text) {
        this.current = current;
        const percentage = Math.min(100, Math.round((current / this.total) * 100));
        const filled = Math.round((percentage / 100) * this.width);
        const empty = this.width - filled;
        const bar = colors_js_1.colors.success(colors_js_1.progressBar.complete.repeat(filled)) +
            colors_js_1.colors.textDim(colors_js_1.progressBar.incomplete.repeat(empty));
        const output = `${colors_js_1.progressBar.left}${bar}${colors_js_1.progressBar.right} ${percentage}%`;
        if (text) {
            process.stdout.write(`\r${colors_js_1.colors.info(this.prefix)}: ${output} - ${text}`);
        }
        else {
            process.stdout.write(`\r${colors_js_1.colors.info(this.prefix)}: ${output}`);
        }
    }
    complete(finalText) {
        this.update(this.total, finalText || 'Complete');
        process.stdout.write('\n');
    }
}
exports.ProgressBar = ProgressBar;
// Interactive prompt for user input
async function promptInput(question, defaultValue) {
    return new Promise((resolve) => {
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout
        });
        const suffix = defaultValue ? ` (${defaultValue})` : '';
        rl.question(`${colors_js_1.colors.primary('?')} ${question}${suffix}: `, (answer) => {
            rl.close();
            resolve(answer || defaultValue || '');
        });
    });
}
// Interactive confirmation prompt
async function promptConfirm(question, defaultValue = false) {
    return new Promise((resolve) => {
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout
        });
        const defaultText = defaultValue ? 'Y/n' : 'y/N';
        rl.question(`${colors_js_1.colors.warning('?')} ${question} (${defaultText}): `, (answer) => {
            rl.close();
            const response = answer.toLowerCase().trim();
            if (response === '') {
                resolve(defaultValue);
            }
            else if (response === 'y' || response === 'yes') {
                resolve(true);
            }
            else if (response === 'n' || response === 'no') {
                resolve(false);
            }
            else {
                // Invalid input, ask again
                console.log(colors_js_1.colors.error('Please enter y/yes or n/no'));
                resolve(promptConfirm(question, defaultValue));
            }
        });
    });
}
// Interactive selection from list
async function promptSelect(question, options, selectedIndex = 0) {
    return new Promise((resolve) => {
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout
        });
        let currentIndex = selectedIndex;
        const display = () => {
            // Clear screen and show options
            console.clear();
            console.log(colors_js_1.colors.primary(`🔧 ${question}`));
            console.log(colors_js_1.colors.textDim('Use ↑↓ to select, Enter to confirm, Esc to cancel\n'));
            options.forEach((option, index) => {
                const prefix = index === currentIndex ? colors_js_1.colors.primary('▸') : ' ';
                const text = index === currentIndex ? colors_js_1.colors.primary(option) : colors_js_1.colors.text(option);
                console.log(`${prefix} ${text}`);
            });
        };
        // Initial display
        display();
        // Handle keyboard input
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        const onData = (key) => {
            switch (key) {
                case '\u001b[A': // Up arrow
                    currentIndex = Math.max(0, currentIndex - 1);
                    display();
                    break;
                case '\u001b[B': // Down arrow
                    currentIndex = Math.min(options.length - 1, currentIndex + 1);
                    display();
                    break;
                case '\r': // Enter
                case '\n':
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.removeListener('data', onData);
                    rl.close();
                    resolve(options[currentIndex]);
                    break;
                case '\u001b': // Escape
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.removeListener('data', onData);
                    rl.close();
                    resolve('');
                    break;
            }
        };
        process.stdin.on('data', onData);
    });
}
// Multi-select from list
async function promptMultiSelect(question, options, preSelected = []) {
    return new Promise((resolve) => {
        const rl = (0, readline_1.createInterface)({
            input: process.stdin,
            output: process.stdout
        });
        let selected = new Set(preSelected);
        let currentIndex = 0;
        const display = () => {
            console.clear();
            console.log(colors_js_1.colors.primary(`🔧 ${question}`));
            console.log(colors_js_1.colors.textDim('Use ↑↓ to navigate, Space to toggle, Enter to confirm, Esc to cancel\n'));
            options.forEach((option, index) => {
                const isSelected = selected.has(index);
                const prefix = index === currentIndex ? colors_js_1.colors.primary('▸') : ' ';
                const checkbox = isSelected ? colors_js_1.colors.success('☑') : colors_js_1.colors.textDim('☐');
                const text = index === currentIndex ? colors_js_1.colors.primary(option) : colors_js_1.colors.text(option);
                console.log(`${prefix} ${checkbox} ${text}`);
            });
            const selectedCount = selected.size;
            console.log(colors_js_1.colors.info(`\nSelected: ${selectedCount} option${selectedCount !== 1 ? 's' : ''}`));
        };
        display();
        process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.setEncoding('utf8');
        const onData = (key) => {
            switch (key) {
                case '\u001b[A': // Up arrow
                    currentIndex = Math.max(0, currentIndex - 1);
                    display();
                    break;
                case '\u001b[B': // Down arrow
                    currentIndex = Math.min(options.length - 1, currentIndex + 1);
                    display();
                    break;
                case ' ': // Space
                    if (selected.has(currentIndex)) {
                        selected.delete(currentIndex);
                    }
                    else {
                        selected.add(currentIndex);
                    }
                    display();
                    break;
                case '\r': // Enter
                case '\n':
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.removeListener('data', onData);
                    rl.close();
                    resolve(Array.from(selected).map(i => options[i]));
                    break;
                case '\u001b': // Escape
                    process.stdin.setRawMode(false);
                    process.stdin.pause();
                    process.stdin.removeListener('data', onData);
                    rl.close();
                    resolve(preSelected.map(i => options[i]));
                    break;
            }
        };
        process.stdin.on('data', onData);
    });
}
// Status indicator with color coding
function showStatus(status, message) {
    const statusMap = {
        success: colors_js_1.colors.success,
        warning: colors_js_1.colors.warning,
        error: colors_js_1.colors.error,
        info: colors_js_1.colors.info,
        loading: colors_js_1.colors.info,
    };
    const color = statusMap[status] || colors_js_1.colors.text;
    console.log(`${color('●')} ${message}`);
}
// Step indicator for multi-step processes
class StepIndicator {
    constructor(steps) {
        this.current = 0;
        this.steps = steps;
    }
    update(step, message) {
        this.current = step;
        const output = this.steps.map((stepText, index) => {
            if (index < step) {
                return colors_js_1.colors.success(`✓ ${stepText}`);
            }
            else if (index === step) {
                return colors_js_1.colors.info(`→ ${stepText}`) + (message ? colors_js_1.colors.textDim(` (${message})`) : '');
            }
            else {
                return colors_js_1.colors.textDim(`○ ${stepText}`);
            }
        }).join('\n');
        if (message) {
            process.stdout.write(`\r${output}`);
        }
        else {
            console.log(output);
        }
    }
    complete() {
        this.update(this.steps.length);
        console.log(colors_js_1.colors.success('\n🎉 All steps completed successfully!'));
    }
}
exports.StepIndicator = StepIndicator;
// Utility function to show timed operations
async function withSpinner(text, operation, color = colors_js_1.colors.info) {
    const spinner = new Spinner(text, color);
    spinner.start();
    try {
        const result = await operation();
        spinner.stop();
        return result;
    }
    catch (error) {
        spinner.updateColor(colors_js_1.colors.error);
        spinner.stop('Operation failed');
        throw error;
    }
}
// Utility function for progress tracking
async function withProgress(text, total, operation) {
    const progressBar = new ProgressBar(total, 50, text);
    try {
        const result = await operation((current) => {
            progressBar.update(current);
        });
        progressBar.complete();
        return result;
    }
    catch (error) {
        progressBar.update(1, 'Completed');
        throw error;
    }
}
exports.default = {
    Spinner,
    ProgressBar,
    promptInput,
    promptConfirm,
    promptSelect,
    promptMultiSelect,
    showStatus,
    StepIndicator,
    withSpinner,
    withProgress,
};
