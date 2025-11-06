import { randomUUID } from 'crypto';

export type Tool =
  | 'fs.read'
  | 'git.status'
  | 'git.diff'
  | 'fs.write'
  | 'git.apply'
  | 'fs.rm'
  | 'fs.unlink'
  | 'fs.rmdir'
  | 'git.reset'
  | 'net.request'
  | 'http.request'
  | 'https.request';

export type PolicyLevel = 'S0' | 'S1' | 'S2' | 'NET';

const TOOL_LEVEL: Record<Tool, PolicyLevel> = {
  'fs.read': 'S0',
  'git.status': 'S0',
  'git.diff': 'S0',
  'fs.write': 'S1',
  'git.apply': 'S1',
  'fs.rm': 'S2',
  'fs.unlink': 'S2',
  'fs.rmdir': 'S2',
  'git.reset': 'S2',
  'net.request': 'NET',
  'http.request': 'NET',
  'https.request': 'NET',
};

const LEVEL_PRIORITY: Record<PolicyLevel, number> = {
  S0: 0,
  S1: 1,
  S2: 2,
  NET: 3,
};

export function normaliseTool(tool: string): Tool | null {
  const key = tool.trim() as Tool;
  return key in TOOL_LEVEL ? key : null;
}

export function isAllowed(tool: Tool, meta?: { allowed?: string[] }): boolean {
  const allow = new Set((meta?.allowed || []).map((s) => String(s).trim()));
  return allow.has(tool) || allow.has('*');
}

export interface PolicyEvaluation {
  policyLevel: PolicyLevel;
  denied: string[];
  challengeId?: string;
  requireConfirm?: boolean;
}

export function evaluatePolicy(
  requested: string[],
  allowed: string[]
): PolicyEvaluation {
  if (requested.length === 0) {
    return { policyLevel: 'S0', denied: [] };
  }

  let highest: PolicyLevel = 'S0';
  const denied: string[] = [];

  for (const raw of requested) {
    const tool = normaliseTool(raw);
    const level: PolicyLevel = tool ? TOOL_LEVEL[tool] : 'S2';
    if (LEVEL_PRIORITY[level] > LEVEL_PRIORITY[highest]) {
      highest = level;
    }
    if (!tool || !isAllowed(tool, { allowed })) {
      denied.push(raw);
    }
  }

  if (highest === 'S0') {
    // For read-only operations, allow when they match allowed tools
    return denied.length === 0
      ? { policyLevel: 'S0', denied: [] }
      : { policyLevel: 'S0', denied };
  }

  if (highest === 'S1') {
    return {
      policyLevel: 'S1',
      denied,
      requireConfirm: denied.length === 0,
      challengeId: randomChallengeId(),
    };
  }

  if (highest === 'S2') {
    return {
      policyLevel: 'S2',
      denied: denied.length > 0 ? denied : requested,
      requireConfirm: false,
    };
  }

  return {
    policyLevel: 'NET',
    denied: denied.length > 0 ? denied : requested,
    requireConfirm: false,
  };
}

export function randomChallengeId(): string {
  return randomUUID();
}
