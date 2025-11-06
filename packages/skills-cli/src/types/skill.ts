export interface SkillMetadata {
  name: string;
  description: string;
  triggers?: {
    keywords?: string[];
    intentPatterns?: string[];
    pathPatterns?: string[];
    contentPatterns?: string[];
  };
  severity?: 'critical' | 'high' | 'medium' | 'low';
  type?: 'guideline' | 'guardrail' | 'workflow' | 'generator' | 'test' | 'policy';
  enforcement?: 'block' | 'require' | 'warn' | 'suggest';
  priority?: 'critical' | 'high' | 'medium' | 'low' | 'normal';
}

export interface SkillMatch {
  skill: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  matchedTriggers: string[];
}

export interface SkillRegistry {
  skills: SkillMetadata[];
  version: string;
  generatedAt: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}
