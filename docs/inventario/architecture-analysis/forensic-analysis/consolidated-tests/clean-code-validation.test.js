/**
 * Tests de Validación de Clean Code Principles
 * Previene regresiones futuras de clean code violations
 * Valida que el sistema forense cumpla con los estándares que exige
 */

const fs = require('fs');
const path = require('path');

describe('Clean Code Validation', () => {
  const srcDir = path.join(__dirname, '../src');

  describe('FASE 1: Magic Numbers Detection', () => {
    test('No debe haber magic numbers sin constantes en src/utils/', () => {
      const utilsFiles = fs
        .readdirSync(srcDir + '/utils')
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(srcDir + '/utils', file));

      utilsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');

        // Buscar patrones de magic numbers (números > 10 sin contexto de constante)
        const magicNumberPatterns = [
          /\b[1-9]\d{1,}\b/g, // Números de 2+ dígitos
          /\b0x[0-9A-Fa-f]+\b/g // Hex numbers sin constante
        ];

        const allMatches = [];
        magicNumberPatterns.forEach(pattern => {
          const matches = content.match(pattern) || [];
          allMatches.push(...matches);
        });

        // Filtrar coincidencias que podrían ser legítimas
        const filteredMatches = allMatches.filter(match => {
          const lineNumber = content
            .substring(0, content.indexOf(match))
            .split('\n').length;
          const line = content.split('\n')[lineNumber - 1];

          // Ignorar si está en un contexto de constante o configuración
          return (
            !line.includes('const ') &&
            !line.includes('let ') &&
            !line.includes('=') &&
            !line.includes('{') &&
            !line.includes('require') &&
            !line.includes('module.exports') &&
            !line.includes('return')
          );
        });

        expect(filteredMatches.length).toBeLessThanOrEqual(
          5,
          `❌ Archivo ${path.basename(filePath)} contiene ${filteredMatches.length} magic numbers sospechos: ${filteredMatches.join(', ')}`
        );
      });
    });

    test('Constants deben tener nombres semánticos descriptivos', () => {
      const utilsFiles = fs
        .readdirSync(srcDir + '/utils')
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(srcDir + '/utils', file));

      utilsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');

        // Buscar declaraciones de constantes
        const constantDeclarations =
          content.match(/const\s+[A-Z_][A-Z0-9_]*\s*=\s*[^;]+;/g) || [];

        constantDeclarations.forEach(declaration => {
          const constName = declaration.match(
            /const\s+([A-Z_][A-Z0-9_]*)/
          )?.[1];

          if (constName) {
            // Nombres de constantes deben ser descriptivos
            expect(constName.length).toBeGreaterThan(
              3,
              `❌ Constante "${constName}" en ${path.basename(filePath)} debe tener nombre descriptivo`
            );

            // No debe haber constantes genéricas
            const genericNames = ['TEMP', 'DATA', 'INFO', 'CONFIG', 'SETTINGS'];
            expect(genericNames).not.toContain(
              constName,
              `❌ Constante "${constName}" es genérica en ${path.basename(filePath)}`
            );
          }
        });
      });
    });
  });

  describe('FASE 2: Path Hardcoding Detection', () => {
    test('Scripts deben usar dependency injection pattern', () => {
      const scriptsFiles = fs
        .readdirSync(srcDir + '/scripts')
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(srcDir + '/scripts', file));

      scriptsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Buscar constructores
        const constructorMatch = content.match(/constructor\s*\([^)]*\)\s*{/);

        if (constructorMatch) {
          // El constructor debe aceptar options parameter
          expect(content).toMatch(
            /constructor\s*\(\s*options\s*=\s*{}\s*\)/,
            `❌ ${fileName} debe tener constructor con options parameter para dependency injection`
          );
        }

        // Buscar hardcoded paths relativos
        const hardcodedPathPatterns = [
          /path\.join\(__dirname[^)]*\)/g,
          /__dirname.*\.\.\//g,
          /process\.cwd\(\)[^;]+['"`][^'"`]+['"`]/g
        ];

        let hasHardcodedPaths = false;
        hardcodedPathPatterns.forEach(pattern => {
          if (content.match(pattern)) {
            hasHardcodedPaths = true;
          }
        });

        // Permitir hardcoded paths solo si hay dependency injection
        if (hasHardcodedPaths && !constructorMatch) {
          expect(false).toBe(
            true,
            `❌ ${fileName} tiene paths hardcodeados pero no usa dependency injection`
          );
        }
      });
    });

    test('Functions deben aceptar parámetros configurables en lugar de paths fijos', () => {
      const scriptsFiles = fs
        .readdirSync(srcDir + '/scripts')
        .filter(file => file.endsWith('.js'))
        .map(file => path.join(srcDir + '/scripts', file));

      scriptsFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Si hay funciones principales, deben aceptar parámetros
        const functionMatches =
          content.match(/function\s+\w+\s*\([^)]*\)\s*{/g) || [];

        functionMatches.forEach(funcMatch => {
          const params = funcMatch.match(/\(([^)]*)\)/)?.[1] || '';

          // Funciones con file paths deben tener parámetros
          if (content.includes('fs.') && content.includes('readFileSync')) {
            expect(params.trim()).not.toBe(
              '',
              `❌ Función en ${fileName} maneja archivos pero no acepta parámetros de ruta`
            );
          }
        });
      });
    });
  });

  describe('FASE 3: Function Naming Validation', () => {
    test('Function names deben ser descriptivos y específicos', () => {
      const srcFiles = [];

      // Recolectar todos los archivos JS
      ['utils', 'scripts'].forEach(dir => {
        const dirPath = path.join(srcDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file => srcFiles.push(path.join(dirPath, file)));
        }
      });

      srcFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Buscar nombres de funciones
        const functionPatterns = [
          /function\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
          /const\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*\([^)]*\)\s*=>/g,
          /([a-zA-Z_][a-zA-Z0-9_]*)\s*:\s*function/g
        ];

        const functionNames = [];
        functionPatterns.forEach(pattern => {
          const matches = content.match(pattern) || [];
          matches.forEach(match => {
            const name = match.match(/[a-zA-Z_][a-zA-Z0-9_]*/)?.[0];
            if (name && !functionNames.includes(name)) {
              functionNames.push(name);
            }
          });
        });

        // Validar nombres genéricos
        const genericNames = [
          'data',
          'info',
          'temp',
          'tmp',
          'process',
          'handle',
          'manage',
          'do',
          'run'
        ];
        const foundGeneric = functionNames.filter(name =>
          genericNames.some(generic => name.toLowerCase().includes(generic))
        );

        expect(foundGeneric.length).toBe(
          0,
          `❌ ${fileName} contiene nombres genéricos: ${foundGeneric.join(', ')}`
        );

        // Validar longitud mínima para nombres significativos
        const shortNames = functionNames.filter(name => name.length < 4);
        expect(shortNames.length).toBeLessThanOrEqual(
          1, // Permitir 1 nombre corto muy específico por archivo
          `❌ ${fileName} tiene demasiados nombres cortos: ${shortNames.join(', ')}`
        );
      });
    });

    test('Variable names deben expresar propósito', () => {
      const srcFiles = [];

      ['utils', 'scripts'].forEach(dir => {
        const dirPath = path.join(srcDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file => srcFiles.push(path.join(dirPath, file)));
        }
      });

      srcFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Buscar declaraciones de variables
        const varPatterns = [
          /let\s+([a-zA-Z_][a-zA-Z0-9_]*)/g,
          /const\s+([a-z_][a-zA-Z0-9_]*)/g
        ];

        const variableNames = [];
        varPatterns.forEach(pattern => {
          const matches = content.match(pattern) || [];
          matches.forEach(match => {
            const name = match.match(/[a-zA-Z_][a-zA-Z0-9_]*/)?.[0];
            if (name && !variableNames.includes(name)) {
              variableNames.push(name);
            }
          });
        });

        // Validar variables muy genéricas
        const veryGenericNames = ['a', 'b', 'c', 'x', 'y', 'z', 'i', 'j', 'k'];
        const foundVeryGeneric = variableNames.filter(name =>
          veryGenericNames.includes(name)
        );

        expect(foundVeryGeneric.length).toBe(
          0,
          `❌ ${fileName} usa variables muy genéricas: ${foundVeryGeneric.join(', ')}`
        );
      });
    });
  });

  describe('FASE 4: Single Responsibility Principle', () => {
    test('Functions no deben hacer demasiadas cosas', () => {
      const srcFiles = [];

      ['utils', 'scripts'].forEach(dir => {
        const dirPath = path.join(srcDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file => srcFiles.push(path.join(dirPath, file)));
        }
      });

      srcFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Buscar funciones largas (posible violación SRP)
        const functionBlocks =
          content.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]*\}/gs) || [];

        functionBlocks.forEach((funcBlock, index) => {
          const lineCount = funcBlock.split('\n').length;

          // Funciones muy largas probablemente violan SRP
          if (lineCount > 50) {
            console.warn(
              `⚠️  ${fileName}: Función ${index + 1} tiene ${lineCount} líneas (posible SRP violation)`
            );
          }

          // Funciones con demasiados if/else pueden violar SRP
          const ifElseCount = (funcBlock.match(/\b(if|else if|else)\b/g) || [])
            .length;
          if (ifElseCount > 5) {
            console.warn(
              `⚠️  ${fileName}: Función ${index + 1} tiene ${ifElseCount} condicionales (posible SRP violation)`
            );
          }
        });
      });
    });

    test('Clases deben tener responsabilidad única', () => {
      const srcFiles = [];

      ['utils', 'scripts'].forEach(dir => {
        const dirPath = path.join(srcDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file => srcFiles.push(path.join(dirPath, file)));
        }
      });

      srcFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Buscar clases
        const classMatches = content.match(/class\s+\w+\s*\{[^}]*\}/gs) || [];

        classMatches.forEach((classBlock, index) => {
          const methodCount = (classBlock.match(/\b\w+\s*\([^)]*\)\s*{/g) || [])
            .length;

          // Clases con demasiados métodos pueden violar SRP
          if (methodCount > 15) {
            console.warn(
              `⚠️  ${fileName}: Clase ${index + 1} tiene ${methodCount} métodos (posible SRP violation)`
            );
          }
        });
      });
    });
  });

  describe('FASE 5: Integration Validation', () => {
    test('Sistema debe pasar todas las validaciones de clean code', () => {
      // Verificar que no hay archivos con extensión .js que no sigan clean code
      const srcFiles = [];

      ['utils', 'scripts'].forEach(dir => {
        const dirPath = path.join(srcDir, dir);
        if (fs.existsSync(dirPath)) {
          fs.readdirSync(dirPath)
            .filter(file => file.endsWith('.js'))
            .forEach(file => srcFiles.push(path.join(dirPath, file)));
        }
      });

      const violations = [];

      srcFiles.forEach(filePath => {
        const content = fs.readFileSync(filePath, 'utf8');
        const fileName = path.basename(filePath);

        // Validation 1: Magic numbers
        const magicNumbers = content.match(/\b[1-9]\d{1,}\b/g) || [];
        const filteredMagic = magicNumbers.filter(num => {
          return parseInt(num) > 10;
        });

        if (filteredMagic.length > 5) {
          violations.push(`${fileName}: ${filteredMagic.length} magic numbers`);
        }

        // Validation 2: Hardcoded paths
        if (
          content.includes('__dirname') ||
          content.includes('process.cwd()')
        ) {
          violations.push(`${fileName}: Posibles paths hardcodeados`);
        }

        // Validation 3: Generic names
        const genericNames = ['data', 'info', 'temp'];
        genericNames.forEach(generic => {
          if (content.includes(generic)) {
            violations.push(`${fileName}: Usa nombre genérico "${generic}"`);
          }
        });
      });

      expect(violations.length).toBe(
        0,
        `❌ Se encontraron ${violations.length} violaciones de clean code:\n${violations.join('\n')}`
      );
    });

    test('Rules actualizadas deben reflejar clean code requirements', () => {
      const rulesPath = path.join(__dirname, '../config/rules_forense_v2.json');
      const rules = JSON.parse(fs.readFileSync(rulesPath, 'utf8'));

      // Validar que las nuevas reglas existen
      expect(rules.maximas).toHaveProperty('clean_code');
      expect(rules.maximas).toHaveProperty('autoanalisis');

      // Validar prohibiciones específicas
      const prohibitionsText = JSON.stringify(rules.prohibiciones);
      expect(prohibitionsText).toContain('magic numbers');
      expect(prohibitionsText).toContain('paths hardcodeados');
      expect(JSON.stringify(rules.prohibiciones)).toContain(
        'nombres genéricos'
      );

      // Validar obligaciones de clean code
      const obligationsText = JSON.stringify(rules.obligaciones);
      expect(obligationsText).toContain('clean code principles');
      expect(obligationsText).toContain('dependency injection');

      // Validar quality gate de clean code
      expect(rules.quality_gates).toHaveProperty('clean_code');
      expect(rules.quality_gates.clean_code.command).toBe(
        'npm run validate:clean-code'
      );
    });
  });
});
