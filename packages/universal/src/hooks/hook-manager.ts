/**
 * Universal Hook Manager
 *
 * Sistema de hooks agnóstico al IDE que soporta múltiples editores:
 * Cursor, VS Code, IntelliJ, WebStorm, y otros.
 *
 * @version 1.0.0
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';
import { homedir } from 'os';
import { UniversalConfig } from '../config-manager.js';

export interface IDEConfig {
  name: string;
  configPaths: string[];
  hookPaths: string[];
  commands: {
    install: string[];
    uninstall: string[];
  };
  detect: () => boolean;
}

export interface HookConfig {
  preInvoke: boolean;
  postInvoke: boolean;
  planDetection: boolean;
  customScripts: string[];
}

export class HookManager {
  private static readonly IDES: IDEConfig[] = [
    {
      name: 'cursor',
      configPaths: ['.cursor/hooks/hooks-config.json'],
      hookPaths: ['.cursor/hooks/pre-invoke.mjs', '.cursor/hooks/stop.mjs'],
      commands: {
        install: [],
        uninstall: []
      },
      detect: () => existsSync('.cursor')
    },
    {
      name: 'vscode',
      configPaths: ['.vscode/settings.json', '.vscode/tasks.json'],
      hookPaths: ['.vscode/hooks/pre-invoke.js', '.vscode/hooks/post-invoke.js'],
      commands: {
        install: ['code --install-extension ms-vscode.vscode-typescript-next'],
        uninstall: []
      },
      detect: () => existsSync('.vscode')
    },
    {
      name: 'intellij',
      configPaths: ['.idea/misc.xml', '.idea/workspace.xml'],
      hookPaths: ['.idea/hooks/pre-invoke.py', '.idea/hooks/post-invoke.py'],
      commands: {
        install: [],
        uninstall: []
      },
      detect: () => existsSync('.idea')
    },
    {
      name: 'webstorm',
      configPaths: ['.idea/misc.xml', '.idea/webstorm.xml'],
      hookPaths: ['.idea/hooks/pre-invoke.py', '.idea/hooks/post-invoke.py'],
      commands: {
        install: [],
        uninstall: []
      },
      detect: () => existsSync('.idea') && this.detectWebStorm()
    },
    {
      name: 'vim',
      configPaths: ['.vimrc', '.vim/plugins/'],
      hookPaths: ['.vim/hooks/skills-fabrik.vim'],
      commands: {
        install: [],
        uninstall: []
      },
      detect: () => existsSync('.vimrc') || existsSync('.vim')
    },
    {
      name: 'emacs',
      configPaths: ['.emacs.d/init.el', '.emacs'],
      hookPaths: ['.emacs.d/hooks/skills-fabrik.el'],
      commands: {
        install: [],
        uninstall: []
      },
      detect: () => existsSync('.emacs.d') || existsSync('.emacs')
    }
  ];

  /**
   * Configura hooks universales para todos los IDEs detectados
   */
  static async setupUniversalHooks(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    console.log('🔗 Setting up universal IDE hooks...');

    const detectedIDEs = this.detectInstalledIDEs(projectPath);

    if (detectedIDEs.length === 0) {
      console.log('ℹ️  No supported IDEs detected. You can configure manually later.');
      return;
    }

    console.log(`📝 Detected IDEs: ${detectedIDEs.map(ide => ide.name).join(', ')}`);

    for (const ide of detectedIDEs) {
      try {
        await this.setupIDEHooks(projectPath, ide, config);
        console.log(`✅ ${ide.name} hooks configured`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`⚠️  Failed to configure ${ide.name} hooks: ${errorMessage}`);
      }
    }
  }

  /**
   * Elimina hooks universales de todos los IDEs
   */
  static async removeUniversalHooks(projectPath: string): Promise<void> {
    console.log('🗑️  Removing universal IDE hooks...');

    for (const ide of this.IDES) {
      if (ide.detect()) {
        try {
          await this.removeIDEHooks(projectPath, ide);
          console.log(`✅ ${ide.name} hooks removed`);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.warn(`⚠️  Failed to remove ${ide.name} hooks: ${errorMessage}`);
        }
      }
    }
  }

  /**
   * Detecta IDEs instalados en el proyecto
   */
  static detectInstalledIDEs(projectPath: string): IDEConfig[] {
    return this.IDES.filter(ide => ide.detect());
  }

  /**
   * Obtiene configuración de hooks para un IDE específico
   */
  static getHookConfig(projectPath: string, ideName: string): HookConfig | null {
    const ide = this.IDES.find(i => i.name === ideName);
    if (!ide) return null;

    // Leer configuración existente si hay
    const configPath = join(projectPath, '.skills-fabrik', 'hooks', `${ideName}.json`);
    if (existsSync(configPath)) {
      try {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
      } catch {
        // Error al leer configuración, usar default
      }
    }

    // Configuración por defecto
    return {
      preInvoke: true,
      postInvoke: true,
      planDetection: true,
      customScripts: []
    };
  }

  // --- Métodos Privados ---

  /**
   * Configura hooks para un IDE específico
   */
  private static async setupIDEHooks(
    projectPath: string,
    ide: IDEConfig,
    config: UniversalConfig
  ): Promise<void> {
    switch (ide.name) {
      case 'cursor':
        await this.setupCursorHooks(projectPath, config);
        break;
      case 'vscode':
        await this.setupVSCodeHooks(projectPath, config);
        break;
      case 'intellij':
      case 'webstorm':
        await this.setupIntelliJHooks(projectPath, config);
        break;
      case 'vim':
        await this.setupVimHooks(projectPath, config);
        break;
      case 'emacs':
        await this.setupEmacsHooks(projectPath, config);
        break;
    }

    // Guardar configuración de hooks
    this.saveHookConfig(projectPath, ide.name, config.hooks);
  }

  /**
   * Configura hooks para Cursor IDE
   */
  private static async setupCursorHooks(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    const cursorDir = join(projectPath, '.cursor');
    const hooksDir = join(cursorDir, 'hooks');

    // Crear directorios
    if (!existsSync(cursorDir)) mkdirSync(cursorDir);
    if (!existsSync(hooksDir)) mkdirSync(hooksDir);

    // Configuración de hooks
    const hookConfig = {
      version: '2.0.0',
      userPromptSubmit: {
        enabled: config.hooks.preInvoke,
        scriptPath: '../../node_modules/@skills-fabrik/universal/dist/hooks/pre-invoke.mjs',
        skillRulesPath: '.skills-fabrik/registry/index.json',
        threshold: config.skills.activationThreshold,
        maxSkills: config.skills.maxSkillsPerRequest,
        fuzzyMatch: config.skills.fuzzyMatching,
        fuzzyThreshold: config.skills.fuzzyThreshold,
        contextualBoost: config.skills.contextualBoost
      },
      stop: {
        enabled: config.hooks.postInvoke,
        scriptPath: '../../node_modules/@skills-fabrik/universal/dist/hooks/stop.mjs',
        buildCheck: config.qualityGates.gates.some(g => g.id === 'build-check' && (g as any).enabled) ?? false,
        lint: config.qualityGates.gates.some(g => g.id === 'lint-check' && (g as any).enabled) ?? false,
        prettier: false,
        kpiEmit: config.features.kpiTracking
      }
    };

    writeFileSync(
      join(hooksDir, 'hooks-config.json'),
      JSON.stringify(hookConfig, null, 2)
    );

    // Copiar scripts de hooks
    this.copyHookScripts(projectPath, hooksDir);
  }

  /**
   * Configura hooks para VS Code
   */
  private static async setupVSCodeHooks(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    const vscodeDir = join(projectPath, '.vscode');

    if (!existsSync(vscodeDir)) mkdirSync(vscodeDir);

    // Configurar tasks para pre/post hooks
    const tasks = {
      version: '2.0.0',
      tasks: [
        {
          label: 'Skills Fabric: Pre-Invoke',
          type: 'shell',
          command: 'node',
          args: [
            './node_modules/@skills-fabrik/universal/dist/hooks/vscode-pre-invoke.js'
          ],
          group: 'build',
          presentation: {
            reveal: 'never',
            focus: false,
            panel: 'shared'
          }
        },
        {
          label: 'Skills Fabric: Post-Invoke',
          type: 'shell',
          command: 'node',
          args: [
            './node_modules/@skills-fabrik/universal/dist/hooks/vscode-post-invoke.js'
          ],
          group: 'build',
          presentation: {
            reveal: 'never',
            focus: false,
            panel: 'shared'
          }
        }
      ]
    };

    writeFileSync(join(vscodeDir, 'tasks.json'), JSON.stringify(tasks, null, 2));

    // Configurar settings para integración
    const settingsPath = join(vscodeDir, 'settings.json');
    let settings = {};

    if (existsSync(settingsPath)) {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    }

    settings = {
      ...settings,
      'skills-fabrik.enabled': true,
      'skills-fabrik.autoActivate': config.skills.autoIndex,
      'skills-fabrik.showNotifications': true,
      'skills-fabrik.qualityGates': config.qualityGates.enabled
    };

    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  }

  /**
   * Configura hooks para IntelliJ/WebStorm
   */
  private static async setupIntelliJHooks(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    const ideaDir = join(projectPath, '.idea');

    if (!existsSync(ideaDir)) mkdirSync(ideaDir);

    // Configurar external tools para hooks
    const miscXml = `<?xml version="1.0" encoding="UTF-8"?>
<project version="4">
  <component name="ExternalToolsConfiguration">
    <tool name="Skills Fabric Pre-Invoke" description="Run Skills Fabric before code changes">
      <channel>exec</channel>
      <executable>node</executable>
      <parameters>./node_modules/@skills-fabrik/universal/dist/hooks/intellij-pre-invoke.js</parameters>
      <workdir>$ProjectFileDir$</workdir>
    </tool>
    <tool name="Skills Fabric Post-Invoke" description="Run Skills Fabric after code changes">
      <channel>exec</channel>
      <executable>node</executable>
      <parameters>./node_modules/@skills-fabrik/universal/dist/hooks/intellij-post-invoke.js</parameters>
      <workdir>$ProjectFileDir$</workdir>
    </tool>
  </component>
</project>`;

    writeFileSync(join(ideaDir, 'misc.xml'), miscXml);
  }

  /**
   * Configura hooks para Vim
   */
  private static async setupVimHooks(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    const vimDir = join(projectPath, '.vim', 'hooks');

    if (!existsSync(vimDir)) mkdirSync(vimDir, { recursive: true });

    const vimHook = `" Skills Fabric Universal Hooks
if exists('g:loaded_skills_fabrik') || &compatible
  finish
endif
let g:loaded_skills_fabrik = 1

" Auto-commands for Skills Fabric integration
augroup SkillsFabric
  autocmd!
  autocmd BufWritePre * call SkillsFabricPreInvoke()
  autocmd BufWritePost * call SkillsFabricPostInvoke()
augroup END

" Functions
function! SkillsFabricPreInvoke()
  let l:cmd = 'node ./node_modules/@skills-fabrik/universal/dist/hooks/vim-pre-invoke.js ' . expand('%:p')
  call system(l:cmd)
endfunction

function! SkillsFabricPostInvoke()
  let l:cmd = 'node ./node_modules/@skills-fabrik/universal/dist/hooks/vim-post-invoke.js ' . expand('%:p')
  call system(l:cmd)
endfunction
`;

    writeFileSync(join(vimDir, 'skills-fabrik.vim'), vimHook);
  }

  /**
   * Configura hooks para Emacs
   */
  private static async setupEmacsHooks(
    projectPath: string,
    config: UniversalConfig
  ): Promise<void> {
    const emacsDir = join(projectPath, '.emacs.d', 'hooks');

    if (!existsSync(emacsDir)) mkdirSync(emacsDir, { recursive: true });

    const emacsHook = `;; Skills Fabric Universal Hooks

;; Auto-load hooks
(add-hook 'before-save-hook 'skills-fabrik-pre-invoke)
(add-hook 'after-save-hook 'skills-fabrik-post-invoke)

;; Hook functions
(defun skills-fabrik-pre-invoke ()
  "Run Skills Fabric before saving"
  (let ((cmd (concat "node ./node_modules/@skills-fabrik/universal/dist/hooks/emacs-pre-invoke.js " buffer-file-name)))
    (shell-command cmd)))

(defun skills-fabrik-post-invoke ()
  "Run Skills Fabric after saving"
  (let ((cmd (concat "node ./node_modules/@skills-fabrik/universal/dist/hooks/emacs-post-invoke.js " buffer-file-name)))
    (shell-command cmd)))

(provide 'skills-fabrik)
`;

    writeFileSync(join(emacsDir, 'skills-fabrik.el'), emacsHook);
  }

  /**
   * Elimina hooks de un IDE específico
   */
  private static async removeIDEHooks(projectPath: string, ide: IDEConfig): Promise<void> {
    for (const hookPath of ide.hookPaths) {
      const fullPath = join(projectPath, hookPath);
      if (existsSync(fullPath)) {
        unlinkSync(fullPath);
      }
    }

    // Eliminar configuración específica del IDE
    this.removeHookConfig(projectPath, ide.name);
  }

  /**
   * Copia los scripts de hooks universales
   */
  private static copyHookScripts(projectPath: string, hooksDir: string): void {
    // En una implementación real, estos scripts se copiarían desde el paquete
    // Por ahora, creamos scripts básicos
    const preInvokeScript = `#!/usr/bin/env node
// Universal Pre-Invoke Hook
console.log('Skills Fabric Universal: Pre-Invoke hook executed');
`;

    const stopScript = `#!/usr/bin/env node
// Universal Stop Hook
console.log('Skills Fabric Universal: Stop hook executed');
`;

    writeFileSync(join(hooksDir, 'pre-invoke.mjs'), preInvokeScript);
    writeFileSync(join(hooksDir, 'stop.mjs'), stopScript);
  }

  /**
   * Guarda configuración de hooks
   */
  private static saveHookConfig(
    projectPath: string,
    ideName: string,
    hookConfig: any
  ): void {
    const configDir = join(projectPath, '.skills-fabrik', 'hooks');
    if (!existsSync(configDir)) mkdirSync(configDir, { recursive: true });

    const configPath = join(configDir, `${ideName}.json`);
    writeFileSync(configPath, JSON.stringify(hookConfig, null, 2));
  }

  /**
   * Elimina configuración de hooks
   */
  private static removeHookConfig(projectPath: string, ideName: string): void {
    const configPath = join(projectPath, '.skills-fabrik', 'hooks', `${ideName}.json`);
    if (existsSync(configPath)) {
      unlinkSync(configPath);
    }
  }

  /**
   * Detecta si WebStorm está instalado
   */
  private static detectWebStorm(): boolean {
    try {
      // Verificar si WebStorm está en el PATH o buscar en ubicaciones comunes
      execSync('which webstorm', { stdio: 'ignore' });
      return true;
    } catch {
      // Buscar en ubicaciones comunes de macOS
      const commonPaths = [
        '/Applications/WebStorm.app/Contents/MacOS/webstorm',
        '~/Applications/WebStorm.app/Contents/MacOS/webstorm'
      ];

      return commonPaths.some(path => existsSync(path.replace('~', homedir())));
    }
  }
}