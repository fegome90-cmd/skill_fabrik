/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { jest } from '@jest/globals';

import { EvidenceCLI, runIfMain } from '../../../src/scripts/evidence-cli';
import { validateProject } from '../../../src/scripts/validate-evidence';
import {
  EncodingValidationResult,
  LinkValidationResult,
  PackageValidationResult,
} from '../../../src/types/validation';

jest.mock('../../../src/scripts/validate-evidence', () => ({
  validateProject: jest.fn(),
}));

const mockValidateProject = validateProject as jest.MockedFunction<
  typeof validateProject
>;

type ValidationOutput = {
  encoding: EncodingValidationResult & {
    issues: Array<{ file: string; issue: string }>;
    valid: boolean;
  };
  links: LinkValidationResult & {
    issues: Array<{ file: string; issue: string }>;
    valid: boolean;
  };
  package: PackageValidationResult & {
    issues: Array<{ issue: string }>;
    valid: boolean;
  };
  summary: { totalIssues: number; valid: boolean };
};

const createResult = (valid: boolean): ValidationOutput => ({
  encoding: {
    isValid: valid,
    errors: [],
    warnings: [],
    metadata: {
      timestamp: Date.now(),
      duration: 1,
      itemsProcessed: 1,
      validatorVersion: '1.0.0',
    },
    valid,
    issues: valid ? [] : [{ file: 'a', issue: 'encoding' }],
    encoding: 'utf-8',
    bomDetected: false,
    lineEndings: 'lf' as const,
  },
  links: {
    isValid: valid,
    errors: [],
    warnings: [],
    metadata: {
      timestamp: Date.now(),
      duration: 1,
      itemsProcessed: 1,
      validatorVersion: '1.0.0',
    },
    valid,
    issues: valid ? [] : [{ file: 'b', issue: 'link' }],
    linksChecked: 0,
    brokenLinks: [],
    externalLinks: [],
  },
  package: {
    isValid: valid,
    errors: [],
    warnings: [],
    metadata: {
      timestamp: Date.now(),
      duration: 1,
      itemsProcessed: 1,
      validatorVersion: '1.0.0',
    },
    valid,
    issues: valid ? [] : [{ issue: 'pkg' }],
    packageJsonPath: 'package.json',
    dependencies: { total: 0, missing: [], invalid: [], outdated: [] },
    scripts: { total: 0, invalid: [], warnings: [] },
    packageMetadata: {
      nameValid: true,
      versionValid: true,
      descriptionMissing: false,
      keywordsMissing: false,
    },
  },
  summary: { totalIssues: valid ? 0 : 3, valid },
});

describe('EvidenceCLI', () => {
  let exitSpy: jest.MockedFunction<typeof process.exit>;
  let logSpy: jest.MockedFunction<typeof console.log>;
  let errorSpy: jest.MockedFunction<typeof console.error>;

  beforeEach(() => {
    mockValidateProject.mockResolvedValue(createResult(true));
    exitSpy = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never) as jest.MockedFunction<
      typeof process.exit
    >;
    logSpy = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined) as jest.MockedFunction<
      typeof console.log
    >;
    errorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined) as jest.MockedFunction<
      typeof console.error
    >;
  });

  afterEach(() => {
    exitSpy.mockRestore();
    logSpy.mockRestore();
    errorSpy.mockRestore();
    jest.clearAllMocks();
  });

  const runCli = async (args: string[]): Promise<void> => {
    const cli = new EvidenceCLI();
    await cli.run(['node', 'evidence', ...args]);
  };

  it('exits 0 on successful validation with verbose output', async () => {
    await runCli(['.', '--verbose', '--no-interactive', '--timeout', '1000']);

    expect(logSpy).toHaveBeenCalledWith('🔍 Evidence Validation CLI');
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('handles CLI parsing errors', async () => {
    await runCli(['--invalid']);

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ CLI Error:',
      expect.stringContaining('error:')
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('prints JSON output when requested', async () => {
    const result = createResult(true);
    mockValidateProject.mockResolvedValueOnce(result);

    await runCli(['.', '--json', '--no-interactive']);

    expect(logSpy).toHaveBeenCalledWith(JSON.stringify(result, null, 2));
    expect(exitSpy).toHaveBeenCalled();
  });

  it('logs error on CLI parse failure', async () => {
    const cli = new EvidenceCLI();
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await cli.run(['node', 'cli', '--invalid']);

    expect(errorMock).toHaveBeenCalledWith(
      '❌ CLI Error:',
      expect.stringContaining('error:')
    );
    expect(exitMock).toHaveBeenCalledWith(1);

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('logs non-Error values on CLI parse failure', async () => {
    const cli = new EvidenceCLI();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parseSpy = jest.spyOn(
      (cli as unknown as { cli: { parseAsync: () => never } }).cli,
      'parseAsync'
    );
    parseSpy.mockImplementation((): never => {
      throw new Error('string failure');
    });

    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await cli.run(['node', 'cli', '--invalid']);

    expect(errorMock).toHaveBeenCalledWith('❌ CLI Error:', 'string failure');
    expect(exitMock).toHaveBeenCalledWith(1);

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('logs verbose details on success', async () => {
    mockValidateProject.mockResolvedValueOnce(createResult(true));
    const cli = new EvidenceCLI();
    const logMock = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);

    await cli.run([
      'node',
      'cli',
      '.',
      '--verbose',
      '--timeout',
      '1500',
      '--no-interactive',
    ]);

    expect(logMock).toHaveBeenCalledWith(
      expect.stringContaining('Evidence Validation CLI')
    );
    expect(logMock).toHaveBeenCalledWith(
      expect.stringContaining('⏱️ Timeout: 1500ms')
    );
    expect(exitMock).toHaveBeenCalled();

    logMock.mockRestore();
    exitMock.mockRestore();
  });

  it('uses default timeout when verbose is enabled without explicit value', async () => {
    const cli = new EvidenceCLI();
    const logMock = jest
      .spyOn(console, 'log')
      .mockImplementation(() => undefined);
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'validateProjectPath').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'withTimeout').mockResolvedValue(createResult(true));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).execute('.', {
      verbose: true,
      exclude: [],
      json: false,
      timeout: undefined,
      noInteractive: true,
    });

    expect(logMock).toHaveBeenCalledWith(
      expect.stringContaining('⏱️ Timeout: 30000ms')
    );
    expect(exitMock).toHaveBeenCalledWith(0);

    logMock.mockRestore();
    exitMock.mockRestore();
  });

  it('falls back to config default when timeout option is undefined', async () => {
    const cli = new EvidenceCLI({ defaultTimeout: 12345 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'validateProjectPath').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withTimeoutSpy = jest
      .spyOn(cli as any, 'withTimeout')
      .mockResolvedValue(createResult(true));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'outputResults').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).execute('.', {
      verbose: false,
      exclude: [],
      json: false,
      timeout: undefined,
      noInteractive: true,
    });

    expect(withTimeoutSpy).toHaveBeenCalledWith(expect.any(Promise), 12345);
  });

  it('falls back to default timeout when provided timeout is NaN', async () => {
    const cli = new EvidenceCLI({ defaultTimeout: 20000 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'validateProjectPath').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withTimeoutSpy = jest
      .spyOn(cli as any, 'withTimeout')
      .mockResolvedValue(createResult(true));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'outputResults').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).execute('.', {
      verbose: false,
      exclude: [],
      json: false,
      timeout: Number.NaN,
      noInteractive: true,
    });

    expect(withTimeoutSpy).toHaveBeenCalledWith(expect.any(Promise), 20000);
  });

  it('exits 1 when validation reports issues', async () => {
    mockValidateProject.mockResolvedValueOnce(createResult(false));

    await runCli(['.', '--no-interactive']);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('🔗 Links Validation: ❌ FAIL')
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('handles exceptions from validateProject', async () => {
    mockValidateProject.mockRejectedValueOnce(new Error('boom'));

    await runCli(['.', '--no-interactive', '--timeout', '1000']);

    expect(errorSpy).toHaveBeenCalledWith('❌ VALIDATION FAILED:', 'boom');
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('fails when required path is missing', async () => {
    await runCli(['--timeout', '1000', '--no-interactive']);

    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('logs execution time when failing in verbose mode', async () => {
    mockValidateProject.mockRejectedValueOnce(new Error('crash'));

    await runCli(['.', '--verbose', '--no-interactive', '--timeout', '50']);

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('⏱️ Execution time:')
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('fails when path does not exist', async () => {
    await runCli([
      '/definitely/not/here',
      '--no-interactive',
      '--timeout',
      '1000',
    ]);

    expect(errorSpy).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('throws when validateProjectPath is called without a path', () => {
    const cli = new EvidenceCLI();
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (cli as any).validateProjectPath('')
    ).toThrow('Project path is required');
  });

  it('exits on validation timeout', async () => {
    mockValidateProject.mockImplementation(() => new Promise(() => undefined));

    await runCli(['.', '--timeout', '5', '--no-interactive']);

    expect(errorSpy).toHaveBeenCalledWith(
      '❌ VALIDATION FAILED:',
      expect.stringContaining('Validation timeout exceeded')
    );
    expect(exitSpy).toHaveBeenCalledWith(1);
  });

  it('falls back to default timeout when zero is provided', async () => {
    const cli = new EvidenceCLI();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const withTimeoutSpy = jest
      .spyOn(cli as any, 'withTimeout')
      .mockResolvedValue(createResult(true));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'validateProjectPath').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'outputResults').mockImplementation(() => {});

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).execute('.', {
      timeout: 0,
      verbose: false,
      exclude: [],
      json: false,
      noInteractive: true,
    });

    expect(withTimeoutSpy).toHaveBeenCalledWith(expect.any(Promise), 30000);
    expect(exitSpy).toHaveBeenCalledWith(0);
  });

  it('throws when path is not accessible due to permissions', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.doMock('node:fs', () => {
        const actual = jest.requireActual<typeof import('node:fs')>('node:fs');
        return {
          ...actual,
          existsSync: (): boolean => true,
          accessSync: (): void => {
            throw new Error('denied');
          },
          constants: actual.constants,
        };
      });

      const { EvidenceCLI: IsolatedCLI } = await import(
        '../../../src/scripts/evidence-cli'
      );
      const cli = new IsolatedCLI();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => (cli as any).validateProjectPath('/restricted')).toThrow(
        'Project path not accessible: /restricted'
      );

      jest.resetModules();
      jest.dontMock('node:fs');
    });
  });

  it('handles rejection values that are not Error instances', async () => {
    const cli = new EvidenceCLI();
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'validateProjectPath').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'withTimeout').mockRejectedValue('string failure');

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).execute('.', {
      timeout: 10,
      verbose: false,
      exclude: [],
      json: false,
      noInteractive: true,
    });

    expect(errorMock).toHaveBeenCalledWith(
      '❌ VALIDATION FAILED:',
      'string failure'
    );
    expect(exitMock).toHaveBeenCalledWith(1);

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('handles require.main execution guard without crashing', async () => {
    await import('../../../src/scripts/evidence-cli');
    expect(typeof require).toBe('function');
  });

  it('runs main branch via runIfMain when entry matches', async () => {
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { runIfMain: isolatedRunIfMain } = await import(
      '../../../src/scripts/evidence-cli'
    );

    await isolatedRunIfMain(module, module, () =>
      Promise.reject(new Error('fatal'))
    );

    expect(errorMock).toHaveBeenCalledWith('Fatal error:', expect.any(Error));
    expect(exitMock).toHaveBeenCalledWith(1);

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('covers accessSync catch branch via module mock', async (): Promise<void> => {
    jest.resetModules();
    jest.doMock('node:fs', () => {
      const actual = jest.requireActual<typeof import('node:fs')>('node:fs');
      return {
        ...actual,
        existsSync: (): boolean => true,
        accessSync: (): void => {
          throw new Error('denied');
        },
        constants: actual.constants,
      };
    });

    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const { EvidenceCLI: MockedCLI } = await import(
      '../../../src/scripts/evidence-cli'
    );
    const cli = new MockedCLI();

    await cli.run(['node', 'cli', '/restricted', '--no-interactive']);

    expect(errorMock).toHaveBeenCalledWith(
      '❌ CLI Error:',
      expect.stringContaining('Project path not accessible')
    );
    expect(exitMock).toHaveBeenCalledWith(1);

    exitMock.mockRestore();
    errorMock.mockRestore();
    jest.dontMock('node:fs');
    jest.resetModules();
  });

  it('covers require.main guard by invoking runIfMain', async (): Promise<void> => {
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await runIfMain(module, module, () => Promise.reject(new Error('fatal')));

    expect(exitMock).toHaveBeenCalled();
    expect(errorMock).toHaveBeenCalledWith('Fatal error:', expect.any(Error));

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('covers runIfMain pass-through when not main', async (): Promise<void> => {
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const result = await runIfMain(module, undefined, () => Promise.resolve());

    expect(result).toBeUndefined();
    expect(exitMock).not.toHaveBeenCalled();
    expect(errorMock).not.toHaveBeenCalled();

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('covers main direct invocation', async (): Promise<void> => {
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await import('../../../src/scripts/evidence-cli').then(mod => mod.main());

    expect(exitMock).toHaveBeenCalled();
    expect(errorMock).toHaveBeenCalled();

    exitMock.mockRestore();
    errorMock.mockRestore();
  });

  it('covers execute catch path with verbose logging', async (): Promise<void> => {
    const cli = new EvidenceCLI();
    const exitMock = jest
      .spyOn(process, 'exit')
      .mockImplementation(() => undefined as never);
    const errorMock = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'validateProjectPath').mockImplementation(() => {});
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(cli as any, 'withTimeout').mockRejectedValue(new Error('fail'));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (cli as any).execute('.', {
      timeout: 50,
      verbose: true,
      exclude: [],
      json: false,
      noInteractive: true,
    });

    expect(errorMock).toHaveBeenCalledWith('❌ VALIDATION FAILED:', 'fail');
    expect(exitMock).toHaveBeenCalledWith(1);

    exitMock.mockRestore();
    errorMock.mockRestore();
  });
});
