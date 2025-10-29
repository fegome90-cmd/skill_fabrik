/**
 * Supabase Gateway para MemTech
 * Implementa conexión segura a Supabase usando service_role_key
 * Mantiene fallback a Redis local para alta disponibilidad
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Redis } from 'ioredis';

interface MemTechSession {
  id: string;
  created_at: string;
  updated_at: string;
  cloop_phase?: string;
  bmcc_component?: string;
  session_summary?: string;
  memory_layer: 'L0' | 'L1' | 'L2' | 'L3';
  relevance_score: number;
  access_frequency: number;
  user_id?: string;
  environment: string;
}

interface MemTechQuery {
  id: string;
  session_id: string;
  created_at: string;
  query_type: 'mem.resolve' | 'router.resolveFast' | 'mem.search' | 'checkpoint.create';
  input_text: string;
  context_data?: any;
  results_count: number;
  execution_time_ms?: number;
  success: boolean;
  error_message?: string;
  memory_usage_bytes?: number;
  cache_hit: boolean;
}

interface MemTechCheckpoint {
  id: string;
  session_id: string;
  created_at: string;
  checkpoint_id: string;
  checkpoint_data?: any;
  status: 'active' | 'archived' | 'deleted';
  checkpoint_size_bytes?: number;
  compression_ratio?: number;
}

export class SupabaseGateway {
  private supabase: SupabaseClient;
  private redis: Redis;
  private fallbackEnabled: boolean;

  constructor() {
    // Configuración Supabase
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error('SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY son requeridos');
    }

    this.supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Configuración Redis fallback
    this.fallbackEnabled = process.env.FALLBACK_TO_LOCAL === 'true';
    if (this.fallbackEnabled) {
      this.redis = new Redis(process.env.LOCAL_REDIS_URL || 'redis://localhost:6379');
    }
  }

  /**
   * Implementa mem.resolve() - Consulta contexto L0 (hot data)
   */
  async memResolve(query: string, tags: string[]): Promise<any> {
    const startTime = Date.now();

    try {
      // Buscar en cache Redis primero
      if (this.fallbackEnabled) {
        const cacheKey = `mem_resolve:${Buffer.from(query).toString('base64')}`;
        const cached = await this.redis.get(cacheKey);
        if (cached) {
          return {
            L0: JSON.parse(cached),
            cache_hit: true,
            execution_time_ms: Date.now() - startTime,
          };
        }
      }

      // Consulta a Supabase
      const { data, error } = await this.supabase
        .from('memtech_sessions')
        .select(
          `
          id,
          created_at,
          cloop_phase,
          bmcc_component,
          session_summary,
          memory_layer,
          relevance_score,
          access_frequency
        `
        )
        .eq('memory_layer', 'L0')
        .gte('relevance_score', 0.7)
        .order('relevance_score', { ascending: false })
        .limit(10);

      if (error) throw error;

      const result = {
        L0:
          data?.map(session => ({
            type: 'current_context',
            data: session.session_summary || 'Sistema MemTech operativo',
            relevance: session.relevance_score,
            cloop_phase: session.cloop_phase,
            bmcc_component: session.bmcc_component,
          })) || [],
        cache_hit: false,
        execution_time_ms: Date.now() - startTime,
      };

      // Guardar en cache Redis
      if (this.fallbackEnabled) {
        const cacheKey = `mem_resolve:${Buffer.from(query).toString('base64')}`;
        await this.redis.setex(cacheKey, 300, JSON.stringify(result.L0)); // 5 min TTL
      }

      // Log de la consulta
      await this.logQuery('mem.resolve', query, result.L0.length, Date.now() - startTime, true);

      return result;
    } catch (error) {
      console.error('Error en mem.resolve:', error);

      // Fallback a Redis si Supabase falla
      if (this.fallbackEnabled) {
        try {
          const fallbackData = await this.redis.get('memtech:fallback:L0');
          if (fallbackData) {
            return {
              L0: JSON.parse(fallbackData),
              cache_hit: true,
              execution_time_ms: Date.now() - startTime,
              fallback: true,
            };
          }
        } catch (redisError) {
          console.error('Error en fallback Redis:', redisError);
        }
      }

      throw error;
    }
  }

  /**
   * Implementa router.resolveFast() - Consulta L1/L2 (cached data)
   */
  async routerResolveFast(query: string, tags: string[]): Promise<any> {
    const startTime = Date.now();

    try {
      // Consulta L1 (Cache)
      const { data: l1Data, error: l1Error } = await this.supabase
        .from('memtech_sessions')
        .select('*')
        .eq('memory_layer', 'L1')
        .gte('relevance_score', 0.6)
        .order('access_frequency', { ascending: false })
        .limit(5);

      if (l1Error) throw l1Error;

      // Consulta L2 (Persistent)
      const { data: l2Data, error: l2Error } = await this.supabase
        .from('memtech_sessions')
        .select('*')
        .eq('memory_layer', 'L2')
        .gte('relevance_score', 0.5)
        .order('created_at', { ascending: false })
        .limit(5);

      if (l2Error) throw l2Error;

      const result = {
        L1:
          l1Data?.map(session => ({
            type: 'cached_patterns',
            data: session.session_summary || 'Patrones de consulta similares',
            relevance: session.relevance_score,
            access_frequency: session.access_frequency,
          })) || [],
        L2:
          l2Data?.map(session => ({
            type: 'historical_issues',
            data: session.session_summary || 'Problemas similares resueltos anteriormente',
            relevance: session.relevance_score,
            created_at: session.created_at,
          })) || [],
        execution_time_ms: Date.now() - startTime,
      };

      // Log de la consulta
      await this.logQuery(
        'router.resolveFast',
        query,
        result.L1.length + result.L2.length,
        Date.now() - startTime,
        true
      );

      return result;
    } catch (error) {
      console.error('Error en router.resolveFast:', error);
      throw error;
    }
  }

  /**
   * Implementa mem.search() - Consulta L3 (long-term data)
   */
  async memSearch(query: string, tags: string[]): Promise<any> {
    const startTime = Date.now();

    try {
      // Consulta L3 (Long-term)
      const { data: l3Data, error: l3Error } = await this.supabase
        .from('memtech_sessions')
        .select('*')
        .eq('memory_layer', 'L3')
        .gte('relevance_score', 0.4)
        .order('created_at', { ascending: false })
        .limit(10);

      if (l3Error) throw l3Error;

      // Buscar patrones históricos
      const { data: patternsData, error: patternsError } = await this.supabase
        .from('memtech_queries')
        .select('query_type, input_text, success, created_at')
        .eq('success', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (patternsError) throw patternsError;

      // Procesar patrones
      const patterns = this.processPatterns(patternsData || []);

      const result = {
        L3:
          l3Data?.map(session => ({
            type: 'long_term_patterns',
            data: session.session_summary || 'Patrones de resolución a largo plazo',
            relevance: session.relevance_score,
            created_at: session.created_at,
          })) || [],
        patterns: patterns,
        decisions: this.extractDecisions(l3Data || []),
        execution_time_ms: Date.now() - startTime,
      };

      // Log de la consulta
      await this.logQuery('mem.search', query, result.L3.length, Date.now() - startTime, true);

      return result;
    } catch (error) {
      console.error('Error en mem.search:', error);
      throw error;
    }
  }

  /**
   * Implementa checkpoint.create() - Crear checkpoint de sesión
   */
  async checkpointCreate(sessionId: string, input: string, contextSummary: any): Promise<any> {
    const startTime = Date.now();

    try {
      // Crear o actualizar sesión
      const { data: sessionData, error: sessionError } = await this.supabase
        .from('memtech_sessions')
        .upsert({
          id: sessionId,
          cloop_phase: contextSummary.cloop_phase || 'Execute',
          bmcc_component: contextSummary.bmcc_component || 'MemTech',
          session_summary: input.substring(0, 500), // Limitar longitud
          memory_layer: 'L0',
          relevance_score: 0.9,
          access_frequency: 1,
          environment: process.env.NODE_ENV || 'development',
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Crear checkpoint
      const checkpointId = `checkpoint-${sessionId}`;
      const checkpointData = {
        sessionId,
        input,
        contextSummary,
        timestamp: new Date().toISOString(),
      };

      const { data: checkpointDataResult, error: checkpointError } = await this.supabase
        .from('memtech_checkpoints')
        .insert({
          session_id: sessionId,
          checkpoint_id: checkpointId,
          checkpoint_data: checkpointData,
          status: 'active',
          checkpoint_size_bytes: JSON.stringify(checkpointData).length,
          compression_ratio: 1.0,
        })
        .select()
        .single();

      if (checkpointError) throw checkpointError;

      // Log de la consulta
      await this.logQuery('checkpoint.create', input, 1, Date.now() - startTime, true);

      return {
        checkpointId: checkpointId,
        sessionId: sessionId,
        timestamp: new Date().toISOString(),
        execution_time_ms: Date.now() - startTime,
      };
    } catch (error) {
      console.error('Error en checkpoint.create:', error);
      throw error;
    }
  }

  /**
   * Log de consultas para análisis y debugging
   */
  private async logQuery(
    queryType: string,
    input: string,
    resultsCount: number,
    executionTime: number,
    success: boolean
  ): Promise<void> {
    try {
      await this.supabase.from('memtech_queries').insert({
        session_id: `log-${Date.now()}`,
        query_type: queryType as any,
        input_text: input.substring(0, 1000), // Limitar longitud
        results_count: resultsCount,
        execution_time_ms: executionTime,
        success: success,
        memory_usage_bytes: process.memoryUsage().heapUsed,
        cache_hit: false,
      });
    } catch (error) {
      console.error('Error logging query:', error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Procesar patrones históricos
   */
  private processPatterns(queries: any[]): any[] {
    const patternMap = new Map();

    queries.forEach(query => {
      const key = query.query_type;
      if (!patternMap.has(key)) {
        patternMap.set(key, {
          pattern: key,
          frequency: 0,
          last_seen: query.created_at,
          success_rate: 0,
        });
      }

      const pattern = patternMap.get(key);
      pattern.frequency++;
      pattern.success_rate = query.success
        ? (pattern.success_rate * (pattern.frequency - 1) + 1) / pattern.frequency
        : (pattern.success_rate * (pattern.frequency - 1)) / pattern.frequency;
    });

    return Array.from(patternMap.values());
  }

  /**
   * Extraer decisiones arquitectónicas
   */
  private extractDecisions(sessions: any[]): any[] {
    return sessions
      .filter(session => session.bmcc_component === 'ADR' || session.cloop_phase === 'Formulate')
      .map(session => ({
        decision: `ADR-${session.id.substring(0, 8)}`,
        topic: session.session_summary || 'Decisión arquitectónica',
        date: session.created_at.split('T')[0],
        status: 'implemented',
      }));
  }

  /**
   * Cerrar conexiones
   */
  async close(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default SupabaseGateway;
