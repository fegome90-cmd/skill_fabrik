/**
 * TestUtils - Utilidades para testing
 * Funciones helper para crear proyectos temporales y archivos de test
 *
 * NOTE: Security warnings for file operations are acceptable in test utilities
 * since these functions operate only on temporary test directories created
 * specifically for testing purposes.
 */

/* eslint-disable security/detect-non-literal-fs-filename */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */

import { execSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';

export class TestUtils {
  private static tempProjectCounter = 0;
  private static readonly TEMP_BASE_DIR = path.join(
    process.cwd(),
    'test',
    'temp'
  );

  /**
   * Crea un proyecto temporal para testing
   */
  static createTempProject(name: string): string {
    if (!fs.existsSync(this.TEMP_BASE_DIR)) {
      fs.mkdirSync(this.TEMP_BASE_DIR, { recursive: true });
    }

    const tempDir = path.join(
      this.TEMP_BASE_DIR,
      `${name}-${Date.now()}-${++this.tempProjectCounter}`
    );
    fs.mkdirSync(tempDir, { recursive: true });

    // Setup básico del proyecto temporal
    const packageJson = {
      name: 'temp-test-project',
      version: '1.0.0',
      scripts: {
        lint: 'eslint . --ext .ts,.js',
      },
      devDependencies: {
        eslint: '^8.0.0',
      },
    };

    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    return tempDir;
  }

  /**
   * Limpia un proyecto temporal
   */
  static cleanupTempProject(name: string): void {
    // Note: En un entorno real, we'd want to be more specific about which temp dir to clean up
    // For now, we'll clean all temp dirs with the name pattern
    if (fs.existsSync(this.TEMP_BASE_DIR)) {
      const dirs = fs.readdirSync(this.TEMP_BASE_DIR);
      for (const dir of dirs) {
        if (dir.includes(name)) {
          const dirPath = path.join(this.TEMP_BASE_DIR, dir);
          this.removeDirectoryRecursive(dirPath);
        }
      }
    }
  }

  /**
   * Crea un archivo de test en el proyecto temporal
   */
  static createTestFile(
    projectPath: string,
    fileName: string,
    content: string
  ): void {
    const filePath = path.join(projectPath, fileName);
    const dir = path.dirname(filePath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, content);
  }

  /**
   * Ejecuta un comando en el proyecto temporal
   */
  static execCommand(
    command: string,
    cwd: string,
    options?: any
  ): { exitCode: number; stdout: string; stderr: string } {
    try {
      const stdout = execSync(command, {
        encoding: 'utf8',
        cwd,
        stdio: 'pipe',
        ...options,
      });
      return { exitCode: 0, stdout, stderr: '' } as any;
    } catch (error: unknown) {
      const err = error as {
        status?: number;
        stdout?: Buffer | string;
        stderr?: Buffer | string;
      };
      return {
        exitCode: err.status || 1,
        stdout: err.stdout?.toString() || '',
        stderr: err.stderr?.toString() || '',
      };
    }
  }

  /**
   * Espera a que un archivo exista
   */
  static async waitForFile(
    filePath: string,
    timeout: number = 5000
  ): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
      if (fs.existsSync(filePath)) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return false;
  }

  /**
   * Remueve un directorio recursivamente
   */
  private static removeDirectoryRecursive(dirPath: string): void {
    if (fs.existsSync(dirPath)) {
      for (const file of fs.readdirSync(dirPath)) {
        const currentPath = path.join(dirPath, file);
        if (fs.lstatSync(currentPath).isDirectory()) {
          this.removeDirectoryRecursive(currentPath);
        } else {
          fs.unlinkSync(currentPath);
        }
      }
      fs.rmdirSync(dirPath);
    }
  }

  /**
   * Lee un archivo JSON de forma segura
   */
  static readJsonFile(filePath: string): unknown {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(
        `Failed to read or parse JSON file ${filePath}: ${error as string}`
      );
    }
  }

  /**
   * Escribe un archivo JSON de forma segura
   */
  static writeJsonFile(filePath: string, data: any): void {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }
}
