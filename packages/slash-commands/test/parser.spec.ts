/**
 * Slash Command Parser Tests
 */

import { test, describe } from 'node:test';
import assert from 'node:assert';
import { SlashCommandParser } from '../src/parser.js';

describe('SlashCommandParser', () => {
  describe('isSlashCommand', () => {
    test('should return true for valid slash commands', () => {
      assert.strictEqual(SlashCommandParser.isSlashCommand('/dev-docs'), true);
      assert.strictEqual(SlashCommandParser.isSlashCommand('/build-and-fix'), true);
      assert.strictEqual(SlashCommandParser.isSlashCommand('/test-route'), true);
    });

    test('should return false for non-slash commands', () => {
      assert.strictEqual(SlashCommandParser.isSlashCommand('dev-docs'), false);
      assert.strictEqual(SlashCommandParser.isSlashCommand('/'), false);
      assert.strictEqual(SlashCommandParser.isSlashCommand('//invalid'), false);
      assert.strictEqual(SlashCommandParser.isSlashCommand(''), false);
    });
  });

  describe('parse', () => {
    test('should parse simple commands', () => {
      const result = SlashCommandParser.parse('/dev-docs');

      assert.strictEqual(result.command, 'dev-docs');
      assert.deepStrictEqual(result.args, []);
      assert.deepStrictEqual(result.flags, {});
      assert.deepStrictEqual(result.options, {});
      assert.strictEqual(result.raw, '/dev-docs');
    });

    test('should parse commands with arguments', () => {
      const result = SlashCommandParser.parse('/create-dev-docs user-auth-system');

      assert.strictEqual(result.command, 'create-dev-docs');
      assert.deepStrictEqual(result.args, ['user-auth-system']);
      assert.deepStrictEqual(result.flags, {});
      assert.deepStrictEqual(result.options, {});
    });

    test('should parse commands with multiple arguments', () => {
      const result = SlashCommandParser.parse('/test-route POST /api/users --auth admin');

      assert.strictEqual(result.command, 'test-route');
      assert.deepStrictEqual(result.args, ['POST', '/api/users']);
      assert.deepStrictEqual(result.flags, { auth: 'admin' });
      assert.deepStrictEqual(result.options, {});
    });

    test('should parse commands with flags', () => {
      const result = SlashCommandParser.parse('/build-and-fix --verbose --max-errors=10');

      assert.strictEqual(result.command, 'build-and-fix');
      assert.deepStrictEqual(result.args, []);
      assert.deepStrictEqual(result.flags, { verbose: true, 'max-errors': '10' });
      assert.deepStrictEqual(result.options, {});
    });

    test('should parse commands with options', () => {
      const result = SlashCommandParser.parse('/dev-docs -f json -v');

      assert.strictEqual(result.command, 'dev-docs');
      assert.deepStrictEqual(result.args, []);
      assert.deepStrictEqual(result.flags, {});
      assert.deepStrictEqual(result.options, { f: 'json', v: 'true' });
    });

    test('should parse commands with mixed arguments, flags, and options', () => {
      const result = SlashCommandParser.parse('/create-dev-docs user-auth --force -f markdown --template cloop');

      assert.strictEqual(result.command, 'create-dev-docs');
      assert.deepStrictEqual(result.args, ['user-auth']);
      assert.deepStrictEqual(result.flags, { force: true, template: 'cloop' });
      assert.deepStrictEqual(result.options, { f: 'markdown' });
    });

    test('should handle quoted arguments', () => {
      const result = SlashCommandParser.parse('/dev-docs "implement user authentication system"');

      assert.strictEqual(result.command, 'dev-docs');
      assert.deepStrictEqual(result.args, ['implement user authentication system']);
    });

    test('should handle quoted arguments with spaces and flags', () => {
      const result = SlashCommandParser.parse('/dev-docs "implement user authentication" --template cloop');

      assert.strictEqual(result.command, 'dev-docs');
      assert.deepStrictEqual(result.args, ['implement user authentication']);
      assert.deepStrictEqual(result.flags, { template: 'cloop' });
    });

    test('should return null for invalid commands', () => {
      assert.strictEqual(SlashCommandParser.parse('dev-docs'), null);
      assert.strictEqual(SlashCommandParser.parse('/'), null);
      assert.strictEqual(SlashCommandParser.parse('//invalid'), null);
    });

    test('should handle complex mixed scenarios', () => {
      const result = SlashCommandParser.parse('/test-route POST "/api/users/{id}" --auth admin -v --timeout=5000');

      assert.strictEqual(result.command, 'test-route');
      assert.deepStrictEqual(result.args, ['POST', '/api/users/{id}']);
      assert.deepStrictEqual(result.flags, { auth: 'admin', timeout: '5000' });
      assert.deepStrictEqual(result.options, { v: 'true' });
    });
  });

  describe('getCommandName', () => {
    test('should extract command name correctly', () => {
      assert.strictEqual(SlashCommandParser.getCommandName('/dev-docs'), 'dev-docs');
      assert.strictEqual(SlashCommandParser.getCommandName('/build-and-fix'), 'build-and-fix');
      assert.strictEqual(SlashCommandParser.getCommandName('/test-route'), 'test-route');
    });

    test('should return null for invalid input', () => {
      assert.strictEqual(SlashCommandParser.getCommandName('dev-docs'), null);
      assert.strictEqual(SlashCommandParser.getCommandName('/'), null);
      assert.strictEqual(SlashCommandParser.getCommandName(''), null);
    });
  });

  describe('validate', () => {
    test('should validate correct commands', () => {
      const valid = SlashCommandParser.parse('/dev-docs user auth');
      const result = SlashCommandParser.validate(valid!);

      assert.strictEqual(result.valid, true);
      assert.deepStrictEqual(result.errors, []);
    });

    test('should detect invalid command names', () => {
      const invalid = {
        raw: '/1invalid',
        command: '1invalid',
        args: [],
        flags: {},
        options: {}
      };
      const result = SlashCommandParser.validate(invalid);

      assert.strictEqual(result.valid, false);
      assert(result.errors.length > 0);
    });

    test('should detect command names that are too long', () => {
      const tooLong = 'a'.repeat(51);
      const invalid = {
        raw: `/${tooLong}`,
        command: tooLong,
        args: [],
        flags: {},
        options: {}
      };
      const result = SlashCommandParser.validate(invalid);

      assert.strictEqual(result.valid, false);
      assert(result.errors.length > 0);
    });
  });

  describe('format', () => {
    test('should format parsed command back to string', () => {
      const original = '/dev-docs "implement user auth" --template cloop -v';
      const parsed = SlashCommandParser.parse(original);
      const formatted = SlashCommandParser.format(parsed!);

      // The formatting might not be exactly the same but should be functionally equivalent
      assert(formatted.includes('/dev-docs'));
      assert(formatted.includes('implement user auth'));
      assert(formatted.includes('--template=cloop'));
      assert(formatted.includes('-v'));
    });

    test('should format simple commands', () => {
      const parsed = SlashCommandParser.parse('/build-and-fix');
      const formatted = SlashCommandParser.format(parsed!);

      assert.strictEqual(formatted, '/build-and-fix');
    });
  });

  describe('helper methods', () => {
    test('should extract help flags correctly', () => {
      const withHelp = SlashCommandParser.parse('/dev-docs --help');
      const withExamples = SlashCommandParser.parse('/dev-docs --examples');
      const withShortHelp = SlashCommandParser.parse('/dev-docs -h');
      const withShortExamples = SlashCommandParser.parse('/dev-docs -e');
      const noHelp = SlashCommandParser.parse('/dev-docs');

      assert.deepStrictEqual(SlashCommandParser.extractHelpFlags(withHelp!), {
        showHelp: true,
        showExamples: false
      });
      assert.deepStrictEqual(SlashCommandParser.extractHelpFlags(withExamples!), {
        showHelp: false,
        showExamples: true
      });
      assert.deepStrictEqual(SlashCommandParser.extractHelpFlags(withShortHelp!), {
        showHelp: true,
        showExamples: false
      });
      assert.deepStrictEqual(SlashCommandParser.extractHelpFlags(withShortExamples!), {
        showHelp: false,
        showExamples: true
      });
      assert.deepStrictEqual(SlashCommandParser.extractHelpFlags(noHelp!), {
        showHelp: false,
        showExamples: false
      });
    });

    test('should parse auth profile correctly', () => {
      const withLongAuth = SlashCommandParser.parse('/test-route --auth admin');
      const withShortAuth = SlashCommandParser.parse('/test-route -a admin');
      const noAuth = SlashCommandParser.parse('/test-route');

      assert.strictEqual(SlashCommandParser.parseAuthProfile(withLongAuth!), 'admin');
      assert.strictEqual(SlashCommandParser.parseAuthProfile(withShortAuth!), 'admin');
      assert.strictEqual(SlashCommandParser.parseAuthProfile(noAuth!), null);
    });

    test('should parse context file correctly', () => {
      const withLongContext = SlashCommandParser.parse('/dev-docs --context ./context.json');
      const withShortContext = SlashCommandParser.parse('/dev-docs -c ./context.json');
      const noContext = SlashCommandParser.parse('/dev-docs');

      assert.strictEqual(SlashCommandParser.parseContextFile(withLongContext!), './context.json');
      assert.strictEqual(SlashCommandParser.parseContextFile(withShortContext!), './context.json');
      assert.strictEqual(SlashCommandParser.parseContextFile(noContext!), null);
    });

    test('should parse output format correctly', () => {
      const withLongFormat = SlashCommandParser.parse('/dev-docs --format json');
      const withShortFormat = SlashCommandParser.parse('/dev-docs -f json');
      const withInvalidFormat = SlashCommandParser.parse('/dev-docs --format invalid');
      const noFormat = SlashCommandParser.parse('/dev-docs');

      assert.strictEqual(SlashCommandParser.parseOutputFormat(withLongFormat!), 'json');
      assert.strictEqual(SlashCommandParser.parseOutputFormat(withShortFormat!), 'json');
      assert.strictEqual(SlashCommandParser.parseOutputFormat(withInvalidFormat!), 'text'); // fallback
      assert.strictEqual(SlashCommandParser.parseOutputFormat(noFormat!), 'text'); // default
    });

    test('should parse verbosity correctly', () => {
      const withLongVerbose = SlashCommandParser.parse('/dev-docs --verbose debug');
      const withShortVerbose = SlashCommandParser.parse('/dev-docs -v debug');
      const withInvalidVerbose = SlashCommandParser.parse('/dev-docs --verbose invalid');
      const noVerbose = SlashCommandParser.parse('/dev-docs');

      assert.strictEqual(SlashCommandParser.parseVerbosity(withLongVerbose!), 'debug');
      assert.strictEqual(SlashCommandParser.parseVerbosity(withShortVerbose!), 'debug');
      assert.strictEqual(SlashCommandParser.parseVerbosity(withInvalidVerbose!), 'normal'); // fallback
      assert.strictEqual(SlashCommandParser.parseVerbosity(noVerbose!), 'normal'); // default
    });
  });
});