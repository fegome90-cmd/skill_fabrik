import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'node:path';

type ActivationModule = {
  buildActivationConfig: (skillName: string, rules: any) => any;
  ActivationEngine: new (signals: any[], config: any) => {
    evaluate(skillName: string, prompt: string, ctx: Record<string, unknown>): Promise<{
      activate: boolean;
      finalScore: number;
      reason: string;
      reasoning: string[];
      signals: unknown;
    }>;
  };
  KeywordMatchSignal: new (keywords: string[]) => unknown;
  Signal: unknown;
};

async function loadActivationModule(): Promise<ActivationModule> {
  try {
    const mod: any = await import('@skills-fabrik/router');
    if (mod?.activation) return mod.activation as ActivationModule;
    return mod as ActivationModule;
  } catch (error) {
    return {
      buildActivationConfig: () => ({ allowList: [], denyList: [], threshold: 0.6 }),
      ActivationEngine: class {
        constructor(_signals: any[], _config: any) {}
        async evaluate(_skill: string, _prompt: string) {
          return {
            activate: false,
            finalScore: 0,
            reason: 'Router module unavailable (@skills-fabrik/router)',
            reasoning: [],
            signals: {},
          };
        }
      },
      KeywordMatchSignal: class {
        constructor(_keywords: string[]) {}
      },
      Signal: class {},
    } satisfies ActivationModule;
  }
}

export function activationCommand(program: Command) {
  program
    .command('activation')
    .description('Test skill activation decision using ActivationEngine')
    .requiredOption('-s, --skill <name>', 'Skill name (as in configs/skill-rules.json)')
    .requiredOption('-p, --prompt <text>', 'User prompt to evaluate')
    .option('--threshold <num>', 'Override threshold (0..1)')
    .option('--allow <pattern...>', 'Add allowList regex patterns')
    .option('--deny <pattern...>', 'Add denyList regex patterns')
    .option('--keywords <kw...>', 'Keywords for keywordMatch signal (override)')
    .option('--explain', 'Print reasoning and signals', false)
    .action(async (opts) => {
      const routerActivation = await loadActivationModule();
      const skillName: string = opts.skill;
      const prompt: string = opts.prompt;

      const rulesPath = path.resolve(process.cwd(), 'configs/skill-rules.json');
      if (!(await fs.pathExists(rulesPath))) {
        console.error(`configs/skill-rules.json not found at ${rulesPath}`);
        process.exit(1);
      }
      const rules = await fs.readJSON(rulesPath);

      const config = routerActivation.buildActivationConfig(skillName, rules);
      if (typeof opts.threshold === 'string') config.threshold = clamp01(Number(opts.threshold));
      if (Array.isArray(opts.allow)) config.allowList = [...config.allowList, ...opts.allow];
      if (Array.isArray(opts.deny)) config.denyList = [...config.denyList, ...opts.deny];

      // Assemble signals (baseline: keywordMatch). Later: intent, path, content, etc.
      const keywords: string[] = Array.isArray(opts.keywords)
        ? opts.keywords
        : extractKeywordsFromRules(skillName, rules);
      const signals: any[] = [
        new routerActivation.KeywordMatchSignal(keywords)
      ];

      const engine = new routerActivation.ActivationEngine(signals, config);
      const decision = await engine.evaluate(skillName, prompt, {});

      console.log(JSON.stringify({
        activate: decision.activate,
        finalScore: Number(decision.finalScore.toFixed(4)),
        reason: decision.reason
      }, null, 2));

      if (opts.explain) {
        console.log('\nReasoning:');
        for (const line of decision.reasoning) console.log(line);
        console.log('\nSignals:');
        console.log(JSON.stringify(decision.signals, null, 2));
      }
    });
}

function extractKeywordsFromRules(skillName: string, rules: any): string[] {
  const skill = rules[skillName] || {};
  const kw: string[] = skill?.promptTriggers?.keywords || [];
  return Array.isArray(kw) ? kw : [];
}

function clamp01(n: number): number {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
