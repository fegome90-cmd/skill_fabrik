/**
 * KPI Dashboard Generator
 * 
 * Genera dashboard markdown con métricas en pares (velocidad + calidad)
 * e interpretación holística.
 */

import { KPISummary, KPIAggregator } from './aggregator.js';
import { writeFile, mkdir } from 'fs/promises';
import { resolve } from 'path';

export interface DashboardOptions {
  outputPath?: string;
  timeRange?: { start: Date; end: Date };
  includeRaw?: boolean;
}

export class DashboardGenerator {
  constructor(private aggregator: KPIAggregator) {}

  async generate(options: DashboardOptions = {}): Promise<string> {
    const summary = await this.aggregator.aggregate(options.timeRange);
    const markdown = this.generateMarkdown(summary, options);
    
    if (options.outputPath) {
      const fullPath = resolve(process.cwd(), options.outputPath);
      const dir = resolve(fullPath, '..');
      await mkdir(dir, { recursive: true });
      await writeFile(fullPath, markdown, 'utf-8');
    }

    return markdown;
  }

  private generateMarkdown(summary: KPISummary, options: DashboardOptions): string {
    const { metricPairs, thresholdChecks, skillActivations, timeRange, totalEvents } = summary;
    const { velocity, quality } = metricPairs;

    const holisticEmoji = {
      excellent: '🟢',
      good: '🟡',
      warning: '🟠',
      critical: '🔴',
    }[thresholdChecks.holisticStatus];

    let md = `# Dashboard de KPIs - Skills Fabric

**Estado Holístico**: ${holisticEmoji} **${thresholdChecks.holisticStatus.toUpperCase()}**

**Período**: ${timeRange.start.toISOString().split('T')[0]} - ${timeRange.end.toISOString().split('T')[0]}  
**Total de Eventos**: ${totalEvents}

---

## 📊 Métricas en Pares

### ⚡ Velocidad (Activación y Eficiencia)

| Métrica | Valor | Umbral | Estado |
|---------|-------|--------|--------|
| **Tasa de Activación de Skills** | ${velocity.skillActivationRate.toFixed(2)} skills/op | ≥ 0.5 | ${this.getStatusEmoji(thresholdChecks.activationPrecision)} |
| **Tokens por Operación** | ${velocity.tokensPerOperation.toLocaleString()} tokens | ≤ 25,000 | ${this.getStatusEmoji(thresholdChecks.tokensReduction)} |
| **Latencia Promedio** | ${velocity.meanActivationLatency} ms | < 10,000 ms | ${velocity.meanActivationLatency < 10000 ? '✅' : '⚠️'} |
| **Divulgación Progresiva** | ${velocity.progressiveDisclosureRate.toFixed(1)} recursos/op | ≤ 2 | ${velocity.progressiveDisclosureRate <= 2 ? '✅' : '⚠️'} |

### 🎯 Calidad (Adherencia y Prevención)

| Métrica | Valor | Umbral | Estado |
|---------|-------|--------|--------|
| **Tasa de Adherencia** | ${quality.skillAdherenceRate.toFixed(1)}% | ≥ 80% | ${this.getStatusEmoji(thresholdChecks.adherenceRate)} |
| **Zero Errors Rate** | ${quality.zeroErrorsRate.toFixed(1)}% | ≥ 95% | ${this.getStatusEmoji(thresholdChecks.zeroErrorsRate)} |
| **Latencia de Corrección** | ${quality.meanFixLatency.toFixed(1)}s | < 5 min | ${quality.meanFixLatency < 300 ? '✅' : '⚠️'} |
| **Efectividad de Guardrails** | ${quality.guardrailEffectiveness.toFixed(1)}% | ≥ 90% | ${quality.guardrailEffectiveness >= 90 ? '✅' : '⚠️'} |

---

## 🔍 Interpretación Holística

${this.generateHolisticInterpretation(thresholdChecks, velocity, quality)}

---

## 📈 Activaciones por Skill

${Object.keys(skillActivations).length > 0
  ? Object.entries(skillActivations)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([skill, count]) => `- **${skill}**: ${count} activaciones`)
      .join('\n')
  : '*No hay activaciones registradas*'}

---

## 🎯 Próximos Pasos

${this.generateRecommendations(thresholdChecks, velocity, quality)}

---

*Generado el ${new Date().toISOString()}*
`;

    if (options.includeRaw && summary.totalEvents > 0) {
      md += `\n\n## 📋 Datos Crudos\n\n\`\`\`json\n${JSON.stringify(summary, null, 2)}\n\`\`\`\n`;
    }

    return md;
  }

  private getStatusEmoji(check: { status: 'pass' | 'fail' | 'warning' }): string {
    return {
      pass: '✅',
      warning: '⚠️',
      fail: '❌',
    }[check.status];
  }

  private generateHolisticInterpretation(
    checks: KPISummary['thresholdChecks'],
    velocity: KPISummary['metricPairs']['velocity'],
    quality: KPISummary['metricPairs']['quality']
  ): string {
    const { holisticStatus } = checks;
    
    if (holisticStatus === 'excellent') {
      return `### ✅ Estado: Excelente

**Velocidad y Calidad en equilibrio óptimo**: El sistema está operando de manera eficiente con alta calidad.

- ✅ Activación de skills funcionando correctamente
- ✅ Reducción de tokens dentro del objetivo
- ✅ Alta adherencia a guías activas
- ✅ Prácticamente sin errores residuales

**Conclusión**: El sistema Skills Fabric está funcionando de manera óptima.`;
    }

    if (holisticStatus === 'good') {
      return `### 🟡 Estado: Bueno

**Velocidad y Calidad en buen nivel**, con algunas áreas de mejora.

- ${checks.tokensReduction.status === 'pass' ? '✅' : '⚠️'} Tokens: ${checks.tokensReduction.status === 'pass' ? 'En objetivo' : 'Requiere optimización'}
- ${checks.adherenceRate.status === 'pass' ? '✅' : '⚠️'} Adherencia: ${checks.adherenceRate.value.toFixed(1)}% (objetivo: ≥80%)
- ${checks.zeroErrorsRate.status === 'pass' ? '✅' : '⚠️'} Zero Errors: ${checks.zeroErrorsRate.value.toFixed(1)}% (objetivo: ≥95%)

**Recomendación**: Revisar métricas con estado ⚠️ para optimización.`;
    }

    if (holisticStatus === 'warning') {
      return `### 🟠 Estado: Advertencia

**Se detectan desequilibrios entre Velocidad y Calidad**. Requiere atención.

- ${checks.tokensReduction.status === 'fail' ? '❌' : '⚠️'} Tokens: Reducción ${checks.tokensReduction.value.toFixed(1)}% (objetivo: ≥15%)
- ${checks.adherenceRate.status === 'fail' ? '❌' : '⚠️'} Adherencia: ${checks.adherenceRate.value.toFixed(1)}% (objetivo: ≥80%)
- ${checks.zeroErrorsRate.status === 'fail' ? '❌' : '⚠️'} Zero Errors: ${checks.zeroErrorsRate.value.toFixed(1)}% (objetivo: ≥95%)

**Acción Requerida**: Revisar configuración de skills y guardrails.`;
    }

    return `### 🔴 Estado: Crítico

**Desequilibrio crítico detectado**. El sistema no está cumpliendo objetivos de calidad o velocidad.

**Áreas Críticas**:
${checks.activationPrecision.status === 'fail' ? '- ❌ Activación de skills por debajo del umbral\n' : ''}
${checks.tokensReduction.status === 'fail' ? '- ❌ Reducción de tokens insuficiente\n' : ''}
${checks.adherenceRate.status === 'fail' ? '- ❌ Adherencia a guías muy baja\n' : ''}
${checks.zeroErrorsRate.status === 'fail' ? '- ❌ Muchos errores residuales\n' : ''}

**Acción Urgente**: Revisar configuración, triggers de skills y guardrails inmediatamente.`;
  }

  private generateRecommendations(
    checks: KPISummary['thresholdChecks'],
    velocity: KPISummary['metricPairs']['velocity'],
    quality: KPISummary['metricPairs']['quality']
  ): string {
    const recommendations: string[] = [];

    if (checks.tokensReduction.status !== 'pass') {
      recommendations.push('- **Optimizar tokens**: Revisar divulgación progresiva y reducir carga inicial');
    }

    if (checks.adherenceRate.status !== 'pass') {
      recommendations.push('- **Mejorar adherencia**: Revisar triggers de skills y ajustar thresholds');
    }

    if (checks.zeroErrorsRate.status !== 'pass') {
      recommendations.push('- **Reducir errores residuales**: Mejorar guardrails y auto-resolver');
    }

    if (velocity.meanActivationLatency > 10000) {
      recommendations.push('- **Reducir latencia**: Optimizar carga de skills y recursos');
    }

    if (quality.meanFixLatency > 300) {
      recommendations.push('- **Acelerar corrección**: Mejorar detección temprana y auto-resolver');
    }

    if (recommendations.length === 0) {
      return '*Todas las métricas dentro de objetivos. Mantener monitoreo continuo.*';
    }

    return recommendations.join('\n');
  }
}

