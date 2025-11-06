# Stack Trace Analysis - Guía Avanzada de Lectura e Interpretación

## Fundamentos de Stack Traces

### ¿Qué es un Stack Trace?
Un stack trace es una representación de la pila de llamadas (call stack) en el momento exacto en que ocurrió un error. Muestra la secuencia de llamadas a funciones que llevaron al punto de fallo.

### Estructura Básica
```
Error: Cannot read property 'name' of undefined
    at Object.updateUser (/app/src/services/user.service.js:45:16)
    at UserService.process (/app/src/controllers/user.controller.js:78:21)
    at async Object.handle (/app/src/routes/api.js:23:5)
    at Layer.handle [as handle_request] (/app/node_modules/express/lib/router/layer.js:95:5)
```

## Anatomía de un Frame de Stack Trace

### Componentes de un Frame
```javascript
// Formato típico: at functionName (filename:line:column)
at UserService.updateProfile (/src/user.service.ts:45:20)
// │          │               │            │    │
// │          │               │            │    └─ Número de columna
// │          │               │            └────── Número de línea
// │          │               └──────────────────── Ruta del archivo
// │          └───────────────────────────────────── Nombre de la función
// └───────────────────────────────────────────────── Palabra clave "at"
```

### Tipos de Frames
```javascript
// 1. Functions nombradas
at UserService.createUser (/src/user.service.ts:12:15)

// 2. Functions anónimas
at /src/user.service.ts:45:20

// 3. Arrow functions
at (/src/user.service.ts:78:5)

// 4. Métodos de objetos
at Object.processRequest [as handle] (/src/api/router.js:23:5)

// 5. Functions nativas/system
at processTicksAndRejections (internal/process/task_queues.js:93:5)
```

## Patrones Comunes en Stack Traces

### 1. Stack Trace de ReferenceError
```javascript
ReferenceError: user is not defined
    at updateUser (/src/user.service.js:15:5)
    at processRequest (/src/api/controller.js:42:21)
    at Layer.handle [as handle_request] (/node_modules/express/lib/router/layer.js:95:5)

// Análisis:
// - Error en línea 15: variable 'user' no declarada
// - Causa probable: typo o variable fuera de scope
// - Contexto: updateUser() fue llamada por processRequest()
```

### 2. Stack Trace de TypeError
```javascript
TypeError: Cannot read property 'push' of undefined
    at ArrayOperations.addItems (/src/utils/array.js:23:18)
    at DataProcessor.processBatch (/src/processor.js:67:12)
    at JobQueue.execute (/src/queue.js:34:8)

// Análisis:
// - Error en línea 23: intento de leer propiedad 'push' de undefined
// - Variable que debería ser array es undefined/null
// - Revisar inicialización en DataProcessor.processBatch()
```

### 3. Stack Trace Asíncrono
```javascript
Error: Connection timeout
    at timeoutHandler (/src/db/connection.js:89:15)
    at processTicksAndRejections (internal/process/task_queues.js:93:5)
    at async Connection.query (/src/db/connection.js:45:12)
    at async UserRepository.findById (/src/repositories/user.js:23:5)
    at async UserService.getUser (/src/services/user.js:34:8)

// Análisis:
// - 'async' indica operaciones asíncronas
// - El error ocurrió en un callback/promesa
// - La secuencia real es inversa: UserService → UserRepository → Connection
```

### 4. Stack Trace de Recursión
```javascript
RangeError: Maximum call stack size exceeded
    at findNode (/src/tree.js:45:18)
    at findNode (/src/tree.js:67:24)
    at findNode (/src/tree.js:67:24)
    at findNode (/src/tree.js:67:24)
    ... (repeated 1000+ times)

// Análisis:
// - Recursión infinita detectada
// - Función findNode() se llama a sí misma sin condición de salida
// - Revisar línea 67 donde ocurre la llamada recursiva
```

## Técnicas de Análisis Profundo

### 1. Lectura de Arriba hacia Abajo
```javascript
function analyzeStackFromTop(stackTrace: string): StackAnalysis {
  const lines = stackTrace.split('\n').filter(line => line.trim());

  // El primer frame (línea 1) es donde ocurrió el error
  const errorFrame = parseFrame(lines[1]);
  console.log(`🎯 Error occurred in: ${errorFrame.function} at ${errorFrame.file}:${errorFrame.line}`);

  // Los frames siguientes muestran cómo llegamos allí
  const callChain = lines.slice(2).map(parseFrame);

  return {
    errorLocation: errorFrame,
    callChain,
    entryPoint: callChain[callChain.length - 1],
    depth: callChain.length
  };
}
```

### 2. Identificación de Frames Críticos
```typescript
function identifyCriticalFrames(frames: FrameInfo[]): FrameInfo[] {
  return frames.filter(frame => {
    // Frames de código de usuario (no system libraries)
    const isUserCode = !frame.file.includes('node_modules') &&
                      !frame.file.includes('internal/');

    // Frames con operaciones de I/O
    const isIOOperation = frame.function.includes('query') ||
                         frame.function.includes('fetch') ||
                         frame.function.includes('readFile');

    // Frames que modifican estado
    const isStateChange = frame.function.includes('update') ||
                        frame.function.includes('delete') ||
                        frame.function.includes('create');

    return isUserCode && (isIOOperation || isStateChange);
  });
}
```

### 3. Reconstrucción del Contexto
```typescript
interface FrameContext {
  frame: FrameInfo;
  variables: Record<string, any>;
  state: 'entering' | 'exiting' | 'error';
  timestamp: number;
}

class StackReconstructor {
  private contexts: FrameContext[] = [];

  reconstructExecutionPath(stackTrace: string, sourceCode: Map<string, string>): ExecutionPath {
    const frames = this.parseStackTrace(stackTrace);
    const path: FrameContext[] = [];

    for (const frame of frames) {
      const context = this.buildFrameContext(frame, sourceCode);
      path.push(context);
    }

    return {
      frames: path,
      entryPoint: path[0],
      errorPoint: path[path.length - 1],
      totalDuration: path[path.length - 1].timestamp - path[0].timestamp,
      criticalPath: this.identifyCriticalPath(path)
    };
  }

  private buildFrameContext(frame: FrameInfo, sourceCode: Map<string, string>): FrameContext {
    const code = sourceCode.get(frame.file);
    const variables = this.extractVariables(code, frame.line);

    return {
      frame,
      variables,
      state: 'error',
      timestamp: Date.now()
    };
  }
}
```

## Análisis por Tipo de Error

### 1. Errores de Tipo (TypeError)
```javascript
// Patrones comunes
"Cannot read property 'X' of undefined"
"Cannot set property 'X' of undefined"
"X is not a function"
"X is not a constructor"

// Análisis sistemático
function analyzeTypeError(stackTrace: string, error: TypeError): TypeErrorAnalysis {
  const message = error.message;
  const frames = parseStackTrace(stackTrace);

  // Extraer la propiedad que causó el error
  const propertyMatch = message.match(/Cannot read property '(\w+)' of undefined/);
  const propertyName = propertyMatch ? propertyMatch[1] : 'unknown';

  // Encontrar el frame donde ocurrió
  const errorFrame = frames[0];

  return {
    property: propertyName,
    expectedType: 'object',
    actualType: 'undefined',
    location: errorFrame,
    possibleCauses: [
      'Variable not initialized',
      'Function returned undefined unexpectedly',
      'Property does not exist on object',
      'Async operation not completed'
    ],
    nextSteps: [
      `Check if variable is defined before accessing '${propertyName}'`,
      'Add null/undefined checks',
      'Verify function return values',
      'Review async operation completion'
    ]
  };
}
```

### 2. Errores de Referencia (ReferenceError)
```javascript
// Patrones comunes
"X is not defined"
"Cannot access 'X' before initialization"

// Análisis
function analyzeReferenceError(stackTrace: string, error: ReferenceError): ReferenceErrorAnalysis {
  const message = error.message;
  const variableMatch = message.match(/(\w+) is not defined/);
  const variableName = variableMatch ? variableMatch[1] : 'unknown';

  return {
    variable: variableName,
    scopeIssue: message.includes('before initialization'),
    possibleCauses: [
      'Typo in variable name',
      'Variable used outside its scope',
      'Variable declared but not assigned',
      'Hoisting issue with let/const'
    ],
    fixes: [
      `Check spelling of '${variableName}'`,
      'Ensure variable is in correct scope',
      'Add variable declaration',
      'Move declaration before usage'
    ]
  };
}
```

### 3. Errores de Sintaxis (SyntaxError)
```javascript
// Aunque raros en producción, pueden ocurrir con eval() o import()
function analyzeSyntaxError(error: SyntaxError): SyntaxErrorAnalysis {
  return {
    message: error.message,
    location: {
      line: (error as any).lineNumber,
      column: (error as any).columnNumber
    },
    commonCauses: [
      'Missing bracket or parenthesis',
      'Invalid JSON string',
      'Trailing comma in object literal',
      'Invalid template literal'
    ]
  };
}
```

## Stack Traces en Diferentes Entornos

### 1. Node.js
```javascript
// Stack traces con información de proceso
Error: ENOENT: no such file or directory, open 'config.json'
    at Object.openSync (fs.js:498:3)
    at Object.readFileSync (fs.js:366:28)
    at loadConfig (/app/src/config.js:15:26)
    at initializeApp (/app/src/index.js:42:19)
    at Object.<anonymous> (/app/src/index.js:78:5)

// Características Node.js:
// - Nombres de archivos con rutas completas
// - Números de línea y columna precisos
// - Información de módulos internos (fs.js, process.js, etc.)
```

### 2. Browser
```javascript
// Stack traces con información de navegador
TypeError: Cannot read property 'value' of undefined
    at HTMLInputElement.<anonymous> (https://example.com/app.js:156:15)
    at HTMLInputElement.dispatch (https://example.com/vendor.js:1234:12)
    at HTMLInputElement.elemData.handle (https://example.com/vendor.js:1198:9)

// Características Browser:
// - URLs completas para archivos
// - Event handlers de DOM
// - Minified code en producción
```

### 3. TypeScript (compilado)
```javascript
// Source maps habilitados
Error: Property 'name' does not exist on type 'User | undefined'
    at UserService.updateProfile (user.service.ts:45:16)
    at processRequest (user.controller.ts:78:12)

// Con source maps:
// - Nombres de archivos TypeScript originales
// - Líneas y columnas del código fuente
// - Tipos de datos en mensajes de error
```

## Herramientas de Análisis Automatizado

### 1. Parser de Stack Traces
```typescript
class StackTraceParser {
  private static readonly FRAME_REGEX =
    /at\s+(?:(.+?)\s+\()?(?:(.+?):(\d+):(\d+)|([^)]+))\)?/;

  static parse(stackTrace: string): ParsedStackTrace {
    const lines = stackTrace.split('\n').filter(line => line.trim());
    const frames = lines
      .map(line => this.parseFrame(line))
      .filter(frame => frame !== null) as FrameInfo[];

    return {
      message: lines[0],
      frames,
      summary: this.generateSummary(frames)
    };
  }

  private static parseFrame(line: string): FrameInfo | null {
    const match = line.match(this.FRAME_REGEX);
    if (!match) return null;

    const [, functionName, fileName, lineNumber, columnNumber, nativeFrame] = match;

    return {
      functionName: functionName || '<anonymous>',
      fileName: fileName || nativeFrame || '<unknown>',
      lineNumber: lineNumber ? parseInt(lineNumber) : undefined,
      columnNumber: columnNumber ? parseInt(columnNumber) : undefined,
      isNative: !!nativeFrame,
      isConstructor: functionName === 'new',
      isAsync: line.includes('async')
    };
  }

  private static generateSummary(frames: FrameInfo[]): StackSummary {
    const userFrames = frames.filter(f => !f.fileName.includes('node_modules'));
    const firstUserFrame = userFrames[0];
    const entryFrame = frames[frames.length - 1];

    return {
      totalFrames: frames.length,
      userFrames: userFrames.length,
      systemFrames: frames.length - userFrames.length,
      entryPoint: entryFrame,
      firstUserCode: firstUserFrame,
      hasAsyncFrames: frames.some(f => f.isAsync),
      depth: frames.length
    };
  }
}
```

### 2. Agrupador de Errores Similares
```typescript
class ErrorGrouper {
  private groups = new Map<string, ErrorGroup>();

  addError(stackTrace: string, error: Error): void {
    const fingerprint = this.generateFingerprint(stackTrace);

    if (!this.groups.has(fingerprint)) {
      this.groups.set(fingerprint, {
        fingerprint,
        message: error.message,
        count: 0,
        firstSeen: new Date(),
        lastSeen: new Date(),
        sampleTraces: [],
        affectedFiles: new Set()
      });
    }

    const group = this.groups.get(fingerprint)!;
    group.count++;
    group.lastSeen = new Date();

    if (group.sampleTraces.length < 5) {
      group.sampleTraces.push(stackTrace);
    }

    // Extraer archivos afectados
    const frames = StackTraceParser.parse(stackTrace).frames;
    frames.forEach(frame => {
      if (frame.fileName && !frame.fileName.includes('node_modules')) {
        group.affectedFiles.add(frame.fileName);
      }
    });
  }

  private generateFingerprint(stackTrace: string): string {
    const parsed = StackTraceParser.parse(stackTrace);

    // Crear fingerprint basado en la estructura de llamadas
    const signature = parsed.frames
      .filter(f => !f.fileName.includes('node_modules'))
      .map(f => `${f.functionName}:${f.fileName.split('/').pop()}`)
      .join('->');

    return require('crypto')
      .createHash('md5')
      .update(signature)
      .digest('hex');
  }
}
```

## Visualización de Stack Traces

### 1. Generador de Diagramas de Flujo
```typescript
class StackTraceVisualizer {
  generateFlowDiagram(stackTrace: string): FlowDiagram {
    const parsed = StackTraceParser.parse(stackTrace);

    const nodes = parsed.frames.map((frame, index) => ({
      id: `frame-${index}`,
      label: `${frame.functionName}\\n${frame.fileName}:${frame.lineNumber}`,
      type: this.getNodeType(frame),
      level: index
    }));

    const edges = parsed.frames.slice(0, -1).map((frame, index) => ({
      from: `frame-${index}`,
      to: `frame-${index + 1}`,
      label: 'calls'
    }));

    return {
      nodes,
      edges,
      layout: 'hierarchical'
    };
  }

  private getNodeType(frame: FrameInfo): 'error' | 'user' | 'system' | 'async' {
    if (frame.isNative) return 'system';
    if (frame.isAsync) return 'async';
    if (frame.fileName.includes('node_modules')) return 'system';
    return 'user';
  }

  exportToMermaid(diagram: FlowDiagram): string {
    let mermaid = 'graph TD\n';

    diagram.edges.forEach(edge => {
      mermaid += `  ${edge.from} --> ${edge.to}\n`;
    });

    diagram.nodes.forEach(node => {
      mermaid += `  ${node.id}["${node.label}"]\n`;
    });

    return mermaid;
  }
}
```

## Best Practices para Análisis de Stack Traces

### 1. Captura Completa
- Siempre capturar el stack trace completo
- Incluir timestamp y contexto del error
- Guardar variables de estado relevantes
- Registrar información del entorno

### 2. Análisis Sistemático
- Leer de arriba hacia abajo (error → causa)
- Identificar frames críticos vs de sistema
- Reconstruir el contexto de cada llamada
- Buscar patrones y anomalías

### 3. Documentación
- Documentar hallazgos importantes
- Crear base de conocimiento de errores comunes
- Compartir lecciones aprendidas con el equipo
- Automatizar detección de patrones conocidos

### 4. Mejora Continua
- Analizar tendencias de errores
- Identificar áreas problemáticas del código
- Mejorar logging y manejo de errores
- Prevenir errores similares en el futuro

## Checklist de Análisis

### Captura Inicial
- [ ] Stack trace completo capturado
- [ ] Mensaje de error exacto registrado
- [ ] Timestamp y contexto anotados
- [ ] Variables de estado guardadas

### Análisis Estructural
- [ ] Cada frame analizado individualmente
- [ ] Relaciones entre frames identificadas
- [ ] Frames críticos vs sistema diferenciados
- [ ] Patrones anómalos detectados

### Reconstrucción de Contexto
- [ ] Flujo de ejecución reconstruido
- [ ] Variables y estado en cada punto evaluados
- [ ] Condiciones que llevaron al error identificadas
- [ ] Causa raíz determinada

### Validación y Documentación
- [ ] Hipótesis de causa verificada
- [ ] Solución propuesta y probada
- [ ] Hallazgos documentados
- [ ] Medidas preventivas implementadas