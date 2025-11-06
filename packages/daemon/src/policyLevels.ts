export type PolicyLevel = 'S0' | 'S1' | 'S2' | 'NET';

export const TOOL_LEVEL: Record<string, PolicyLevel> = {
  'fs.read': 'S0',
  'git.status': 'S0',
  'git.diff': 'S0',
  'fs.write': 'S1',
  'git.apply': 'S1',
  'fs.rm': 'S2',
  'fs.unlink': 'S2',
  'fs.rmdir': 'S2',
  'git.reset': 'S2',
  'git.reset.hard': 'S2',
  'net.request': 'NET',
  'http.request': 'NET',
  'https.request': 'NET',
};

export const LEVEL_PRIORITY: Record<PolicyLevel, number> = {
  S0: 0,
  S1: 1,
  S2: 2,
  NET: 3,
};

export function levelForTool(tool: string): PolicyLevel {
  return TOOL_LEVEL[tool] ?? 'S2';
}
