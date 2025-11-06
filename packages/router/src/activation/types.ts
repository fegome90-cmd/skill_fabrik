export type ActivationContext = {
  currentFile?: string;
  openFiles?: string[];
  gitDiff?: string;
  projectType?: string;
  fileContent?: string;
  recentFiles?: string[];
  historical?: SkillHistoricalData;
};

export type SkillHistoricalData = {
  totalActivations: number;
  accuracy: number; // 0..1
};

export type ActivationSignals = Record<string, number>;

export type ActivationWeights = Record<string, number>;

export type ActivationConfig = {
  threshold: number; // 0..1
  allowList: string[];
  denyList: string[];
  weights: ActivationWeights; // e.g. { keywordMatch: 0.2, intentMatch: 0.2, ... }
};

export type ActivationDecision = {
  activate: boolean;
  finalScore: number; // 0..1
  signals: ActivationSignals;
  reasoning: string[];
  reason: 'allowList' | 'denyList' | 'threshold';
};

export type ScoreInput = {
  skillName: string;
  prompt: string;
  context: ActivationContext;
};

export interface Signal {
  name: string;
  score(input: ScoreInput): Promise<number> | number; // must return 0..1
}


