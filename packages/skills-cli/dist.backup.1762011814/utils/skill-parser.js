"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSkillMD = parseSkillMD;
exports.validateSkillStructure = validateSkillStructure;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path = __importStar(require("path"));
const yaml = __importStar(require("yaml"));
const { readFile, pathExists } = fs_extra_1.default;
async function parseSkillMD(filePath) {
    const content = await readFile(filePath, { encoding: 'utf-8' });
    // Extract YAML frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatterMatch) {
        throw new Error(`No YAML frontmatter found in ${filePath}`);
    }
    const frontmatter = yaml.parse(frontmatterMatch[1]);
    // Return extended metadata with all fields
    return {
        name: frontmatter.name || frontmatter.id || '',
        id: frontmatter.id || frontmatter.name,
        description: frontmatter.description || frontmatter.summary || '',
        summary: frontmatter.summary || frontmatter.description,
        when_to_use: frontmatter.when_to_use,
        resources: frontmatter.resources || [],
        type: frontmatter.type,
        enforcement: frontmatter.enforcement,
        severity: frontmatter.severity || 'medium',
    };
}
async function validateSkillStructure(skillPath) {
    const errors = [];
    const warnings = [];
    const skillMD = path.join(skillPath, 'SKILL.md');
    if (!(await pathExists(skillMD))) {
        errors.push(`SKILL.md not found in ${skillPath}`);
    }
    if (errors.length === 0 && warnings.length === 0) {
        try {
            await parseSkillMD(skillMD);
        }
        catch (error) {
            errors.push(error instanceof Error ? error.message : String(error));
        }
    }
    return {
        valid: errors.length === 0,
        errors,
        warnings,
    };
}
