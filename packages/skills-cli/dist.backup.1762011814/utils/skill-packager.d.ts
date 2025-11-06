export interface SkillManifest {
    id: string;
    version: string;
    name: string;
    ['allowed-tools']: string[];
    scripts?: {
        run?: string;
        ['dry-run']?: string;
    };
    hash: string;
    createdAt: string;
}
export interface PackOptions {
    outDir?: string;
    version?: string;
}
export declare function packSkill(skillDir: string, options?: PackOptions): Promise<{
    manifest: SkillManifest;
    packagePath: string;
    manifestPath: string;
}>;
export declare function loadManifest(manifestPath: string): Promise<SkillManifest>;
export declare function verifyPackage(packagePath: string, manifest: SkillManifest): Promise<void>;
export interface InstallOptions {
    targetDir?: string;
    force?: boolean;
}
export declare function installPackage(packagePath: string, manifest: SkillManifest, options?: InstallOptions): Promise<string>;
export declare function createChallengeId(): string;
//# sourceMappingURL=skill-packager.d.ts.map