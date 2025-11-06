/**
 * Validation Schemas for Router Endpoints
 * Task: SF-STABILITY-2025-T1.1
 * Date: 2025-11-05
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';

// Initialize Ajv with all errors
const ajv = new Ajv({ 
  allErrors: true,
  removeAdditional: false,
  useDefaults: true,
  coerceTypes: false
});

// Add format validators
addFormats(ajv);

/**
 * Schema for /pre-invoke endpoint
 */
export const preInvokeSchema = {
  type: 'object',
  required: ['prompt'],
  properties: {
    prompt: { 
      type: 'string', 
      minLength: 1, 
      maxLength: 10000 
    },
    cwd: { 
      type: 'string',
      pattern: '^[a-zA-Z0-9/_. -]+$',
      maxLength: 500
    },
    openFiles: { 
      type: 'array', 
      items: { 
        type: 'string',
        maxLength: 500
      },
      maxItems: 100
    },
    activeFile: { 
      type: 'string',
      maxLength: 500
    },
    activeFileContent: { 
      type: 'string', 
      maxLength: 1000000  // 1MB max
    },
    editor: { 
      type: 'string', 
      enum: ['cursor', 'vscode', 'cli', 'router', 'unknown']
    },
    threshold: {
      type: 'number',
      minimum: 0,
      maximum: 1
    }
  },
  additionalProperties: false
};

/**
 * Schema for /guardrails endpoint
 */
export const guardrailsSchema = {
  type: 'object',
  required: ['editLog'],
  properties: {
    editLog: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'operation'],
        properties: {
          file: { 
            type: 'string',
            minLength: 1,
            maxLength: 500
          },
          operation: {
            type: 'string',
            enum: ['create', 'update', 'delete', 'rename']
          },
          content: {
            type: 'string',
            maxLength: 1000000
          },
          oldPath: {
            type: 'string',
            maxLength: 500
          },
          newPath: {
            type: 'string',
            maxLength: 500
          }
        },
        additionalProperties: false
      },
      maxItems: 100
    },
    cwd: {
      type: 'string',
      pattern: '^[a-zA-Z0-9/_. -]+$',
      maxLength: 500
    }
  },
  additionalProperties: false
};

/**
 * Schema for /stop endpoint
 */
export const stopSchema = {
  type: 'object',
  required: ['response'],
  properties: {
    response: {
      type: 'object',
      required: ['content'],
      properties: {
        content: {
          type: 'string',
          maxLength: 100000
        },
        metadata: {
          type: 'object'
        }
      },
      additionalProperties: true
    },
    cwd: {
      type: 'string',
      pattern: '^[a-zA-Z0-9/_. -]+$',
      maxLength: 500
    }
  },
  additionalProperties: false
};

// Compile schemas
export const validatePreInvoke = ajv.compile(preInvokeSchema);
export const validateGuardrails = ajv.compile(guardrailsSchema);
export const validateStop = ajv.compile(stopSchema);

/**
 * Helper function to format validation errors
 */
export function formatValidationErrors(errors: any[] | null | undefined): string {
  if (!errors || errors.length === 0) {
    return 'Validation failed';
  }
  
  return errors
    .map(err => {
      const path = err.instancePath || err.dataPath || 'root';
      return `${path}: ${err.message}`;
    })
    .join(', ');
}

