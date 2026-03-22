import { FileFormat, LintReport, LintOptions, LintContentOptions, LintDirectoryOptions, LintSource, Severity, CustomRuleDefinition, RuleConfig } from './types';
import { PresetName } from './registry';
/**
 * Lint an AI instruction file.
 */
export declare function lint(options: LintOptions): Promise<LintReport>;
/**
 * Lint instruction file content provided as a string.
 */
export declare function lintContent(options: LintContentOptions): LintReport;
/**
 * Scan a directory for AI instruction files and lint each one.
 */
export declare function lintDirectory(options: LintDirectoryOptions): Promise<LintReport[]>;
/**
 * Factory function to create a configured linter for reuse.
 */
export declare function createLinter(config: {
    preset?: PresetName;
    rules?: Record<string, RuleConfig | Severity>;
    customRules?: CustomRuleDefinition[];
}): {
    lint(source: LintSource, projectRoot?: string): Promise<LintReport>;
    lintContent(content: string, format?: FileFormat): LintReport;
};
/**
 * Factory for creating custom rules with type safety.
 */
export declare function createRule(definition: CustomRuleDefinition): CustomRuleDefinition;
//# sourceMappingURL=linter.d.ts.map