/**
 * Progress Indicators and Interactive Elements
 * Provides spinners, progress bars, and interactive prompts
 */

import { colors, spinners, progressBar } from './colors.js';
import { createInterface } from 'readline';
import { resolve } from 'path';

// Simple spinner for async operations
export class Spinner {
  private interval: NodeJS.Timeout | null = null;
  private index = 0;
  private isRunning = false;

  constructor(
    private text: string,
    private color = colors.info
  ) {}

  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.interval = setInterval(() => {
      process.stdout.write(`\r${this.color(spinners[this.index])} ${this.text}`);
      this.index = (this.index + 1) % spinners.length;
    }, 100);
  }

  stop(finalText?: string): void {
    if (!this.isRunning) return;

    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    this.isRunning = false;
    const output = finalText || this.text;
    process.stdout.write(`\r${colors.success('✓')} ${output}\n`);
  }

  updateText(text: string): void {
    this.text = text;
  }

  updateColor(color: typeof colors.primary): void {
    this.color = color;
  }
}

// Progress bar for multi-step operations
export class ProgressBar {
  private total: number;
  private current = 0;
  private width: number;
  private prefix: string;

  constructor(total: number, width = 50, prefix = 'Progress') {
    this.total = total;
    this.width = width;
    this.prefix = prefix;
  }

  update(current: number, text?: string): void {
    this.current = current;
    const percentage = Math.min(100, Math.round((current / this.total) * 100));
    const filled = Math.round((percentage / 100) * this.width);
    const empty = this.width - filled;

    const bar = colors.success(progressBar.complete.repeat(filled)) +
                  colors.textDim(progressBar.incomplete.repeat(empty));

    const output = `${progressBar.left}${bar}${progressBar.right} ${percentage}%`;

    if (text) {
      process.stdout.write(`\r${colors.info(this.prefix)}: ${output} - ${text}`);
    } else {
      process.stdout.write(`\r${colors.info(this.prefix)}: ${output}`);
    }
  }

  complete(finalText?: string): void {
    this.update(this.total, finalText || 'Complete');
    process.stdout.write('\n');
  }
}

// Interactive prompt for user input
export async function promptInput(question: string, defaultValue?: string): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const suffix = defaultValue ? ` (${defaultValue})` : '';
    rl.question(`${colors.primary('?')} ${question}${suffix}: `, (answer) => {
      rl.close();
      resolve(answer || defaultValue || '');
    });
  });
}

// Interactive confirmation prompt
export async function promptConfirm(question: string, defaultValue = false): Promise<boolean> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    const defaultText = defaultValue ? 'Y/n' : 'y/N';
    rl.question(`${colors.warning('?')} ${question} (${defaultText}): `, (answer) => {
      rl.close();

      const response = answer.toLowerCase().trim();
      if (response === '') {
        resolve(defaultValue);
      } else if (response === 'y' || response === 'yes') {
        resolve(true);
      } else if (response === 'n' || response === 'no') {
        resolve(false);
      } else {
        // Invalid input, ask again
        console.log(colors.error('Please enter y/yes or n/no'));
        resolve(promptConfirm(question, defaultValue));
      }
    });
  });
}

// Interactive selection from list
export async function promptSelect(
  question: string,
  options: string[],
  selectedIndex = 0
): Promise<string> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let currentIndex = selectedIndex;

    const display = () => {
      // Clear screen and show options
      console.clear();
      console.log(colors.primary(`🔧 ${question}`));
      console.log(colors.textDim('Use ↑↓ to select, Enter to confirm, Esc to cancel\n'));

      options.forEach((option, index) => {
        const prefix = index === currentIndex ? colors.primary('▸') : ' ';
        const text = index === currentIndex ? colors.primary(option) : colors.text(option);
        console.log(`${prefix} ${text}`);
      });
    };

    // Initial display
    display();

    // Handle keyboard input
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (key: string) => {
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
export async function promptMultiSelect(
  question: string,
  options: string[],
  preSelected: number[] = []
): Promise<string[]> {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });

    let selected = new Set(preSelected);
    let currentIndex = 0;

    const display = () => {
      console.clear();
      console.log(colors.primary(`🔧 ${question}`));
      console.log(colors.textDim('Use ↑↓ to navigate, Space to toggle, Enter to confirm, Esc to cancel\n'));

      options.forEach((option, index) => {
        const isSelected = selected.has(index);
        const prefix = index === currentIndex ? colors.primary('▸') : ' ';
        const checkbox = isSelected ? colors.success('☑') : colors.textDim('☐');
        const text = index === currentIndex ? colors.primary(option) : colors.text(option);
        console.log(`${prefix} ${checkbox} ${text}`);
      });

      const selectedCount = selected.size;
      console.log(colors.info(`\nSelected: ${selectedCount} option${selectedCount !== 1 ? 's' : ''}`));
    };

    display();

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    const onData = (key: string) => {
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
          } else {
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
export function showStatus(status: string, message: string): void {
  const statusMap = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info,
    loading: colors.info,
  };

  const color = statusMap[status as keyof typeof statusMap] || colors.text;
  console.log(`${color('●')} ${message}`);
}

// Step indicator for multi-step processes
export class StepIndicator {
  private steps: string[];
  private current = 0;

  constructor(steps: string[]) {
    this.steps = steps;
  }

  update(step: number, message?: string): void {
    this.current = step;

    const output = this.steps.map((stepText, index) => {
      if (index < step) {
        return colors.success(`✓ ${stepText}`);
      } else if (index === step) {
        return colors.info(`→ ${stepText}`) + (message ? colors.textDim(` (${message})`) : '');
      } else {
        return colors.textDim(`○ ${stepText}`);
      }
    }).join('\n');

    if (message) {
      process.stdout.write(`\r${output}`);
    } else {
      console.log(output);
    }
  }

  complete(): void {
    this.update(this.steps.length);
    console.log(colors.success('\n🎉 All steps completed successfully!'));
  }
}

// Utility function to show timed operations
export async function withSpinner<T>(
  text: string,
  operation: () => Promise<T>,
  color = colors.info
): Promise<T> {
  const spinner = new Spinner(text, color);
  spinner.start();

  try {
    const result = await operation();
    spinner.stop();
    return result;
  } catch (error) {
    spinner.updateColor(colors.error);
    spinner.stop('Operation failed');
    throw error;
  }
}

// Utility function for progress tracking
export async function withProgress<T>(
  text: string,
  total: number,
  operation: (update: (current: number) => void) => Promise<T>
): Promise<T> {
  const progressBar = new ProgressBar(total, 50, text);

  try {
    const result = await operation((current) => {
      progressBar.update(current);
    });
    progressBar.complete();
    return result;
  } catch (error) {
    progressBar.update(1, 'Completed');
    throw error;
  }
}

export default {
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