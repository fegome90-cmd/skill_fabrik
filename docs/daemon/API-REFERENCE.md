# Daemon API Reference (OpenAPI Stub)

```yaml
openapi: 3.0.3
info:
  title: Skills Fabrik Daemon API
  version: 0.1.0
servers:
  - url: http://localhost:3030
paths:
  /activate:
    post:
      summary: Activate skills based on intent and context
      security:
        - ApiKeyAuth: []
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ActivateRequest'
      responses:
        '200':
          description: Activation results
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/ActivateResponse'
        '400': { description: Bad request }
        '401': { description: Unauthorized }
        '500': { description: Schema/Server error }
  /api/v1/auth/token:
    post:
      summary: Issue a JWT (enabled only if DAEMON_JWT_SECRET is set)
      requestBody:
        required: false
        content:
          application/json:
            schema:
              type: object
              properties:
                sub: { type: string }
                expiresIn: { type: integer, default: 900 }
      responses:
        '200':
          description: JWT issued
          content:
            application/json:
              schema:
                type: object
                properties:
                  token: { type: string }
                  token_type: { type: string, example: Bearer }
                  expires_in: { type: integer }
        '404': { description: Not enabled }
components:
  securitySchemes:
    ApiKeyAuth:
      type: apiKey
      in: header
      name: x-api-key
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    ActivateRequest:
      type: object
      required: [intent, context]
      properties:
        intent: { type: string, minLength: 1 }
        context:
          type: object
          properties:
            files: { type: array, items: { type: string } }
            activeFile: { type: string }
            activeFileContent: { type: string }
            workingDirectory: { type: string }
            environment: { type: object, additionalProperties: { type: string } }
            editor: { type: string }
        options:
          type: object
          properties:
            maxCandidates: { type: integer, minimum: 1, maximum: 10 }
            maxResults: { type: integer, minimum: 1, maximum: 10 }
            threshold: { type: number, minimum: 0, maximum: 1 }
            includeMetadata: { type: boolean }
    ActivateResponse:
      type: object
      required: [success, timestamp]
      properties:
        success: { type: boolean }
        timestamp: { type: string, format: date-time }
        results:
          type: array
          items:
            type: object
            required: [skillId, confidence]
            properties:
              skillId: { type: string }
              confidence: { type: number, minimum: 0, maximum: 1 }
              reason: { type: string }
              metadata: { type: object }
        metrics: { type: object }
        error:
          type: object
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: object }
```

Notes
- Security is optional and enabled per env (DAEMON_API_KEY / DAEMON_JWT_SECRET).
- This is a stub; extend as endpoints evolve.
