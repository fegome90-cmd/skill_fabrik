"use strict";
/**
 * Professional CLI Color System
 * Consistent color palette with semantic meaning and accessibility
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.simpleFormat = exports.chalkCompat = exports.themes = exports.box = exports.progressBar = exports.spinners = exports.format = exports.progress = exports.interactive = exports.priority = exports.status = exports.colors = void 0;
exports.createBox = createBox;
exports.formatCommandHelp = formatCommandHelp;
exports.detectTheme = detectTheme;
exports.getCurrentTheme = getCurrentTheme;
exports.createSimpleBox = createSimpleBox;
const chalk_1 = __importDefault(require("chalk"));
const originalChalk = __importStar(require("chalk"));
// Semantic color definitions
exports.colors = {
    // Primary colors - main branding
    primary: chalk_1.default.hex('#3B82F6'), // Blue 500
    primaryLight: chalk_1.default.hex('#60A5FA'), // Blue 400
    primaryDark: chalk_1.default.hex('#1E40AF'), // Blue 800
    // Success colors
    success: chalk_1.default.hex('#10B981'), // Green 500
    successLight: chalk_1.default.hex('#34D399'), // Green 400
    successBg: chalk_1.default.hex('#065F46'), // Green 900
    // Warning colors
    warning: chalk_1.default.hex('#F59E0B'), // Amber 500
    warningLight: chalk_1.default.hex('#FCD34D'), // Amber 400
    warningBg: chalk_1.default.hex('#92400E'), // Amber 900
    // Error colors
    error: chalk_1.default.hex('#EF4444'), // Red 500
    errorLight: chalk_1.default.hex('#F87171'), // Red 400
    errorBg: chalk_1.default.hex('#991B1B'), // Red 900
    // Info colors
    info: chalk_1.default.hex('#6366F1'), // Indigo 500
    infoLight: chalk_1.default.hex('#818CF8'), // Indigo 400
    infoBg: chalk_1.default.hex('#312E81'), // Indigo 900
    // Neutral colors
    text: chalk_1.default.hex('#F9FAFB'), // Gray 50
    textMuted: chalk_1.default.hex('#9CA3AF'), // Gray 400
    textDim: chalk_1.default.hex('#6B7280'), // Gray 500
    border: chalk_1.default.hex('#374151'), // Gray 700
    background: chalk_1.default.hex('#111827'), // Gray 900
};
// Status indicators
exports.status = {
    healthy: exports.colors.success,
    degraded: exports.colors.warning,
    error: exports.colors.error,
    unknown: exports.colors.textMuted,
    loading: exports.colors.info,
};
// Priority levels
exports.priority = {
    critical: exports.colors.error,
    high: exports.colors.warning,
    medium: exports.colors.info,
    low: exports.colors.textMuted,
};
// Interactive elements
exports.interactive = {
    selected: exports.colors.primaryLight,
    active: exports.colors.primary,
    disabled: exports.colors.textDim,
    hover: exports.colors.primaryLight,
};
// Progress indicators
exports.progress = {
    complete: exports.colors.success,
    incomplete: exports.colors.textDim,
    inProgress: exports.colors.warning,
    failed: exports.colors.error,
};
// Utility functions for consistent formatting
exports.format = {
    // Headers
    header: (text) => exports.colors.primary.bold(`🔧 ${text}`),
    section: (text) => exports.colors.info.bold(`📋 ${text}`),
    success: (text) => exports.colors.success.bold(`✅ ${text}`),
    warning: (text) => exports.colors.warning.bold(`⚠️  ${text}`),
    error: (text) => exports.colors.error.bold(`❌ ${text}`),
    info: (text) => exports.colors.info.bold(`ℹ️  ${text}`),
    // Indicators
    status: (status, color = exports.colors.text) => color(`● ${status}`),
    bullet: (text, color) => (color || exports.colors.textDim)(`• ${text}`),
    arrow: (text) => exports.colors.primaryLight(`→ ${text}`),
    // Command formatting
    command: (text) => exports.colors.primaryLight(text),
    option: (text) => exports.colors.info(text),
    flag: (text) => exports.colors.textMuted(text),
    // Data formatting
    number: (num) => exports.colors.primary(num.toString()),
    percentage: (num) => exports.colors.info(`${num}%`),
    time: (ms) => exports.colors.textDim(`${ms}ms`),
    // Navigation
    breadcrumb: (path) => exports.colors.textDim(path),
    activeBreadcrumb: (path) => exports.colors.primary(path),
    // Table formatting
    headerCell: (text) => exports.colors.primary.bold(text),
    cell: (text) => exports.colors.text(text),
    highlightCell: (text) => exports.colors.warning.bold(text),
};
// Spinner characters for loading indicators
exports.spinners = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
// Progress bar characters
exports.progressBar = {
    complete: '█',
    incomplete: '░',
    left: '[',
    right: ']',
};
// Box drawing characters for UI elements
exports.box = {
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
};
// Utility function to create colored boxes
function createBox(content, title, borderColor = exports.colors.border) {
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length), title?.length || 0);
    const borderLine = borderColor(exports.box.horizontal.repeat(maxLineLength + 4));
    let result = borderLine + '\n';
    if (title) {
        const titleLine = borderColor(exports.box.vertical) + ' ' +
            exports.colors.primary.bold(title) +
            ' '.repeat(maxLineLength - title.length + 1) +
            borderColor(exports.box.vertical);
        result += titleLine + '\n' + borderLine + '\n';
    }
    for (const line of lines) {
        const paddedLine = line.padEnd(maxLineLength);
        result += borderColor(exports.box.vertical) + ' ' + exports.colors.text(paddedLine) + ' ' + borderColor(exports.box.vertical) + '\n';
    }
    result += borderLine;
    return result;
}
// Utility function for command help formatting
function formatCommandHelp(command, description, examples) {
    let result = '';
    // Command header
    result += exports.format.header(command) + '\n';
    result += exports.colors.text(description) + '\n\n';
    // Examples
    if (examples && examples.length > 0) {
        result += exports.format.section('Examples') + '\n';
        for (const example of examples) {
            result += exports.colors.primaryLight(`  ${example}`) + '\n';
        }
    }
    return result;
}
// Theme detection and application
function detectTheme() {
    // Simple theme detection - can be enhanced with environment variables
    const processEnv = process.env;
    if (processEnv.FORCE_COLOR === '0')
        return 'light';
    if (processEnv.FORCE_COLOR === '1')
        return 'dark';
    if (processEnv.NO_COLOR)
        return 'light';
    // Default to dark for CLI
    return 'dark';
}
// Color palette for different themes
exports.themes = {
    dark: exports.colors, // Current colors are dark-themed
    light: {
        // Light theme would invert the colors
        primary: chalk_1.default.hex('#1E40AF'),
        success: chalk_1.default.hex('#065F46'),
        warning: chalk_1.default.hex('#92400E'),
        error: chalk_1.default.hex('#991B1B'),
        info: chalk_1.default.hex('#312E81'),
        text: chalk_1.default.hex('#111827'),
        textMuted: chalk_1.default.hex('#6B7280'),
        textDim: chalk_1.default.hex('#9CA3AF'),
        border: chalk_1.default.hex('#D1D5DB'),
        background: chalk_1.default.hex('#F9FAFB'),
    },
    auto: exports.colors, // Default to dark
};
// Get current theme colors
function getCurrentTheme() {
    const detectedTheme = detectTheme();
    return exports.themes[detectedTheme];
}
// Backward compatibility aliases for common chalk usage patterns
exports.chalkCompat = {
    ...originalChalk,
    // Add commonly used aliases that map to our format functions
    header: exports.format.header,
    command: exports.format.command,
    number: exports.format.number,
};
exports.default = exports.colors;
// Backward compatibility functions for basic usage
exports.simpleFormat = {
    header: (text) => exports.colors.primary.bold("🔧 " + text),
    command: (text) => exports.colors.primaryLight(text),
    number: (num) => exports.colors.primary(num.toString()),
    success: (text) => exports.colors.success.bold("✅ " + text),
    warning: (text) => exports.colors.warning.bold("⚠️  " + text),
    error: (text) => exports.colors.error.bold("❌ " + text),
    info: (text) => exports.colors.info.bold("ℹ️  " + text)
};
// Simple createBox that accepts color strings or chalk instances
function createSimpleBox(content, title, borderColorName) {
    const borderColor = typeof borderColorName === 'string' ? (exports.colors[borderColorName] || exports.colors.border) : borderColorName || exports.colors.border;
    const lines = content.split('\n');
    const maxLineLength = Math.max(...lines.map(line => line.length), title?.length || 0);
    if (typeof exports.box !== 'undefined') {
        const borderLine = borderColor(exports.box.horizontal.repeat(maxLineLength + 4));
        let result = borderLine + '\n';
        if (title) {
            const titleLine = borderColor(exports.box.vertical) + ' ' +
                exports.colors.primary.bold(title) +
                ' '.repeat(maxLineLength - title.length + 1) +
                borderColor(exports.box.vertical);
            result += titleLine + '\n' + borderLine + '\n';
        }
        for (const line of lines) {
            const paddedLine = line.padEnd(maxLineLength);
            result += borderColor(exports.box.vertical) + ' ' + exports.colors.text(paddedLine) + ' ' + borderColor(exports.box.vertical) + '\n';
        }
        result += borderLine;
        return result;
    }
    else {
        // Fallback simple box
        let result = '';
        if (title) {
            result += exports.colors.primary.bold(title) + '\n';
            result += borderColor('─'.repeat(title.length)) + '\n';
        }
        result += content;
        return result;
    }
}
