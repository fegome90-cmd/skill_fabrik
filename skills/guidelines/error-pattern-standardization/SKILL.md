---
id: error-pattern-standardization
version: 0.1.0
type: guideline
summary: 'Estandariza patrones de error y códigos de salida consistentes en todos los comandos del CLI para mejorar experiencia de usuario y debugging.'
audience: engineers
when_to_use: 'Cuando necesites implementar manejo de errores consistente y códigos de salida estandarizados en el CLI.'
severity: high
tags: [error-handling, cli, consistency, standards, user-experience]
---

# Error Pattern Standardization Guideline

## Propósito
Este skill establece patrones de error consistentes y códigos de salida estandarizados para todos los comandos del CLI, asegurando una experiencia de usuario predecible y facilitando el debugging y automatización.

## Métrica de Éxito
- 100% de comandos con códigos de salida consistentes
- 0% de errores no manejados (uncaught exceptions)
- 95%+ de mensajes de error contextuales y útiles
- Integración con CI/CD systems sin ambigüedad

## Implementación CLOOP

### C1 - CLARIFY: Objetivos y Requisitos
**Objetivos Principales:**
- Estandarizar códigos de salida según el estándar Unix/Linux
- Proporcionar mensajes de error contextuales y accionables
- Implementar manejo de errores jerárquico
- Facilitar debugging y troubleshooting

**Requisitos Específicos:**
- Exit code 0: Éxito (success)
- Exit code 1: Error de usuario (user error)
- Exit code 2: Error del sistema (system error)
- Exit codes 64+: Errores específicos (custom errors)

### C2 - LAYOUT: Arquitectura de Errores
**Componentes Clave:**
1. **Error Handler Centralizado**: Clase unificada para manejo de errores
2. **Error Types**: Tipos de error específicos y clasificados
3. **Exit Code Manager**: Gestión consistente de códigos de salida
4. **Message Formatter**: Formateo contextual de mensajes
5. **Recovery Strategies**: Estrategias de recuperación por tipo de error

**Estructura de Archivos:**
```
src/core/
├── error-handler.ts         # Central error handling
├── error-types.ts           # Error type definitions
├── exit-codes.ts            # Exit code constants
├── message-formatter.ts     # Message formatting
└── recovery-strategies.ts   # Recovery patterns
```

### C3 - OPERATE: Implementación Detallada
**Paso 1: Tipos de Error Estandarizados**
```typescript
// Base error types
export class CLIError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly type: ErrorType,
    public readonly context?: any,
    public readonly suggestions?: string[]
  ) {
    super(message);
    this.name = 'CLIError';
  }
}

// Specific error types
export class ValidationError extends CLIError { /* ... */ }
export class ConfigurationError extends CLIError { /* ... */ }
export class SystemError extends CLIError { /* ... */ }
export class UserError extends CLIError { /* ... */ }
```

**Paso 2: Mensajes de Error Contextuales**
```typescript
interface ErrorMessage {
  primary: string;      // Main error message
  details?: string;      // Additional context
  suggestions: string[]; // Actionable suggestions
  help?: string;         // Help command reference
  code?: number;         // Exit code for reference
}
```

**Paso 3: Formato de Salida Estandarizado**
```typescript
interface CLIOutput {
  stdout?: string;
  stderr: string;
  exitCode: number;
  metadata: {
    timestamp: number;
    command: string;
    args: string[];
    errorType: string;
    duration: number;
  };
}
```

### C4 - OBSERVE: Métricas y Monitoring
**Métricas de Error:**
- Error rate por comando
- Recovery success rate
- User satisfaction with error messages
- Time to resolution

**Monitoring:**
- Error pattern tracking
- Exit code consistency validation
- User feedback collection
- Performance impact measurement

### C5 - REFLECT: Mejora Continua
**Learnings Esperados:**
- Patrones comunes de errores de usuario
- Efectividad de mensajes de error
- Recovery strategy effectiveness
- Impact en experiencia de usuario

**Improvements:**
- Smart error recovery
- Predictive error suggestions
- Enhanced error reporting
- User education on common errors

## Estándares Específicos

### Códigos de Salida (Exit Codes)
```typescript
// Exit code constants (following sysexits.h standard)
export const EXIT_CODES = {
  SUCCESS: 0,              // Successful operation
  GENERAL_ERROR: 1,         // General error (user error)
  SYSTEM_ERROR: 2,          // System error (internal)
  USAGE_ERROR: 64,          // Usage error (invalid arguments)
  DATA_ERROR: 65,           // Data error (invalid input)
  NO_INPUT: 66,             // No input provided
  SOFTWARE_ERROR: 70,       // Internal software error
  CONFIG_ERROR: 78,         // Configuration error
  NETWORK_ERROR: 76,        // Network error
  PERMISSION_ERROR: 77,      // Permission error
  TEMPORARY_FAILURE: 75,    // Temporary failure
} as const;
```

### Jerarquía de Errores
```typescript
// Error priority for handling
enum ErrorPriority {
  CRITICAL = 1,    // System failures, crashes
  HIGH = 2,        // Configuration, permission errors
  MEDIUM = 3,      // Validation, user input errors
  LOW = 4,         // Warnings, suggestions
  INFO = 5          // Informational messages
}
```

### Patrones de Mensajes
```typescript
// Error message patterns
interface MessagePatterns {
  validation: `❌ Invalid ${field}: ${value}. Expected ${expected}`;
  permission: `❌ Permission denied: ${action}. Need ${required_permission}`;
  notFound: `❌ ${resource} not found: ${identifier}`;
  systemError: `❌ Internal error: ${component} ${operation} failed`;
  userError: `❌ ${operation} failed: ${user_friendly_explanation}`;
  suggestion: `💡 Try: ${suggestion}`;
  help: `ℹ️  Help: Run 'cli ${command} --help' for more information`;
}
```

## Implementación

### 1. Error Handler Centralizado
```typescript
export class CLIErrorHandler {
  private static instance: CLIErrorHandler;

  static getInstance(): CLIErrorHandler {
    if (!CLIErrorHandler.instance) {
      CLIErrorHandler.instance = new CLIErrorHandler();
    }
    return CLIErrorHandler.instance;
  }

  handleError(error: Error, context?: any): CLIOutput {
    const cliError = this.wrapError(error, context);
    const formattedMessage = this.formatErrorMessage(cliError);
    const exitCode = cliError.code;

    return {
      stderr: formattedMessage,
      exitCode,
      metadata: {
        timestamp: Date.now(),
        command: context?.command || 'unknown',
        args: context?.args || [],
        errorType: cliError.constructor.name,
        duration: context?.duration || 0
      }
    };
  }

  private wrapError(error: Error, context?: any): CLIError {
    if (error instanceof CLIError) {
      return error;
    }

    // Wrap regular errors
    return new CLIError(
      error.message,
      EXIT_CODES.GENERAL_ERROR,
      ErrorType.USER,
      context
    );
  }
}
```

### 2. Mensajes de Error Contextuales
```typescript
export class MessageFormatter {
  static formatError(error: CLIError): string {
    let message = '';

    // Primary error message
    message += `${this.getColorIcon(error.code)} ${error.message}\n`;

    // Details if available
    if (error.context?.details) {
      message += `\n📋 Details: ${error.context.details}`;
    }

    // Suggestions
    if (error.suggestions && error.suggestions.length > 0) {
      message += '\n💡 Suggestions:';
      error.suggestions.forEach(suggestion => {
        message += `\n   • ${suggestion}`;
      });
    }

    // Help reference
    if (error.context?.command) {
      message += `\nℹ️  Help: Run 'cli ${error.context.command} --help'`;
    }

    // Exit code reference (in debug mode)
    if (process.env.DEBUG === 'true') {
      message += `\n🔍 Debug: Exit code ${error.code} (${error.constructor.name})`;
    }

    return message;
  }

  private getColorIcon(code: number): string {
    if (code === 0) return '✅';
    if (code < 10) return '❌';
    if (code < 20) return '⚠️';
    return '🔥';
  }
}
```

### 3. Estrategias de Recuperación
```typescript
export class RecoveryStrategies {
  static async attemptRecovery(error: CLIError, context?: any): Promise<{
    recovered: boolean;
    suggestion?: string;
    action?: () => Promise<any>;
  }> {
    switch (error.constructor.name) {
      case 'ValidationError':
        return this.recoverFromValidationError(error, context);

      case 'PermissionError':
        return this.recoverFromPermissionError(error, context);

      case 'ConfigurationError':
        return this.recoverFromConfigurationError(error, context);

      case 'NetworkError':
        return this.recoverFromNetworkError(error, context);

      default:
        return { recovered: false };
    }
  }

  private static async recoverFromValidationError(error: CLIError, context?: any) {
    // Auto-fix common validation issues
    if (error.message.includes('Empty input')) {
      return {
        recovered: true,
        suggestion: 'Please provide the required input parameter'
      };
    }

    return { recovered: false };
  }
}
```

## Validación

### Criterios de Éxito:
1. **Consistencia**: 100% de comandos usan códigos de salida estándar
2. **Contexto**: 95%+ de mensajes de error incluyen sugerencias útiles
3. **Recuperación**: 80%+ de errores comunes tienen estrategias de recuperación
4. **Performance**: < 100ms overhead en manejo de errores

### Tests de Validación:
```typescript
describe('Error Pattern Standardization', () => {
  test('all commands use standard exit codes', () => {
    // Test all commands for exit code consistency
  });

  test('error messages are contextual and actionable', () => {
    // Validate error message quality
  });

  test('recovery strategies work for common errors', () => {
    // Test error recovery mechanisms
  });

  test('error formatting follows visual standards', () => {
    // Validate visual formatting consistency
  });
});
```

## Scripts de Validación

### Error Consistency Checker
```bash
#!/bin/bash
# Validate error consistency across all CLI commands

echo "🔍 Checking error pattern consistency..."

# Test all commands with invalid input
commands=("skills" "plan" "kpi" "guardrail")
errors=0

for cmd in "${commands[@]}"; do
  echo "Testing $cmd command..."

  # Test with invalid arguments
  $cmd --invalid-flag 2>/dev/null
  local exit_code=$?

  if [ $exit_code -eq 1 ]; then
    echo "✅ $cmd: Proper error handling (exit code 1)"
  else
    echo "❌ $cmd: Invalid error handling (exit code $exit_code)"
    ((errors++))
  fi
done

echo "Error consistency check completed"
echo "Errors found: $errors"

if [ $errors -eq 0 ]; then
  echo "✅ All commands follow error standards"
  exit 0
else
  echo "❌ $errors commands have error handling issues"
  exit 1
fi
```

## Integración con CI/CD

### GitHub Actions Integration
```yaml
- name: Check Error Pattern Consistency
  run: |
    npm run check:error-patterns
    npm run test:error-handling
    npm run validate:exit-codes
```

### Pre-commit Hooks
```bash
#!/bin/sh
# Pre-commit hook for error pattern validation

npm run lint
npm run test:error-handling
npm run check:exit-codes
```

