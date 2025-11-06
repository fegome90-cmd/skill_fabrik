export const READ_ONLY: Record<string, string[]> = {
  'repo-auditor': ['fs.read', 'git.status', 'git.diff'],
  'repo-auditor-deny': ['fs.read', 'git.status', 'git.diff'],
};
