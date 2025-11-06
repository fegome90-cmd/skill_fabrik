import fs from 'fs-extra';
import * as path from 'path';
const { readFile, pathExists } = fs;
export function extractPhaseNumber(phase) {
    const match = phase.match(/^F(\d+)$/i);
    if (!match) {
        throw new Error(`Invalid phase format: ${phase}. Expected format: F0, F1, F2, etc.`);
    }
    return parseInt(match[1], 10);
}
export async function generatePlanStart(phase) {
    const templatePath = path.join(process.cwd(), 'cloop', 'plan-start.md');
    if (!(await pathExists(templatePath))) {
        throw new Error(`Template not found: ${templatePath}`);
    }
    const template = await readFile(templatePath, { encoding: 'utf-8' });
    const phaseNum = extractPhaseNumber(phase);
    // Interpolate variables
    return template
        .replace(/\{phase\}/g, phase)
        .replace(/\{phaseNum\}/g, phaseNum.toString())
        .replace(/\{date\}/g, new Date().toISOString().split('T')[0]);
}
export async function generatePresprint(phase, metrics) {
    const templatePath = path.join(process.cwd(), 'cloop', 'presprint.md');
    if (!(await pathExists(templatePath))) {
        throw new Error(`Template not found: ${templatePath}`);
    }
    const template = await readFile(templatePath, { encoding: 'utf-8' });
    const phaseNum = extractPhaseNumber(phase);
    // Interpolate variables
    let result = template
        .replace(/\{phase\}/g, phase)
        .replace(/\{phaseNum\}/g, phaseNum.toString())
        .replace(/\{date\}/g, new Date().toISOString().split('T')[0]);
    // Add metrics summary if provided
    if (Object.keys(metrics).length > 0) {
        const metricsSection = `\n## Métricas Recolectadas\n\`\`\`json\n${JSON.stringify(metrics, null, 2)}\n\`\`\``;
        result = result.replace(/\{metrics\}/g, metricsSection);
    }
    else {
        result = result.replace(/\{metrics\}/g, '');
    }
    return result;
}
export async function validateQualityGate(gate, _phase) {
    const checklistPath = path.join(process.cwd(), 'cloop', 'quality-gates-checklist.md');
    if (!(await pathExists(checklistPath))) {
        // If checklist doesn't exist, validation passes (optional)
        return true;
    }
    // For now, basic validation - full implementation would parse checklist
    // and verify phase documents contain required sections
    const expectedGates = ['Clarify', 'Layout', 'Operate', 'Observe', 'Reflect'];
    const gateName = gate.charAt(0).toUpperCase() + gate.slice(1);
    return expectedGates.includes(gateName);
}
export async function validatePreviousPhase(phaseNum) {
    if (phaseNum === 0) {
        return; // F0 has no previous phase
    }
    const previousPhase = `F${phaseNum - 1}`;
    const previousPresprint = path.join(process.cwd(), 'cloop', 'phases', `${previousPhase}-presprint.md`);
    if (!(await pathExists(previousPresprint))) {
        throw new Error(`Previous phase ${previousPhase} not completed. ` +
            `Expected presprint at: ${previousPresprint}`);
    }
}
//# sourceMappingURL=cloop-templates.js.map