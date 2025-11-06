import fs from 'fs-extra';
import path from 'node:path';
async function loadActivationModule() {
    try {
        const mod = await import('@skills-fabrik/router');
        if (mod?.activation)
            return mod.activation;
        return mod;
    }
    catch (error) {
        return {
            buildActivationConfig: () => ({ allowList: [], denyList: [], threshold: 0.6 }),
            ActivationEngine: class {
                constructor(_signals, _config) { }
                async evaluate(_skill, _prompt) {
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
                constructor(_keywords) { }
            },
            Signal: class {
            },
        };
    }
}
export function activationCommand(program) {
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
        const skillName = opts.skill;
        const prompt = opts.prompt;
        const rulesPath = path.resolve(process.cwd(), 'configs/skill-rules.json');
        if (!(await fs.pathExists(rulesPath))) {
            console.error(`configs/skill-rules.json not found at ${rulesPath}`);
            process.exit(1);
        }
        const rules = await fs.readJSON(rulesPath);
        const config = routerActivation.buildActivationConfig(skillName, rules);
        if (typeof opts.threshold === 'string')
            config.threshold = clamp01(Number(opts.threshold));
        if (Array.isArray(opts.allow))
            config.allowList = [...config.allowList, ...opts.allow];
        if (Array.isArray(opts.deny))
            config.denyList = [...config.denyList, ...opts.deny];
        // Assemble signals (baseline: keywordMatch). Later: intent, path, content, etc.
        const keywords = Array.isArray(opts.keywords)
            ? opts.keywords
            : extractKeywordsFromRules(skillName, rules);
        const signals = [
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
            for (const line of decision.reasoning)
                console.log(line);
            console.log('\nSignals:');
            console.log(JSON.stringify(decision.signals, null, 2));
        }
    });
}
function extractKeywordsFromRules(skillName, rules) {
    const skill = rules[skillName] || {};
    const kw = skill?.promptTriggers?.keywords || [];
    return Array.isArray(kw) ? kw : [];
}
function clamp01(n) {
    if (Number.isNaN(n) || !Number.isFinite(n))
        return 0;
    return Math.max(0, Math.min(1, n));
}
//# sourceMappingURL=activation.js.map