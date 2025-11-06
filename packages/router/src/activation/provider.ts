import { type ActivationDecision, type SkillHistoricalData } from './types.js';

export interface HistoricalDataProvider {
  getHistoricalData(skillName: string): Promise<SkillHistoricalData | undefined>;
}

export interface ActivationLogger {
  logActivation(input: {
    skillName: string;
    prompt: string;
    decision: ActivationDecision;
    timestamp: string;
  }): Promise<void> | void;
}


