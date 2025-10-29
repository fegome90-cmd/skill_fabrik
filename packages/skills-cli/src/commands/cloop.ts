import { Command } from 'commander';
import fs from 'fs-extra';
import * as path from 'path';

const { writeFile, pathExists, ensureDir, readJson, writeJson } = fs;
import {
  generatePlanStart,
  validatePreviousPhase,
  validateQualityGate,
  extractPhaseNumber,
} from '../utils/cloop-templates.js';
import { Logger } from '../utils/logger.js';

export function cloopCommand(program: Command) {
  const cloopCmd = program
    .command('cloop')
    .description('CLOOP methodology commands (start/complete phases)');

  cloopCmd
    .command('start')
    .description('Start a CLOOP phase by creating plan-start.md')
    .argument('<phase>', 'Phase identifier (e.g., F0, F1)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (phase: string, options: { verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info(`Starting CLOOP phase: ${phase}`);

        // Validate phase format and check previous phase
        const phaseNum = extractPhaseNumber(phase);
        if (phaseNum > 0) {
          await validatePreviousPhase(phaseNum);
          logger.success(`Previous phase F${phaseNum - 1} validated`);
        }

        // Ensure phases directory exists
        const phasesDir = path.join(process.cwd(), 'cloop', 'phases');
        await ensureDir(phasesDir);

        // Generate plan-start.md content
        const content = await generatePlanStart(phase);

        // Write file
        const outputPath = path.join(phasesDir, `${phase}-plan-start.md`);
        await writeFile(outputPath, content);

        // Validate Quality Gate: Clarify
        const gateValid = await validateQualityGate('clarify', phaseNum);
        if (!gateValid) {
          logger.warning('Quality Gate Clarify validation incomplete');
        }

        logger.success(`Created: ${outputPath}`);
        logger.info('Next steps: Complete the plan-start.md template and proceed to Layout phase');

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });

  cloopCmd
    .command('complete')
    .description('Complete a CLOOP phase by creating presprint.md')
    .argument('<phase>', 'Phase identifier (e.g., F0, F1)')
    .option('-v, --verbose', 'Verbose output')
    .action(async (phase: string, options: { verbose?: boolean }) => {
      const logger = new Logger(options.verbose);

      try {
        logger.info(`Completing CLOOP phase: ${phase}`);

        const phaseNum = extractPhaseNumber(phase);

        // Validate that plan-start exists
        const planStartPath = path.join(process.cwd(), 'cloop', 'phases', `${phase}-plan-start.md`);

        if (!(await pathExists(planStartPath))) {
          throw new Error(
            `Plan-start not found: ${planStartPath}. ` + `Run 'cloop start ${phase}' first.`
          );
        }

        // Validate Quality Gate: Observe (DoD validation)
        const observeGateValid = await validateQualityGate('observe', phaseNum);
        if (!observeGateValid) {
          logger.warning('Quality Gate Observe validation incomplete - continue?');
        }

        // Collect metrics (placeholder - would read from actual phase execution)
        const metrics = {
          phase,
          phaseNum,
          completedAt: new Date().toISOString(),
          status: 'completed',
        };

        // Generate presprint.md content
        const { generatePresprint } = await import('../utils/cloop-templates.js');
        const content = await generatePresprint(phase, metrics);

        // Write presprint file
        const presprintPath = path.join(process.cwd(), 'cloop', 'phases', `${phase}-presprint.md`);
        await writeFile(presprintPath, content);
        logger.success(`Created: ${presprintPath}`);

        // Update metrics file
        const metricsPath = path.join(process.cwd(), 'metrics', 'cloop-metrics.json');
        await ensureDir(path.dirname(metricsPath));

        let allMetrics: Record<string, unknown> = {};
        if (await pathExists(metricsPath)) {
          allMetrics = await readJson(metricsPath);
        }

        allMetrics[phase] = metrics;
        await writeJson(metricsPath, allMetrics, { spaces: 2 });
        logger.success(`Updated: ${metricsPath}`);

        // Emit KPI
        const { emitKPI } = await import('../utils/kpi-emitter.js');
        await emitKPI({
          timestamp: new Date().toISOString(),
          type: 'cloop-phase-complete',
          data: { phase, phaseNum, metrics },
        });
        logger.success('KPI emitted to obs/kpi/events.jsonl');

        logger.success(`Phase ${phase} completed successfully`);
        logger.info(`Next phase: F${phaseNum + 1}`);

        process.exit(0);
      } catch (error) {
        logger.error(error instanceof Error ? error.message : String(error));
        process.exit(2);
      }
    });
}
