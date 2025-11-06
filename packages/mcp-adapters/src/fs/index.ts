/**
 * Filesystem Adapter - MCP Local Adapter
 * 
 * Proporciona operaciones de sistema de archivos para el agente,
 * siguiendo protocolo MCP pero ejecutándose localmente.
 */

import { readFile as fsReadFile, writeFile as fsWriteFile, readdir as fsReaddir, stat as fsStat, mkdir as fsMkdir, rm as fsRm } from 'fs/promises';
import { resolve } from 'path';

export interface FileSystemAdapter {
  readFile(path: string, encoding?: BufferEncoding): Promise<string>;
  writeFile(path: string, content: string, encoding?: BufferEncoding): Promise<void>;
  listDir(path: string, recursive?: boolean): Promise<string[]>;
  fileExists(path: string): Promise<boolean>;
  createDir(path: string, recursive?: boolean): Promise<void>;
  deleteFile(path: string): Promise<void>;
  deleteDir(path: string, recursive?: boolean): Promise<void>;
  getFileInfo(path: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; modified: Date }>;
}

export class LocalFileSystemAdapter implements FileSystemAdapter {
  constructor(private basePath: string = process.cwd()) {}

  async readFile(path: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    const fullPath = resolve(this.basePath, path);
    try {
      return await fsReadFile(fullPath, encoding);
    } catch (error) {
      throw new Error(`Error reading file ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async writeFile(path: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
    const fullPath = resolve(this.basePath, path);
    try {
      await fsWriteFile(fullPath, content, encoding);
    } catch (error) {
      throw new Error(`Error writing file ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async listDir(path: string, recursive: boolean = false): Promise<string[]> {
    const fullPath = resolve(this.basePath, path);
    try {
      if (!recursive) {
        return await fsReaddir(fullPath);
      }
      
      // Recursivo: listar todos los archivos
      const files: string[] = [];
      async function listRecursive(dir: string, prefix: string = ''): Promise<void> {
        const entries = await fsReaddir(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullEntryPath = resolve(dir, entry.name);
          const relativePath = prefix ? `${prefix}/${entry.name}` : entry.name;
          
          if (entry.isDirectory()) {
            files.push(`${relativePath}/`);
            await listRecursive(fullEntryPath, relativePath);
          } else {
            files.push(relativePath);
          }
        }
      }
      await listRecursive(fullPath);
      return files;
    } catch (error) {
      throw new Error(`Error listing directory ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async fileExists(path: string): Promise<boolean> {
    try {
      const fullPath = resolve(this.basePath, path);
      await fsStat(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async createDir(path: string, recursive: boolean = true): Promise<void> {
    const fullPath = resolve(this.basePath, path);
    try {
      await fsMkdir(fullPath, { recursive });
    } catch (error) {
      throw new Error(`Error creating directory ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteFile(path: string): Promise<void> {
    const fullPath = resolve(this.basePath, path);
    try {
      await fsRm(fullPath, { force: true });
    } catch (error) {
      throw new Error(`Error deleting file ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async deleteDir(path: string, recursive: boolean = true): Promise<void> {
    const fullPath = resolve(this.basePath, path);
    try {
      await fsRm(fullPath, { recursive, force: true });
    } catch (error) {
      throw new Error(`Error deleting directory ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async getFileInfo(path: string): Promise<{ size: number; isFile: boolean; isDirectory: boolean; modified: Date }> {
    const fullPath = resolve(this.basePath, path);
    try {
      const stats = await fsStat(fullPath);
      return {
        size: stats.size,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        modified: stats.mtime,
      };
    } catch (error) {
      throw new Error(`Error getting file info ${path}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// Export singleton instance
export const fsAdapter = new LocalFileSystemAdapter();


