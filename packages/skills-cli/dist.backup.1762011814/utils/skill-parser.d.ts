import type { SkillMetadata, ValidationResult } from '../types/skill.js';
export interface ExtendedSkillMetadata extends SkillMetadata {
    id?: string;
    summary?: string;
    when_to_use?: string;
    resources?: string[];
    type?: string;
    enforcement?: string;
}
export declare function parseSkillMD(filePath: string): Promise<ExtendedSkillMetadata>;
export declare function validateSkillStructure(skillPath: string): Promise<ValidationResult>;
//# sourceMappingURL=skill-parser.d.ts.map