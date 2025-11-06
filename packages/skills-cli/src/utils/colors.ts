/**
 * Professional CLI Color System
 * Consistent color palette with semantic meaning and accessibility
 */

import chalk from 'chalk';
import * as originalChalk from 'chalk';

// Semantic color definitions
export const colors = {
  // Primary colors - main branding
  primary: chalk.hex('#3B82F6'),      // Blue 500
  primaryLight: chalk.hex('#60A5FA'),  // Blue 400
  primaryDark: chalk.hex('#1E40AF'),   // Blue 800

  // Success colors
  success: chalk.hex('#10B981'),      // Green 500
  successLight: chalk.hex('#34D399'),  // Green 400
  successBg: chalk.hex('#065F46'),    // Green 900

  // Warning colors
  warning: chalk.hex('#F59E0B'),      // Amber 500
  warningLight: chalk.hex('#FCD34D'), // Amber 400
  warningBg: chalk.hex('#92400E'),    // Amber 900

  // Error colors
  error: chalk.hex('#EF4444'),        // Red 500
  errorLight: chalk.hex('#F87171'),  // Red 400
  errorBg: chalk.hex('#991B1B'),      // Red 900

  // Info colors
  info: chalk.hex('#6366F1'),         // Indigo 500
  infoLight: chalk.hex('#818CF8'),    // Indigo 400
  infoBg: chalk.hex('#312E81'),       // Indigo 900

  // Neutral colors
  text: chalk.hex('#F9FAFB'),        // Gray 50
  textMuted: chalk.hex('#9CA3AF'),   // Gray 400
  textDim: chalk.hex('#6B7280'),      // Gray 500
  border: chalk.hex('#374151'),      // Gray 700
  background: chalk.hex('#111827'),   // Gray 900
} as const;

// Status indicators
export const status = {
  healthy: colors.success,
  degraded: colors.warning,
  error: colors.error,
  unknown: colors.textMuted,
  loading: colors.info,
} as const;

// Priority levels
export const priority = {
  critical: colors.error,
  high: colors.warning,
  medium: colors.info,
  low: colors.textMuted,
} as const;

// Interactive elements
export const interactive = {
  selected: colors.primaryLight,
  active: colors.primary,
  disabled: colors.textDim,
  hover: colors.primaryLight,
} as const;

// Progress indicators
export const progress = {
  complete: colors.success,
  incomplete: colors.textDim,
  inProgress: colors.warning,
  failed: colors.error,
} as const;

// Utility functions for consistent formatting
export const format = {
  // Headers
  header: (text: string) => colors.primary.bold(`🔧 ${text}`),
  section: (text: string) => colors.info.bold(`📋 ${text}`),
  success: (text: string) => colors.success.bold(`✅ ${text}`),
  warning: (text: string) => colors.warning.bold(`⚠️  ${text}`),
  error: (text: string) => colors.error.bold(`❌ ${text}`),
  info: (text: string) => colors.info.bold(`ℹ️  ${text}`),

  // Indicators
  status: (status: string, color = colors.text) => color(`● ${status}`),
  bullet: (text: string, color?: any) => (color || colors.textDim)(`• ${text}`),
  arrow: (text: string) => colors.primaryLight(`→ ${text}`),

  // Command formatting
  command: (text: string) => colors.primaryLight(text),
  option: (text: string) => colors.info(text),
  flag: (text: string) => colors.textMuted(text),

  // Data formatting
  number: (num: number) => colors.primary(num.toString()),
  percentage: (num: number) => colors.info(`${num}%`),
  time: (ms: number) => colors.textDim(`${ms}ms`),

  // Navigation
  breadcrumb: (path: string) => colors.textDim(path),
  activeBreadcrumb: (path: string) => colors.primary(path),

  // Table formatting
  headerCell: (text: string) => colors.primary.bold(text),
  cell: (text: string) => colors.text(text),
  highlightCell: (text: string) => colors.warning.bold(text),
} as const;

// Spinner characters for loading indicators
export const spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'] as const;

// Progress bar characters
export const progressBar = {
  complete: '█',
  incomplete: '░',
  left: '[',
  right: ']',
} as const;

// Box drawing characters for UI elements
export const box = {
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',
  leftTee: '├',
  rightTee: '┤',
  topTee: '┬',
  bottomTee: '┴',
  cross: '┼',
} as const;

// Utility function to create colored boxes
export function createBox(
  content: string,
  title?: string,
  borderColor: any = colors.border
): string {
  const lines = content.split('\n');
  const maxLineLength = Math.max(...lines.map(line => line.length), title?.length || 0);
  const borderLine = borderColor(box.horizontal.repeat(maxLineLength + 4));

  let result = borderLine + '\n';

  if (title) {
    const titleLine = borderColor(box.vertical) + ' ' +
      colors.primary.bold(title) +
      ' '.repeat(maxLineLength - title.length + 1) +
      borderColor(box.vertical);
    result += titleLine + '\n' + borderLine + '\n';
  }

  for (const line of lines) {
    const paddedLine = line.padEnd(maxLineLength);
    result += borderColor(box.vertical) + ' ' + colors.text(paddedLine) + ' ' + borderColor(box.vertical) + '\n';
  }

  result += borderLine;
  return result;
}

// Utility function for command help formatting
export function formatCommandHelp(
  command: string,
  description: string,
  examples?: string[]
): string {
  let result = '';

  // Command header
  result += format.header(command) + '\n';
  result += colors.text(description) + '\n\n';

  // Examples
  if (examples && examples.length > 0) {
    result += format.section('Examples') + '\n';
    for (const example of examples) {
      result += colors.primaryLight(`  ${example}`) + '\n';
    }
  }

  return result;
}

// Theme detection and application
export function detectTheme(): 'dark' | 'light' | 'auto' {
  // Simple theme detection - can be enhanced with environment variables
  const processEnv = process.env;

  if (processEnv.FORCE_COLOR === '0') return 'light';
  if (processEnv.FORCE_COLOR === '1') return 'dark';
  if (processEnv.NO_COLOR) return 'light';

  // Default to dark for CLI
  return 'dark';
}

// Color palette for different themes
export const themes = {
  dark: colors, // Current colors are dark-themed
  light: {
    // Light theme would invert the colors
    primary: chalk.hex('#1E40AF'),
    success: chalk.hex('#065F46'),
    warning: chalk.hex('#92400E'),
    error: chalk.hex('#991B1B'),
    info: chalk.hex('#312E81'),
    text: chalk.hex('#111827'),
    textMuted: chalk.hex('#6B7280'),
    textDim: chalk.hex('#9CA3AF'),
    border: chalk.hex('#D1D5DB'),
    background: chalk.hex('#F9FAFB'),
  } as const,
  auto: colors, // Default to dark
} as const;

// Get current theme colors
export function getCurrentTheme() {
  const detectedTheme = detectTheme();
  return themes[detectedTheme];
}

// Backward compatibility aliases for common chalk usage patterns
export const chalkCompat = {
  ...originalChalk,
  // Add commonly used aliases that map to our format functions
  header: format.header,
  command: format.command,
  number: format.number,
} as typeof originalChalk & {
  header: typeof format.header;
  command: typeof format.command;
  number: typeof format.number;
};

export default colors;
// Backward compatibility functions for basic usage
export const simpleFormat = {
  header: (text: string) => colors.primary.bold("🔧 " + text),
  command: (text: string) => colors.primaryLight(text),
  number: (num: number) => colors.primary(num.toString()),
  success: (text: string) => colors.success.bold("✅ " + text),
  warning: (text: string) => colors.warning.bold("⚠️  " + text),
  error: (text: string) => colors.error.bold("❌ " + text),
  info: (text: string) => colors.info.bold("ℹ️  " + text)
};

// Simple createBox that accepts color strings or chalk instances
export function createSimpleBox(
  content: string,
  title?: string,
  borderColorName?: string | any
): string {
  const borderColor = typeof borderColorName === 'string' ? (colors[borderColorName] || colors.border) : borderColorName || colors.border;
  const lines = content.split('\n');
  const maxLineLength = Math.max(...lines.map(line => line.length), title?.length || 0);

  if (typeof box !== 'undefined') {
    const borderLine = borderColor(box.horizontal.repeat(maxLineLength + 4));
    let result = borderLine + '\n';

    if (title) {
      const titleLine = borderColor(box.vertical) + ' ' +
        colors.primary.bold(title) +
        ' '.repeat(maxLineLength - title.length + 1) +
        borderColor(box.vertical);
      result += titleLine + '\n' + borderLine + '\n';
    }

    for (const line of lines) {
      const paddedLine = line.padEnd(maxLineLength);
      result += borderColor(box.vertical) + ' ' + colors.text(paddedLine) + ' ' + borderColor(box.vertical) + '\n';
    }

    result += borderLine;
    return result;
  } else {
    // Fallback simple box
    let result = '';
    if (title) {
      result += colors.primary.bold(title) + '\n';
      result += borderColor('─'.repeat(title.length)) + '\n';
    }
    result += content;
    return result;
  }
}
